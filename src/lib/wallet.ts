import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { wallets, walletTransactions } from "@/db/schema";

type WalletKind = "student" | "vendor" | "courier";

/** Get the caller's wallet of a given kind, creating it on first use. */
export async function getOrCreateWallet(userId: string, kind: WalletKind) {
  const [existing] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.kind, kind)))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(wallets)
    .values({ userId, kind })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Lost the create race — read the row the other writer inserted.
  const [row] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.kind, kind)))
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
  return dbPool.transaction(async (tx) => {
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
  });
}

export async function applyDebit(entry: LedgerEntry): Promise<LedgerResult> {
  return dbPool.transaction(async (tx) => {
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
  });
}
