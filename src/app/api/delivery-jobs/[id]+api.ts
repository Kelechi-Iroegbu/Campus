import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/delivery-jobs/[id] — job detail. Viewable by the requester or the
 * claiming courier. Powers the errand tracking screen (`/deliveries/[id]`).
 */
export const GET = withApi(async (request: Request, { id }: Record<string, string>) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const [row] = await db
    .select({
      job: deliveryJobs,
      pickupVendorName: vendorProfiles.displayName,
    })
    .from(deliveryJobs)
    .leftJoin(vendorProfiles, eq(deliveryJobs.vendorProfileId, vendorProfiles.id))
    .where(eq(deliveryJobs.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const isRequester = row.job.requesterProfileId === profile.id;
  const [courier] = row.job.claimedByVendorProfileId
    ? await db
        .select({ profileId: vendorProfiles.profileId, displayName: vendorProfiles.displayName })
        .from(vendorProfiles)
        .where(eq(vendorProfiles.id, row.job.claimedByVendorProfileId))
        .limit(1)
    : [];
  const isClaimingCourier = courier?.profileId === profile.id;

  if (!isRequester && !isClaimingCourier) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({
    job: row.job,
    pickupVendorName: row.pickupVendorName,
    courierName: courier?.displayName ?? null,
  });
});
