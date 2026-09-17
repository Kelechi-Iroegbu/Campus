import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses, categories, profiles, vendorProfiles } from "@/db/schema";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { parseApplicationInput } from "@/lib/vendorApplications";

/**
 * POST /api/vendor-applications
 *   Create or resubmit the caller's vendor application (one `vendor_profiles`
 *   row per profile). Sets status → `pending`.
 *
 * GET /api/vendor-applications?status=pending&offeringType=product
 *   Admin only — the review queue.
 */

export async function POST(request: Request) {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const parsed = await parseApplicationInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const v = parsed.value;

  const [existing] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.profileId, profile.id))
    .limit(1);

  if (existing && existing.status === "approved") {
    return Response.json(
      { error: "Your vendor account is already approved." },
      { status: 409 },
    );
  }
  if (existing && existing.status === "suspended") {
    return Response.json(
      { error: "This account is suspended — contact support." },
      { status: 409 },
    );
  }

  const fields = {
    offeringType: v.offeringType,
    displayName: v.displayName,
    ownerName: v.ownerName,
    phone: v.phone,
    email: v.email,
    categoryId: v.categoryId,
    vehicleMode: v.vehicleMode,
    campusId: v.campusId,
    address: v.address,
    description: v.description,
    coverPhotoUrl: v.coverPhotoUrl,
    shopIconUrl: v.shopIconUrl,
    govIdUrl: v.govIdUrl,
    selfieUrl: v.selfieUrl,
    bankName: v.bankName,
    bankAccountNumber: v.bankAccountNumber,
    bankAccountName: v.bankAccountName,
    status: "pending" as const,
    rejectionReason: null,
    submittedAt: new Date(),
    updatedAt: new Date(),
  };

  const [row] = existing
    ? await db
        .update(vendorProfiles)
        .set(fields)
        .where(eq(vendorProfiles.id, existing.id))
        .returning()
    : await db
        .insert(vendorProfiles)
        .values({ profileId: profile.id, ...fields })
        .returning();

  return Response.json({ application: row }, { status: existing ? 200 : 201 });
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch (res) {
    return res as Response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";
  const offeringType = url.searchParams.get("offeringType");

  const where = [
    eq(vendorProfiles.status, status as "pending"),
    ...(offeringType
      ? [eq(vendorProfiles.offeringType, offeringType as "product")]
      : []),
  ];

  const rows = await db
    .select({
      id: vendorProfiles.id,
      offeringType: vendorProfiles.offeringType,
      displayName: vendorProfiles.displayName,
      status: vendorProfiles.status,
      submittedAt: vendorProfiles.submittedAt,
      applicantName: profiles.name,
      applicantEmail: profiles.email,
      campusName: campuses.name,
      categoryName: categories.name,
    })
    .from(vendorProfiles)
    .innerJoin(profiles, eq(vendorProfiles.profileId, profiles.id))
    .leftJoin(campuses, eq(vendorProfiles.campusId, campuses.id))
    .leftJoin(categories, eq(vendorProfiles.categoryId, categories.id))
    .where(and(...where))
    .orderBy(desc(vendorProfiles.submittedAt));

  return Response.json({ applications: rows });
}
