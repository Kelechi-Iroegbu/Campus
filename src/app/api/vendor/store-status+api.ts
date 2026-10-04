import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { withApi } from "@/lib/apiHandler";

/**
 * PATCH /api/vendor/store-status
 * Toggle the caller's "accepting orders right now" flag. Any offering type,
 * approved or not (a vendor mid-review can still set their intended status).
 */
export const PATCH = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  let body: { isOpen?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.isOpen !== "boolean") {
    return Response.json({ error: "isOpen must be a boolean" }, { status: 400 });
  }

  const [updated] = await db
    .update(vendorProfiles)
    .set({ isOpen: body.isOpen, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendor.id))
    .returning({ isOpen: vendorProfiles.isOpen });

  return Response.json({ isOpen: updated.isOpen });
});
