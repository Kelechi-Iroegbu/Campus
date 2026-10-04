import { and, eq } from "drizzle-orm";
import * as Sentry from "@sentry/react-native";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { paystackTransactions, vendorProfiles } from "@/db/schema";
import { MIN_PAYOUT_MINOR } from "@/lib/constants";
import {
  createTransferRecipient,
  listBanks,
  resolveAccountNumber,
  type BankListEntry,
} from "@/lib/paystack";
import { applyCredit, applyDebit, getOrCreateWallet } from "@/lib/wallet";
import type { VendorProfile } from "@/lib/vendor";

/**
 * Vendor/courier payout lifecycle (PLAN.md Milestone 7). Mirrors
 * `orders.ts`/`appointments.ts`'s shape: no-op-safe lifecycle functions
 * shared by the request route and the Inngest transfer job.
 */

/**
 * Paystack's Nigeria NGN transfer pricing is a flat tier by amount. Not
 * exposed as a pre-transfer quote, so this is an estimate withheld from the
 * vendor's payout up front (confirmed with the user: the vendor absorbs the
 * fee, not the platform).
 */
export function estimateTransferFeeMinor(amountMinor: number): number {
  if (amountMinor <= 5_000_00) return 10_00;
  if (amountMinor <= 50_000_00) return 25_00;
  return 50_00;
}

let bankListCache: BankListEntry[] | null = null;

async function getBankList(): Promise<BankListEntry[]> {
  if (!bankListCache) {
    bankListCache = await listBanks();
  }
  return bankListCache;
}

/**
 * Resolve a display bank name (as stored on `vendor_profiles.bank_name`,
 * picked from `lib/banks.ts`'s list) to its Paystack bank code — fetched
 * live from Paystack rather than hardcoded, since a wrong code here means a
 * real transfer to the wrong institution.
 */
export async function resolveBankCode(bankName: string): Promise<string | null> {
  const banks = await getBankList();
  const match = banks.find(
    (b) => b.name.trim().toLowerCase() === bankName.trim().toLowerCase(),
  );
  return match?.code ?? null;
}

export type EnsureRecipientResult = { recipientCode: string } | { error: string };

/**
 * Get the vendor's Paystack transfer recipient, creating one lazily on
 * first payout if needed. Always resolves the account number first and
 * uses Paystack's own resolved name for the recipient (not the vendor-typed
 * one) — `vendor-application/bank-details.tsx` explicitly defers this
 * verification to this milestone.
 */
export function ensureTransferRecipient(
  vendor: VendorProfile,
): Promise<EnsureRecipientResult> {
  return Sentry.startSpan(
    { op: "payout.ensure_recipient", name: "ensureTransferRecipient", attributes: { "vendor.profile_id": vendor.id } },
    () => runEnsureTransferRecipient(vendor),
  );
}

