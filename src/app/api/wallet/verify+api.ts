import { requireUser } from "@/lib/auth";
import { verifyAndCreditTopup } from "@/lib/wallet";
import { withApi } from "@/lib/apiHandler";

/**
 * POST /api/wallet/verify
 * Body: { reference: string }
 *
 * Local-dev-friendly fallback for `/api/webhooks/paystack` — the client
 * calls this on return from Paystack checkout so the wallet is credited
 * even when Paystack's webhook can't reach this environment (no public
 * tunnel). Shares `verifyAndCreditTopup`'s idempotency key with the webhook,
 * so it's safe regardless of which one runs first, or if both do.
 */
export const POST = withApi(async (request: Request) => {
  try {
    await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  let reference: string;
  try {
    const body = (await request.json()) as { reference?: unknown };
    if (typeof body.reference !== "string" || !body.reference) {
      return Response.json({ error: "Missing reference" }, { status: 400 });
    }
    reference = body.reference;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await verifyAndCreditTopup(reference);

  if (result.status === "not_found") {
    return Response.json({ error: "Unknown reference" }, { status: 404 });
  }
  if (result.status === "failed") {
    return Response.json({ error: "Payment was not successful" }, { status: 409 });
  }

  return Response.json({ status: result.status });
});
