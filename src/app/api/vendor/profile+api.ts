import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { withApi } from "@/lib/apiHandler";

/**
 * GET   /api/vendor/profile — the caller's editable business info: the same
 *       fields captured at application time (`src/lib/vendorApplication.tsx`'s
 *       `Draft`), now viewable/editable post-approval. Powers
 *       `vendor/profile/business-info.tsx`, `courier/profile/vehicle.tsx`,
 *       and the read-only `.../verification.tsx` screens.
 * PATCH /api/vendor/profile — update them. `categoryId` applies to
 *       product/service vendors, `vehicleMode` to couriers; `govIdUrl`/
 *       `selfieUrl` let a vendor replace a KYC document from the
 *       verification screen. Any offering type, any status — a
 *       not-yet-approved vendor can still fix their own details.
 */

export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  return Response.json({
    offeringType: vendor.offeringType,
    status: vendor.status,
    rejectionReason: vendor.rejectionReason,
    displayName: vendor.displayName,
    ownerName: vendor.ownerName,
    phone: vendor.phone,
    address: vendor.address,
    description: vendor.description,
    categoryId: vendor.categoryId,
    vehicleMode: vendor.vehicleMode,
    govIdUrl: vendor.govIdUrl,
    selfieUrl: vendor.selfieUrl,
  });
});

export const PATCH = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  let body: {
    displayName?: unknown;
    ownerName?: unknown;
    phone?: unknown;
    address?: unknown;
    description?: unknown;
    categoryId?: unknown;
    vehicleMode?: unknown;
    govIdUrl?: unknown;
    selfieUrl?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: Partial<typeof vendorProfiles.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.displayName === "string" && body.displayName.trim()) {
    patch.displayName = body.displayName.trim();
  }
  if (typeof body.ownerName === "string") patch.ownerName = body.ownerName.trim() || null;
  if (typeof body.phone === "string") patch.phone = body.phone.trim() || null;
  if (typeof body.address === "string") patch.address = body.address.trim() || null;
  if (typeof body.description === "string") {
    patch.description = body.description.trim() || null;
  }
  if (
    (vendor.offeringType === "product" || vendor.offeringType === "service") &&
    typeof body.categoryId === "string"
  ) {
    patch.categoryId = body.categoryId;
  }
  if (
    vendor.offeringType === "courier" &&
    (body.vehicleMode === "car" || body.vehicleMode === "bicycle" || body.vehicleMode === "foot")
  ) {
    patch.vehicleMode = body.vehicleMode;
  }
  if (typeof body.govIdUrl === "string") patch.govIdUrl = body.govIdUrl;
  if (typeof body.selfieUrl === "string") patch.selfieUrl = body.selfieUrl;

  const [updated] = await db
    .update(vendorProfiles)
    .set(patch)
    .where(eq(vendorProfiles.id, vendor.id))
    .returning();

  return Response.json({
    offeringType: updated.offeringType,
    status: updated.status,
    rejectionReason: updated.rejectionReason,
    displayName: updated.displayName,
    ownerName: updated.ownerName,
    phone: updated.phone,
    address: updated.address,
    description: updated.description,
    categoryId: updated.categoryId,
    vehicleMode: updated.vehicleMode,
    govIdUrl: updated.govIdUrl,
    selfieUrl: updated.selfieUrl,
  });
});
