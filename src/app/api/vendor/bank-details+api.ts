import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { resolveAccountNumber } from "@/lib/paystack";
import { resolveBankCode } from "@/lib/payout";
import { requireVendor } from "@/lib/vendor";
import { BANKS } from "@/lib/banks";
import { withApi } from "@/lib/apiHandler";

/**
 * GET   /api/vendor/bank-details — the caller's current bank details
 *       (unmasked — owner viewing their own data, editable from here).
 * PATCH /api/vendor/bank-details — update them post-application. Live-resolves
 *       the account number against the chosen bank via Paystack before saving
 *       (Milestone 7 — catches a fake/mistyped number immediately rather than
 *       only failing later at payout time, and completes the account-name
 *       resolution `vendor-application/bank-details.tsx` explicitly deferred
 *       to this milestone). Clears `paystackRecipientCode` on any change,
 *       since a changed account invalidates the previously created Paystack
 *       transfer recipient.
 */

export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  return Response.json({
    bankName: vendor.bankName,
    bankAccountNumber: vendor.bankAccountNumber,
    bankAccountName: vendor.bankAccountName,
  });
});

export const PATCH = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  let body: { bankName?: unknown; bankAccountNumber?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
  const accountNumber =
    typeof body.bankAccountNumber === "string" ? body.bankAccountNumber.trim() : "";

  if (!(BANKS as readonly string[]).includes(bankName)) {
    return Response.json({ error: "Select a valid bank." }, { status: 400 });
  }
  if (!/^\d{10}$/.test(accountNumber)) {
    return Response.json({ error: "Account number must be 10 digits." }, { status: 400 });
  }

  const bankCode = await resolveBankCode(bankName);
  if (!bankCode) {
    return Response.json(
      { error: `Couldn't verify "${bankName}" with Paystack. Contact support.` },
      { status: 422 },
    );
  }

  let accountName: string;
  try {
    const resolved = await resolveAccountNumber({ accountNumber, bankCode });
    accountName = resolved.account_name;
  } catch {
    return Response.json(
      { error: "Couldn't verify this account number. Double-check the bank and number." },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(vendorProfiles)
    .set({
      bankName,
      bankAccountNumber: accountNumber,
      bankAccountName: accountName,
      paystackRecipientCode: null,
      updatedAt: new Date(),
    })
    .where(eq(vendorProfiles.id, vendor.id))
    .returning({
      bankName: vendorProfiles.bankName,
      bankAccountNumber: vendorProfiles.bankAccountNumber,
      bankAccountName: vendorProfiles.bankAccountName,
    });

  return Response.json(updated);
});
