import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/react-native";
import { db } from "@/db";
import { paystackTransactions } from "@/db/schema";
import { initiateTransfer, verifyTransfer } from "@/lib/paystack";
import { refundFailedPayout } from "@/lib/payout";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "./client";

/**
 * Vendor payout transfer (PLAN.md Milestone 7).
 *
 * On `vendor/payout.requested`, calls Paystack's Transfer API. The wallet
 * was already debited atomically when the payout was requested
 * (`src/lib/payout.ts`'s `requestPayout`) — this job's only job is to move
 * the real money and, if that turns out to be impossible, refund it back.
 *
 * `initiateTransfer`'s `reference` is not safely retry-idempotent: Paystack
 * returns a hard "duplicate reference" error on a retry, indistinguishable
 * from a genuine failure, if the *first* call actually succeeded but its
 * response was lost (timeout, dropped connection). So an error here isn't
 * immediately treated as a failure — it's reconciled against Paystack
 * directly via `verifyTransfer` first, to tell "actually went through"
 * apart from "genuinely failed" before ever letting this step's error
 * propagate (which is what ultimately drives a refund, via `onFailure`
 * below, once retries are exhausted).
 */
type PayoutRequestedData = {
  paystackTransactionId: string;
  reference: string;
  recipientCode: string;
  profileId: string;
  netMinor: number;
};

export const processVendorPayout = inngest.createFunction(
  {
    id: "vendor-payout-transfer",
    triggers: [{ event: "vendor/payout.requested" }],
    // Fires once retries are exhausted — not a plain try/catch inside the
    // handler, which would silently swallow the error and defeat Inngest's
    // retry behavior for the transient-failure case.
    onFailure: async ({ event, step }) => {
      const data = event.data.event.data as PayoutRequestedData;
      const result = await step.run("refund-failed-payout", () =>
        refundFailedPayout(data.reference, "system"),
      );
      if (result.ok) {
        await step.run("notify-payout-failed", () =>
          sendPushToProfile(data.profileId, {
            title: "Payout failed",
            body: "We couldn't complete your payout — your wallet has been refunded.",
            data: { reference: data.reference },
          }),
        );
      }
    },
  },
  async ({ event, step }) => {
    const data = event.data as PayoutRequestedData;

    await step.run("initiate-transfer", () =>
      Sentry.startSpan(
        {
          op: "payout.transfer",
          name: "vendor-payout-transfer",
          attributes: { "paystack.reference": data.reference, "vendor.profile_id": data.profileId },
        },
        async () => {
          try {
            const transfer = await initiateTransfer({
              amountMinor: data.netMinor,
              recipientCode: data.recipientCode,
              reference: data.reference,
              reason: "Vendor payout",
            });
            await db
              .update(paystackTransactions)
              .set({ paystackId: transfer.transfer_code, updatedAt: new Date() })
              .where(eq(paystackTransactions.reference, data.reference));
          } catch (err) {
            const verified = await verifyTransfer(data.reference);
            if (verified && verified.status !== "failed" && verified.status !== "reversed") {
              // Actually went through despite the error we saw — not a failure.
              Sentry.logger.warn(
                Sentry.logger.fmt`Transfer errored but reconciled as ${verified.status}: ${data.reference}`,
                { reference: data.reference, error: err instanceof Error ? err.message : String(err) },
              );
              await db
                .update(paystackTransactions)
                .set({ paystackId: verified.transfer_code, updatedAt: new Date() })
                .where(eq(paystackTransactions.reference, data.reference));
              return;
            }
            Sentry.logger.error(Sentry.logger.fmt`Vendor payout transfer failed: ${data.reference}`, {
              reference: data.reference,
              profileId: data.profileId,
              netMinor: data.netMinor,
              error: err instanceof Error ? err.message : String(err),
            });
            throw err;
          }
        },
      ),
    );

    return { initiated: true };
  },
);
