import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { claimDeliveryJob } from "@/lib/deliveryJobs";
import { sendPushToProfile } from "@/lib/push";
import { withApi } from "@/lib/apiHandler";

/** POST /api/delivery-jobs/[id]/claim — courier-only, atomic, 409 if already claimed. */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "courier" }));
  } catch (res) {
    return res as Response;
  }

  if (!vendor.isOpen) {
    return Response.json(
      { error: "You're offline — go online to claim deliveries" },
      { status: 409 },
    );
  }

  const result = await claimDeliveryJob(id, vendor.id);
  if (!result.ok) {
    const error =
      result.reason === "not_found"
        ? "Not found"
        : result.reason === "already_has_active_job"
          ? "Finish your active delivery before claiming another"
          : "This delivery was already claimed";
    return Response.json({ error }, { status: result.reason === "not_found" ? 404 : 409 });
  }

  const [job] = await db
    .select({ requesterProfileId: deliveryJobs.requesterProfileId })
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, id))
    .limit(1);
  if (job) {
    await sendPushToProfile(job.requesterProfileId, {
      title: "Courier assigned",
      body: `${vendor.displayName} is on the way to pick up your delivery.`,
      data: { deliveryJobId: id },
    });
  }

  return Response.json({ ok: true });
});
