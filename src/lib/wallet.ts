import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { paymentMethods, paystackTransactions, wallets, walletTransactions } from "@/db/schema";
import { verifyTransaction } from "@/lib/paystack";

/** The transaction client type `dbPool.transaction(...)` hands its callback. */
type Tx = Parameters<Parameters<typeof dbPool.transaction>[0]>[0];

type WalletKind = "student" | "vendor" | "courier";

/** Get the caller's wallet of a given kind, creating it on first use. */
export async function getOrCreateWallet(profileId: string, kind: WalletKind) {
  const [existing] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.profileId, profileId), eq(wallets.kind, kind)))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(wallets)
    .values({ profileId, kind })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Lost the create race — read the row the other writer inserted.
  const [row] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.profileId, profileId), eq(wallets.kind, kind)))
    .limit(1);
  return row;
}

type LedgerEntry = {
  walletId: string;
  amountMinor: number;
  reason:
    | "topup"
    | "order_payment"
    | "order_refund"
    | "appointment_payment"
    | "appointment_refund"
    | "courier_earning"
    | "vendor_earning"
    | "payout"
    | "payout_reversal"
    | "adjustment";
  reference?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  /**
   * Run against an existing transaction instead of opening a new one — for
   * composing with other writes (e.g. an order status update) that must
   * commit or roll back together. Defaults to opening its own transaction.
   */
  tx?: Tx;
};

export type LedgerResult =
  | { applied: true; balanceAfterMinor: number }
  | { applied: false; reason: "duplicate" | "insufficient_funds" };

/**
 * Atomically move money and write the matching ledger row.
 *
 * `idempotencyKey` makes this safe to call more than once for the same event
 * (resent Paystack webhook, retried request) — the second call is a no-op.
 */
export async function applyCredit(entry: LedgerEntry): Promise<LedgerResult> {
  const run = async (tx: Tx): Promise<LedgerResult> => {
    const dup = await tx
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(eq(walletTransactions.idempotencyKey, entry.idempotencyKey))
      .limit(1);
    if (dup.length > 0) return { applied: false, reason: "duplicate" };

    const [updated] = await tx
      .update(wallets)
      .set({
        balanceMinor: sql`${wallets.balanceMinor} + ${entry.amountMinor}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, entry.walletId))
      .returning({ balanceMinor: wallets.balanceMinor });

    await tx.insert(walletTransactions).values({
      walletId: entry.walletId,
      direction: "credit",
      amountMinor: entry.amountMinor,
      balanceAfterMinor: updated.balanceMinor,
      reason: entry.reason,
      reference: entry.reference,
      idempotencyKey: entry.idempotencyKey,
      metadata: entry.metadata,
    });

    return { applied: true, balanceAfterMinor: updated.balanceMinor };
  };

  return entry.tx ? run(entry.tx) : dbPool.transaction(run);
}

export async function applyDebit(entry: LedgerEntry): Promise<LedgerResult> {
  const run = async (tx: Tx): Promise<LedgerResult> => {
    const dup = await tx
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(eq(walletTransactions.idempotencyKey, entry.idempotencyKey))
      .limit(1);
    if (dup.length > 0) return { applied: false, reason: "duplicate" };

    // Conditional debit — only succeeds if the balance can cover it.
    const [updated] = await tx
      .update(wallets)
      .set({
        balanceMinor: sql`${wallets.balanceMinor} - ${entry.amountMinor}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(wallets.id, entry.walletId),
          sql`${wallets.balanceMinor} >= ${entry.amountMinor}`,
        ),
      )
      .returning({ balanceMinor: wallets.balanceMinor });

    if (!updated) return { applied: false, reason: "insufficient_funds" };

    await tx.insert(walletTransactions).values({
      walletId: entry.walletId,
      direction: "debit",
      amountMinor: entry.amountMinor,
      balanceAfterMinor: updated.balanceMinor,
      reason: entry.reason,
      reference: entry.reference,
      idempotencyKey: entry.idempotencyKey,
      metadata: entry.metadata,
    });

    return { applied: true, balanceAfterMinor: updated.balanceMinor };
  };

  return entry.tx ? run(entry.tx) : dbPool.transaction(run);
}

export type VerifyAndCreditResult =
  | { status: "credited"; balanceMinor: number }
  | { status: "already_processed" }
  | { status: "failed" }
  | { status: "not_found" };

/**
 * Re-verify a Paystack reference and credit the wallet exactly once, via
 * `applyCredit`'s idempotency key. Shared by `/api/webhooks/paystack` (the
 * production path) and `/api/wallet/verify` (a local-dev-friendly fallback
 * for environments the Paystack webhook can't reach — e.g. no public tunnel)
 * — safe for both to call the same reference, in any order.
 */
export async function verifyAndCreditTopup(
  reference: string,
): Promise<VerifyAndCreditResult> {
  const [txn] = await db
    .select()
    .from(paystackTransactions)
    .where(eq(paystackTransactions.reference, reference))
    .limit(1);

  if (!txn || txn.type !== "topup") return { status: "not_found" };
  if (txn.status === "success") return { status: "already_processed" };

  const verified = await verifyTransaction(reference);
  if (verified.status !== "success") {
    await db
      .update(paystackTransactions)
      .set({ status: "failed", raw: verified as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(paystackTransactions.id, txn.id));
    return { status: "failed" };
  }

  if (verified.amount !== txn.amountMinor || !txn.walletId) {
    // Amount tampering or an orphaned row — flag, don't credit.
    await db
      .update(paystackTransactions)
      .set({ status: "failed", raw: verified as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(paystackTransactions.id, txn.id));
    return { status: "failed" };
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
  // Paystack issues a fresh authorization_code per transaction even for the
  // same physical card, so dedupe on the card's own fingerprint (last4 +
  // expiry + bank) rather than just the authorization_code — otherwise
  // every repeat top-up with the same card would show as a separate
  // "payment method".
  const auth = verified.authorization;
  if (auth?.reusable && auth.authorization_code) {
    const [existingCard] = await db
      .select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.profileId, txn.profileId),
          eq(paymentMethods.last4, auth.last4 ?? ""),
          eq(paymentMethods.expMonth, auth.exp_month ?? ""),
          eq(paymentMethods.expYear, auth.exp_year ?? ""),
          eq(paymentMethods.bank, auth.bank ?? ""),
        ),
      )
      .limit(1);

    if (!existingCard) {
      await db
        .insert(paymentMethods)
        .values({
          profileId: txn.profileId,
          authorizationCode: auth.authorization_code,
          cardType: auth.card_type,
          last4: auth.last4,
          expMonth: auth.exp_month,
          expYear: auth.exp_year,
          bank: auth.bank,
        })
        .onConflictDoNothing({ target: paymentMethods.authorizationCode });
    }
  }

  if (!result.applied) return { status: "already_processed" };
  return { status: "credited", balanceMinor: result.balanceAfterMinor };
}
