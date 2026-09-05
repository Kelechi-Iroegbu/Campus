/**
 * Thin Paystack REST wrappers (PLAN.md — Milestone 4 / 7).
 *
 * Server-only. `PAYSTACK_SECRET_KEY` must never be exposed to the client —
 * only import this from `+api.ts` route handlers.
 *
 * Amounts are always in minor units (kobo) — Paystack expects and returns kobo.
 */

const BASE_URL = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. Add your Paystack test secret key to .env.",
    );
  }
  return key;
}

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as
    | PaystackResponse<T>
    | null;

  if (!res.ok || !body || body.status !== true) {
    const message =
      body?.message ?? `Paystack request failed (${res.status} ${path})`;
    throw new Error(message);
  }

  return body.data;
}

export type InitializeTransactionResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

/**
 * Create a hosted checkout session. The client opens `authorization_url`
 * in a browser tab (`WebBrowser.openAuthSessionAsync`); Paystack redirects
 * back to `callbackUrl` when done.
 */
export function initializeTransaction(params: {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}): Promise<InitializeTransactionResult> {
  return paystackFetch<InitializeTransactionResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountMinor,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: params.channels,
    }),
  });
}

export type VerifyTransactionResult = {
  id: number;
  status: "success" | "failed" | "abandoned" | "reversed" | string;
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  paid_at: string | null;
  customer: { email: string };
  authorization: {
    authorization_code: string | null;
    card_type: string | null;
    last4: string | null;
    exp_month: string | null;
    exp_year: string | null;
    bank: string | null;
    reusable: boolean;
  } | null;
  metadata: Record<string, unknown> | null;
};

/** Source-of-truth check on a transaction's final state. */
export function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  return paystackFetch<VerifyTransactionResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export type TransferRecipientResult = { recipient_code: string };

/** Create a transfer recipient (vendor/courier payout — Milestone 7). */
export function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<TransferRecipientResult> {
  return paystackFetch<TransferRecipientResult>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
  });
}

export type TransferResult = {
  transfer_code: string;
  reference: string;
  status: string;
};

/** Initiate a payout to a recipient (Milestone 7). */
export function initiateTransfer(params: {
  amountMinor: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}): Promise<TransferResult> {
  return paystackFetch<TransferResult>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: params.amountMinor,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    }),
  });
}

export type ResolveAccountResult = {
  account_number: string;
  account_name: string;
};

/** Resolve a bank account to its registered name (vendor bank-details step). */
export function resolveAccountNumber(params: {
  accountNumber: string;
  bankCode: string;
}): Promise<ResolveAccountResult> {
  return paystackFetch<ResolveAccountResult>(
    `/bank/resolve?account_number=${encodeURIComponent(
      params.accountNumber,
    )}&bank_code=${encodeURIComponent(params.bankCode)}`,
  );
}

/**
 * Verify a webhook payload against the `x-paystack-signature` header
 * (HMAC-SHA512 of the raw body with the secret key). Uses WebCrypto so it
 * runs in the Expo Router server runtime.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey()),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time-ish compare.
  if (hex.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hex.length; i++) {
    mismatch |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
