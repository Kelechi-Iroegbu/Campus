import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { requireProfile, type Profile } from "@/lib/auth";

export type VendorProfile = typeof vendorProfiles.$inferSelect;
export type OfferingType = "product" | "service" | "courier";

/**
 * Resolve the caller's `vendor_profiles` row for a vendor-scoped `+api.ts`
 * handler. Throws a `Response` (403) if they aren't a vendor / aren't
 * approved / are the wrong offering type.
 */
export async function requireVendor(
  request: Request,
  opts?: { approved?: boolean; offeringType?: OfferingType },
): Promise<{ profile: Profile; vendor: VendorProfile }> {
  const profile = await requireProfile(request);

  const [vendor] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.profileId, profile.id))
    .limit(1);

  if (!vendor) {
    throw new Response("Not a vendor", { status: 403 });
  }
  if (opts?.approved && vendor.status !== "approved") {
    throw new Response("Vendor account is not approved", { status: 403 });
  }
  if (opts?.offeringType && vendor.offeringType !== opts.offeringType) {
    throw new Response(`Not a ${opts.offeringType} vendor`, { status: 403 });
  }

  return { profile, vendor };
}
