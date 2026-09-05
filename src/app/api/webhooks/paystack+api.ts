import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethods, paystackTransactions } from "@/db/schema";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/paystack";
import { applyCredit } from "@/lib/wallet";

/**
 * POST /api/webhooks/paystack
 *
 * Paystack calls this on every transaction/transfer event. We HMAC-verify the
 * raw body, then re-`verify` the transaction with Paystack (never trust the
 * webhook body alone), then credit the wallet exactly once via the
 * ledger's `idempotency_key` — so a resent webhook is a no-op.
 *
 * Config: set the endpoint URL in the Paystack dashboard → Settings → API
 * Keys & Webhooks. In local dev, expose it with a tunnel (e.g. `ngrok`).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!(await verifyWebhookSignature(rawBody, signature))) {
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

  if (event.event === "charge.success") {
    await handleChargeSuccess(reference);
  }
  // transfer.* events land here too — handled in Milestone 7.

  return new Response("ok", { status: 200 });
}

async function handleChargeSuccess(reference: string) {
  const [txn] = await db
    .select()
    .from(paystackTransactions)
    .where(eq(paystackTransactions.reference, reference))
    .limit(1);

  // Unknown reference, or already finalized — nothing to do.
  if (!txn || txn.status === "success" || txn.type !== "topup") return;

  const verified = await verifyTransaction(reference);
  if (verified.status !== "success") {
    await db
      .update(paystackTransactions)
      .set({ status: "failed", raw: verified as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(paystackTransactions.id, txn.id));
    return;
  }

  if (verified.amount !== txn.amountMinor || !txn.walletId) {
    // Amount tampering or an orphaned row — flag, don't credit.
    await db
      .update(paystackTransactions)
      .set({ status: "failed", raw: verified as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(paystackTransactions.id, txn.id));
    return;
  }

  const result = await applyCredit({
    walletId: txn.walletId,
    amountMinor: verified.amount,
    reason: "topup",
    reference,
    idempotencyKey: `paystack:${reference}`,
    metadata: { paystackId: verified.id, channel: verified.channel },
  });

  await db
    .update(paystackTransactions)
    .set({
      status: "success",
      paystackId: String(verified.id),
      channel: verified.channel,
      authorizationCode: verified.authorization?.authorization_code ?? null,
      raw: verified as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(paystackTransactions.id, txn.id));

  // Save the reusable card authorization for future one-tap top-ups.
  const auth = verified.authorization;
  if (auth?.reusable && auth.authorization_code) {
    await db
      .insert(paymentMethods)
      .values({
        userId: txn.userId,
        authorizationCode: auth.authorization_code,
        cardType: auth.card_type,
        last4: auth.last4,
        expMonth: auth.exp_month,
        expYear: auth.exp_year,
        bank: auth.bank,
      })
      .onConflictDoNothing();
  }

  void result;
}
