import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { withApi } from "@/lib/apiHandler";

/**
 * PATCH /api/vendor/logo
 * Set the caller's shop icon/logo (product vendors only — `shopIconUrl` is a
 * product-only field on `vendor_profiles`, see schema.ts).
 */
export const PATCH = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { offeringType: "product" }));
  } catch (res) {
    return res as Response;
  }

  let body: { shopIconUrl?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.shopIconUrl !== "string" || !body.shopIconUrl) {
    return Response.json({ error: "shopIconUrl is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(vendorProfiles)
    .set({ shopIconUrl: body.shopIconUrl, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendor.id))
    .returning({ shopIconUrl: vendorProfiles.shopIconUrl });

  return Response.json({ shopIconUrl: updated.shopIconUrl });
});
