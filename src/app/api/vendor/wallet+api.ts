import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { walletTransactions } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { getOrCreateWallet } from "@/lib/wallet";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/vendor/wallet
 * The vendor-side twin of `api/wallet/transactions+api.ts` — the caller's
 * own wallet balance + recent ledger rows. Wallet kind follows
 * `offeringType` (courier → "courier" wallet, else "vendor"), so this same
 * route already works for courier accounts once their UI reuses it.
 */
export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const walletKind = vendor.offeringType === "courier" ? "courier" : "vendor";
  const wallet = await getOrCreateWallet(vendor.profileId, walletKind);

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
});
