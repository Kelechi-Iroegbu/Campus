import { requireVendor } from "@/lib/vendor";
import { getOrCreateWallet } from "@/lib/wallet";
import { estimateTransferFeeMinor, requestPayout } from "@/lib/payout";
import { MIN_PAYOUT_MINOR } from "@/lib/constants";
import { inngest } from "@/inngest/client";
import { withApi } from "@/lib/apiHandler";

function maskAccountNumber(accountNumber: string): string {
  return accountNumber.length <= 4 ? accountNumber : `••••${accountNumber.slice(-4)}`;
}

/**
 * GET  /api/vendor/payout — preview: balance, minimum, fee/net if requested
 *      now, on-file bank details, and eligibility.
 * POST /api/vendor/payout — request one. Always sweeps the full balance
 *      (confirmed with the user — no partial withdrawal).
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

  const hasBankDetails = !!(vendor.bankName && vendor.bankAccountNumber);
  const belowMinimum = wallet.balanceMinor < MIN_PAYOUT_MINOR;

  let eligible = true;
  let reason: string | undefined;
  if (!hasBankDetails) {
    eligible = false;
    reason = "Add your bank details in your profile before requesting a payout.";
  } else if (belowMinimum) {
    eligible = false;
    reason = `You need at least ₦${(MIN_PAYOUT_MINOR / 100).toLocaleString()} to request a payout.`;
  }

  const feeMinor = estimateTransferFeeMinor(wallet.balanceMinor);
  const netMinor = wallet.balanceMinor - feeMinor;

  return Response.json({
    balanceMinor: wallet.balanceMinor,
    minPayoutMinor: MIN_PAYOUT_MINOR,
    feeMinor,
    netMinor,
    bankName: vendor.bankName,
    bankAccountNumber: vendor.bankAccountNumber
      ? maskAccountNumber(vendor.bankAccountNumber)
      : null,
    bankAccountName: vendor.bankAccountName,
    eligible,
    reason,
  });
});

export const POST = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const result = await requestPayout(vendor.id);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (result.reason === "below_minimum") {
      return Response.json(
        { error: `You need at least ₦${(MIN_PAYOUT_MINOR / 100).toLocaleString()} to request a payout.` },
        { status: 409 },
      );
    }
    if (result.reason === "recipient_error") {
      return Response.json({ error: result.message }, { status: 422 });
    }
    // insufficient_funds here means the balance dropped between the
    // eligibility check and the debit — most likely a second payout
    // request already in flight for the same wallet.
    return Response.json(
      { error: "A payout is already in progress for this wallet." },
      { status: 409 },
    );
  }

  try {
    await inngest.send({
      name: "vendor/payout.requested",
      data: {
        paystackTransactionId: result.paystackTransactionId,
        reference: result.reference,
        recipientCode: result.recipientCode,
        profileId: result.profileId,
        netMinor: result.netMinor,
      },
    });
  } catch (err) {
    console.error("Failed to send vendor/payout.requested event", err);
  }

  return Response.json(
    {
      reference: result.reference,
      grossMinor: result.grossMinor,
      feeMinor: result.feeMinor,
      netMinor: result.netMinor,
    },
    { status: 201 },
  );
});
