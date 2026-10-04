import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs, vendorProfiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/delivery-jobs/mine — the caller courier's claimed job (if any, via
 * `status`) plus their full claim history. Powers the courier "My Deliveries"
 * screen (active + history tabs, split client-side by status).
 */
export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { offeringType: "courier" }));
  } catch (res) {
    return res as Response;
  }

  const rows = await db
    .select({
      job: deliveryJobs,
      pickupVendorName: vendorProfiles.displayName,
    })
    .from(deliveryJobs)
    .leftJoin(vendorProfiles, eq(deliveryJobs.vendorProfileId, vendorProfiles.id))
    .where(eq(deliveryJobs.claimedByVendorProfileId, vendor.id))
    .orderBy(desc(deliveryJobs.claimedAt));

  return Response.json({ jobs: rows });
});
