import { and, eq } from "drizzle-orm";
import * as Sentry from "@sentry/react-native";
import { db } from "@/db";
import { paystackTransactions } from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/paystack";
import { refundFailedPayout } from "@/lib/payout";
import { sendPushToProfile } from "@/lib/push";
import { verifyAndCreditTopup } from "@/lib/wallet";
import { withApi } from "@/lib/apiHandler";

/**
 * POST /api/webhooks/paystack
 *
 * Paystack calls this on every transaction/transfer event. We HMAC-verify the
 * raw body, then re-`verify` the transaction with Paystack (never trust the
 * webhook body alone), then credit the wallet exactly once via
 * `verifyAndCreditTopup` — so a resent webhook is a no-op.
 *
 * Config: set the endpoint URL in the Paystack dashboard → Settings → API
 * Keys & Webhooks. In local dev, expose it with a tunnel (e.g. `ngrok`) — or
 * rely on `/api/wallet/verify`, which the client calls on return from
 * checkout as a fallback that doesn't need the webhook to be reachable.
 */
export const POST = withApi(async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    Sentry.logger.warn("Paystack webhook rejected: invalid signature", {
      hasSignature: !!signature,
    });
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event: string; data: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) return new Response("ok", { status: 200 });

  return Sentry.startSpan(
    {
      op: "http.server",
      name: `webhook paystack: ${event.event}`,
      attributes: { "paystack.event": event.event, "paystack.reference": reference },
    },
    async () => {
      if (event.event === "charge.success") {
        await verifyAndCreditTopup(reference);
      } else if (event.event === "transfer.success") {
        // Conditional on still "pending" — never resurrect a row a
        // transfer.failed/reversed event already resolved (and refunded) into
        // "success", in the unlikely event webhooks arrive out of order.
        await db
          .update(paystackTransactions)
          .set({ status: "success", updatedAt: new Date() })
          .where(
            and(
              eq(paystackTransactions.reference, reference),
              eq(paystackTransactions.status, "pending"),
            ),
          );
      } else if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
        const [txn] = await db
          .select({ profileId: paystackTransactions.profileId })
          .from(paystackTransactions)
          .where(eq(paystackTransactions.reference, reference))
          .limit(1);
        // Authoritative refund path for a transfer that was accepted at
        // request time but failed/reversed asynchronously afterward — shares
        // its idempotency key with the Inngest `onFailure` refund path
        // (src/inngest/payouts.ts), so whichever fires first wins.
        Sentry.logger.warn(Sentry.logger.fmt`Paystack transfer ${event.event}: ${reference}`, {
          reference,
          event: event.event,
        });
        const result = await refundFailedPayout(reference, "webhook");
        if (result.ok && txn) {
          await sendPushToProfile(txn.profileId, {
            title: "Payout failed",
            body: "We couldn't complete your payout — your wallet has been refunded.",
            data: { reference },
          });
        }
      }

      return new Response("ok", { status: 200 });
    },
  );
});
