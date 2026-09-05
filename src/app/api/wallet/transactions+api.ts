import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { walletTransactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";

/**
 * GET /api/wallet/transactions
 * Returns the student wallet's current balance + recent ledger rows.
 * The client polls this after returning from a Paystack top-up.
 */
export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const wallet = await getOrCreateWallet(user.id, "student");

  const rows = await db
    .select({
      id: walletTransactions.id,
      direction: walletTransactions.direction,
      amountMinor: walletTransactions.amountMinor,
      balanceAfterMinor: walletTransactions.balanceAfterMinor,
      reason: walletTransactions.reason,
      reference: walletTransactions.reference,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(50);

  return Response.json({
    balanceMinor: wallet.balanceMinor,
    currency: wallet.currency,
    transactions: rows,
  });
}
