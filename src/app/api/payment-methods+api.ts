import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/payment-methods
 * The caller's saved cards — captured automatically by a Paystack top-up
 * with a reusable authorization (see `verifyAndCreditTopup` in
 * `src/lib/wallet.ts`), never entered directly in the app.
 */
export const GET = withApi(async (request: Request) => {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const rows = await db
    .select({
      id: paymentMethods.id,
      cardType: paymentMethods.cardType,
      last4: paymentMethods.last4,
      expMonth: paymentMethods.expMonth,
      expYear: paymentMethods.expYear,
      bank: paymentMethods.bank,
      isDefault: paymentMethods.isDefault,
      createdAt: paymentMethods.createdAt,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.profileId, user.id))
    .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

  return Response.json({ paymentMethods: rows });
});