async function runEnsureTransferRecipient(
  vendor: VendorProfile,
): Promise<EnsureRecipientResult> {
  if (vendor.paystackRecipientCode) {
    return { recipientCode: vendor.paystackRecipientCode };
  }
  if (!vendor.bankName || !vendor.bankAccountNumber) {
    return { error: "Add your bank details in your profile before requesting a payout." };
  }

  const bankCode = await resolveBankCode(vendor.bankName);
  if (!bankCode) {
    return { error: `Couldn't verify "${vendor.bankName}" with Paystack. Contact support.` };
  }

  let resolvedName: string;
  try {
    const resolved = await resolveAccountNumber({
      accountNumber: vendor.bankAccountNumber,
      bankCode,
    });
    resolvedName = resolved.account_name;
  } catch (err) {
    Sentry.logger.error(Sentry.logger.fmt`Account resolution failed for vendor ${vendor.id}`, {
      vendorProfileId: vendor.id,
      bankCode,
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: "Couldn't verify your account number. Double-check your bank details." };
  }

  let recipientCode: string;
  try {
    const recipient = await createTransferRecipient({
      name: resolvedName,
      accountNumber: vendor.bankAccountNumber,
      bankCode,
    });
    recipientCode = recipient.recipient_code;
  } catch (err) {
    Sentry.logger.error(Sentry.logger.fmt`Transfer recipient creation failed for vendor ${vendor.id}`, {
      vendorProfileId: vendor.id,
      bankCode,
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: "Couldn't set up your payout account with Paystack. Try again shortly." };
  }

  await db
    .update(vendorProfiles)
    .set({ paystackRecipientCode: recipientCode, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendor.id));

  return { recipientCode };
}

export type RequestPayoutResult =
  | {
      ok: true;
      paystackTransactionId: string;
      reference: string;
      recipientCode: string;
      profileId: string;
      grossMinor: number;
      feeMinor: number;
      netMinor: number;
    }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "below_minimum" }
  | { ok: false; reason: "recipient_error"; message: string }
  | { ok: false; reason: "insufficient_funds" };

/** A payout always sweeps the full wallet balance — no partial withdrawal. */
export function requestPayout(vendorProfileId: string): Promise<RequestPayoutResult> {
  return Sentry.startSpan(
    { op: "payout.request", name: "requestPayout", attributes: { "vendor.profile_id": vendorProfileId } },
    async (span) => {
      const result = await runRequestPayout(vendorProfileId);
      span.setAttribute("payout.ok", result.ok);
      if (!result.ok) span.setAttribute("payout.reason", result.reason);
      return result;
    },
  );
}

async function runRequestPayout(vendorProfileId: string): Promise<RequestPayoutResult> {
  const [vendor] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, vendorProfileId))
    .limit(1);
  if (!vendor) return { ok: false, reason: "not_found" };

  const walletKind = vendor.offeringType === "courier" ? "courier" : "vendor";
  const wallet = await getOrCreateWallet(vendor.profileId, walletKind);

  if (wallet.balanceMinor < MIN_PAYOUT_MINOR) {
    return { ok: false, reason: "below_minimum" };
  }

  // Recipient setup can involve a couple of Paystack round-trips — do it
  // before touching the wallet, then re-read the balance immediately
  // before debiting so a "full sweep" reflects the freshest balance rather
  // than a value read a second or two earlier.
  const recipientResult = await ensureTransferRecipient(vendor);
  if ("error" in recipientResult) {
    return { ok: false, reason: "recipient_error", message: recipientResult.error };
  }

  const freshWallet = await getOrCreateWallet(vendor.profileId, walletKind);
  const grossMinor = freshWallet.balanceMinor;
  const feeMinor = estimateTransferFeeMinor(grossMinor);
  const netMinor = grossMinor - feeMinor;
  const reference = `payout_${crypto.randomUUID()}`;

  let debitFailed = false;
  let paystackTransactionId = "";
  await dbPool.transaction(async (tx) => {
    const result = await applyDebit({
      tx,
      walletId: freshWallet.id,
      amountMinor: grossMinor,
      reason: "payout",
      reference,
      idempotencyKey: `payout:${reference}`,
      metadata: { feeMinor, netMinor },
    });
    if (!result.applied) {
      debitFailed = true;
      return;
    }

    const [row] = await tx
      .insert(paystackTransactions)
      .values({
        profileId: vendor.profileId,
        walletId: freshWallet.id,
        type: "transfer",
        reference,
        amountMinor: netMinor,
        feeMinor,
        status: "pending",
      })
      .returning({ id: paystackTransactions.id });
    paystackTransactionId = row.id;
  });

  if (debitFailed) return { ok: false, reason: "insufficient_funds" };

  Sentry.logger.info(Sentry.logger.fmt`Payout requested: ${reference}`, {
    reference,
    vendorProfileId: vendor.profileId,
    grossMinor,
    feeMinor,
    netMinor,
  });

  return {
    ok: true,
    paystackTransactionId,
    reference,
    recipientCode: recipientResult.recipientCode,
    profileId: vendor.profileId,
    grossMinor,
    feeMinor,
    netMinor,
  };
}

export type RefundPayoutResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already_resolved" };

function isUniqueViolation(err: unknown): boolean {
  const code =
    (err as { code?: string } | undefined)?.code ??
    (err as { cause?: { code?: string } } | undefined)?.cause?.code;
  return code === "23505";
}

/**
 * Refunds a payout that failed (or was reversed) — called from both the
 * Inngest `onFailure` handler and the `transfer.failed`/`transfer.reversed`
 * webhook, whichever fires first. No-op-safe two ways over: a conditional
 * `status = 'pending' → 'failed'` transition (in the same transaction as
 * the credit) closes the race for the normal case, and `applyCredit`'s own
 * `idempotencyKey` unique constraint is a backstop if a true race still
 * slips through both status checks.
 */
export function refundFailedPayout(
  reference: string,
  by: "system" | "webhook",
): Promise<RefundPayoutResult> {
  return Sentry.startSpan(
    { op: "payout.refund", name: "refundFailedPayout", attributes: { "paystack.reference": reference, "payout.refunded_by": by } },
    async (span) => {
      const result = await runRefundFailedPayout(reference, by);
      span.setAttribute("payout.ok", result.ok);
      return result;
    },
  );
}

async function runRefundFailedPayout(
  reference: string,
  by: "system" | "webhook",
): Promise<RefundPayoutResult> {
  const [txn] = await db
    .select()
    .from(paystackTransactions)
    .where(eq(paystackTransactions.reference, reference))
    .limit(1);
  if (!txn || !txn.walletId) return { ok: false, reason: "not_found" };

  let refunded = false;
  try {
    await dbPool.transaction(async (tx) => {
      const [updated] = await tx
        .update(paystackTransactions)
        .set({ status: "failed", updatedAt: new Date() })
        .where(
          and(
            eq(paystackTransactions.id, txn.id),
            eq(paystackTransactions.status, "pending"),
          ),
        )
        .returning({ id: paystackTransactions.id });
      if (!updated) return; // already resolved by the other call site

      await applyCredit({
        tx,
        walletId: txn.walletId!,
        amountMinor: txn.amountMinor + (txn.feeMinor ?? 0),
        reason: "payout_reversal",
        reference: txn.reference,
        idempotencyKey: `payout-reversal:${txn.reference}`,
        metadata: { refundedBy: by },
      });
      refunded = true;
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "already_resolved" };
    throw err;
  }

  if (refunded) {
    Sentry.logger.warn(Sentry.logger.fmt`Payout refunded after failure: ${reference}`, {
      reference,
      profileId: txn.profileId,
      amountMinor: txn.amountMinor + (txn.feeMinor ?? 0),
      by,
    });
  }

  return refunded ? { ok: true } : { ok: false, reason: "already_resolved" };
}
