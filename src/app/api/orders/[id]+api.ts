import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs, orderItems, orders, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/orders/[id] — order detail. Viewable by the owning student or the
 * owning vendor.
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
      order: orders,
      vendorName: vendorProfiles.displayName,
      vendorCoverPhotoUrl: vendorProfiles.coverPhotoUrl,
      vendorProfileOwnerId: vendorProfiles.profileId,
    })
    .from(orders)
    .innerJoin(vendorProfiles, eq(orders.vendorProfileId, vendorProfiles.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const isStudent = row.order.studentProfileId === profile.id;
  const isVendorOwner = row.vendorProfileOwnerId === profile.id;
  if (!isStudent && !isVendorOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const [deliveryJob] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.orderId, id))
    .limit(1);

  return Response.json({
    order: row.order,
    vendorName: row.vendorName,
    vendorCoverPhotoUrl: row.vendorCoverPhotoUrl,
    items,
    deliveryJob: deliveryJob ?? null,
  });
});
