import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { markPickedUp } from "@/lib/deliveryJobs";
import { sendPushToProfile } from "@/lib/push";
import { withApi } from "@/lib/apiHandler";

/** POST /api/delivery-jobs/[id]/picked-up — courier-only, claimed -> picked_up. */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "courier" }));
  } catch (res) {
    return res as Response;
  }

  const result = await markPickedUp(id, vendor.id);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "not_claimed_by_you" ? 403 : 409;
    const error =
      result.reason === "not_found"
        ? "Not found"
        : result.reason === "not_claimed_by_you"
          ? "This delivery isn't claimed by you"
          : "This delivery can't be marked picked up right now";
    return Response.json({ error }, { status });
  }

  const [job] = await db
    .select({ requesterProfileId: deliveryJobs.requesterProfileId })
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, id))
    .limit(1);
  if (job) {
    await sendPushToProfile(job.requesterProfileId, {
      title: "Picked up",
      body: "Your delivery is on its way.",
      data: { deliveryJobId: id },
    });
  }

  return Response.json({ ok: true });
});
