import * as Crypto from "expo-crypto";
import { db } from "@/db";
import { paystackTransactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import { initializeTransaction } from "@/lib/paystack";

const MIN_TOPUP_MINOR = 100_00; // ₦100
const MAX_TOPUP_MINOR = 500_000_00; // ₦500,000

/**
 * POST /api/wallet/topup
 * Body: { amountMinor: number }
 *
 * Creates a pending `paystack_transactions` row and asks Paystack for a hosted
 * checkout URL. The client opens `authorizationUrl` with
 * `WebBrowser.openAuthSessionAsync`; the wallet is only credited later by
 * `/api/webhooks/paystack` (or a verify poll) — never here.
 */
export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  let amountMinor: number;
  try {
    const body = (await request.json()) as { amountMinor?: unknown };
    amountMinor = Math.round(Number(body.amountMinor));
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    !Number.isFinite(amountMinor) ||
    amountMinor < MIN_TOPUP_MINOR ||
    amountMinor > MAX_TOPUP_MINOR
  ) {
    return Response.json(
      { error: "Enter an amount between ₦100 and ₦500,000." },
      { status: 400 },
    );
  }

  const wallet = await getOrCreateWallet(user.id, "student");
  const reference = `topup_${Crypto.randomUUID()}`;
  const callbackUrl = new URL(
    "/api/wallet/paystack-return",
    request.url,
  ).toString();

  let init;
  try {
    init = await initializeTransaction({
      email: user.email,
      amountMinor,
      reference,
      callbackUrl,
      metadata: {
        profileId: user.id,
        walletId: wallet.id,
        purpose: "wallet_topup",
      },
      channels: ["card", "bank", "ussd", "bank_transfer"],
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Paystack error" },
      { status: 502 },
    );
  }

  await db.insert(paystackTransactions).values({
    profileId: user.id,
    walletId: wallet.id,
    type: "topup",
    reference,
    amountMinor,
    status: "pending",
    accessCode: init.access_code,
    authorizationUrl: init.authorization_url,
  });

  return Response.json({
    reference,
    authorizationUrl: init.authorization_url,
    accessCode: init.access_code,
  });
}
