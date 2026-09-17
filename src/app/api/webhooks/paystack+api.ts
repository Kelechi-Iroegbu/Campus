import { verifyWebhookSignature } from "@/lib/paystack";
import { verifyAndCreditTopup } from "@/lib/wallet";

/**
 * POST /api/webhooks/paystack
 *
 * Paystack calls this on every transaction/transfer event. We HMAC-verify the
 * raw body, then re-`verify` the transaction with Paystack (never trust the
 * webhook body alone), then credit the wallet exactly once via
 * `verifyAndCreditTopup` — so a resent webhook is a no-op.
 *
 * Config: set the endpoint URL in the Paystack dashboard → Settings → API
 * Keys & Webhooks. In local dev, expose it with a tunnel (e.g. `ngrok`) — or
 * rely on `/api/wallet/verify`, which the client calls on return from
 * checkout as a fallback that doesn't need the webhook to be reachable.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event: string; data: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) return new Response("ok", { status: 200 });

  if (event.event === "charge.success") {
    await verifyAndCreditTopup(reference);
  }
  // transfer.* events land here too — handled in Milestone 7.

  return new Response("ok", { status: 200 });
}
