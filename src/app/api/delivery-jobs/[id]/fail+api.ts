import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { failDeliveryJob } from "@/lib/deliveryJobs";
import { sendPushToProfile } from "@/lib/push";
import { withApi } from "@/lib/apiHandler";

/**
 * POST /api/delivery-jobs/[id]/fail — courier-only, claimed/picked_up -> failed.
 * Refunds the delivery fee to the requester in full. Body: { reason: string }.
 */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "courier" }));
  } catch (res) {
    return res as Response;
  }

  let body: { reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Unspecified";

  const result = await failDeliveryJob(id, vendor.id, reason);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "not_claimed_by_you" ? 403 : 409;
    const error =
      result.reason === "not_found"
        ? "Not found"
        : result.reason === "not_claimed_by_you"
          ? "This delivery isn't claimed by you"
          : "This delivery can't be marked failed right now";
    return Response.json({ error }, { status });
  }

  const [job] = await db
    .select({ requesterProfileId: deliveryJobs.requesterProfileId })
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, id))
    .limit(1);
  if (job) {
    await sendPushToProfile(job.requesterProfileId, {
      title: "Delivery couldn't be completed",
      body: "We've refunded the delivery fee to your wallet.",
      data: { deliveryJobId: id },
    });
  }

  return Response.json({ ok: true });
});
