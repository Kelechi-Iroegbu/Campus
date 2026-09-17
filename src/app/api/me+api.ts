import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses, profiles, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

/**
 * GET  /api/me   → the caller's profile (+ derived flags), lazily created.
 * PATCH /api/me  → student onboarding writes (name, phone, university, campus).
 */

function shape(
  profile: typeof profiles.$inferSelect,
  vendor: {
    status: string;
    offeringType: string;
    isOpen: boolean;
    shopIconUrl: string | null;
    coverPhotoUrl: string | null;
  } | null,
) {
  return {
    profile: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      phone: profile.phone,
      universityId: profile.universityId,
      campusId: profile.campusId,
      activeRole: profile.activeRole,
      hasChosenRole: profile.hasChosenRole,
      isAdmin: profile.isAdmin,
      onboardedAt: profile.onboardedAt,
    },
    activeRole: profile.activeRole,
    hasChosenRole: profile.hasChosenRole,
    isAdmin: profile.isAdmin,
    isOnboarded: profile.onboardedAt != null,
    vendor: vendor
      ? {
          status: vendor.status,
          offeringType: vendor.offeringType,
          isOpen: vendor.isOpen,
          shopIconUrl: vendor.shopIconUrl,
          coverPhotoUrl: vendor.coverPhotoUrl,
        }
      : null,
    isVendorApproved: vendor?.status === "approved",
  };
}

async function loadVendor(profileId: string) {
  const [vp] = await db
    .select({
      status: vendorProfiles.status,
      offeringType: vendorProfiles.offeringType,
      isOpen: vendorProfiles.isOpen,
      shopIconUrl: vendorProfiles.shopIconUrl,
      coverPhotoUrl: vendorProfiles.coverPhotoUrl,
    })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.profileId, profileId))
    .limit(1);
  return vp ?? null;
}

export async function GET(request: Request) {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const vendor = await loadVendor(profile.id);
  return Response.json(shape(profile, vendor));
}

export async function PATCH(request: Request) {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  let body: {
    name?: unknown;
    phone?: unknown;
    image?: unknown;
    universityId?: unknown;
    campusId?: unknown;
    activeRole?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    patch.phone = body.phone.trim() || null;
  }
  if (typeof body.image === "string") {
    patch.image = body.image || null;
  }

  const universityId =
    typeof body.universityId === "string" ? body.universityId : undefined;
  const campusId =
    typeof body.campusId === "string" ? body.campusId : undefined;

  if (universityId && campusId) {
    const [campus] = await db
      .select({ id: campuses.id })
      .from(campuses)
      .where(and(eq(campuses.id, campusId), eq(campuses.universityId, universityId)))
      .limit(1);
    if (!campus) {
      return Response.json(
        { error: "That campus does not belong to that university." },
        { status: 400 },
      );
    }
    patch.universityId = universityId;
    patch.campusId = campusId;
  } else if (universityId || campusId) {
    return Response.json(
      { error: "Pass both universityId and campusId together." },
      { status: 400 },
    );
  }

  if (body.activeRole !== undefined) {
    if (body.activeRole !== "student" && body.activeRole !== "vendor") {
      return Response.json(
        { error: 'activeRole must be "student" or "vendor"' },
        { status: 400 },
      );
    }
    if (body.activeRole === "vendor") {
      const vendor = await loadVendor(profile.id);
      if (!vendor || vendor.status !== "approved") {
        return Response.json(
          { error: "Only an approved vendor can switch to vendor mode." },
          { status: 403 },
        );
      }
    }
    patch.activeRole = body.activeRole;
    patch.hasChosenRole = true;
  }

  const willHaveCampus = patch.campusId ?? profile.campusId;
  const willHaveName = patch.name ?? profile.name;
  if (!profile.onboardedAt && willHaveCampus && willHaveName) {
    patch.onboardedAt = new Date();
  }

  const [updated] = await db
    .update(profiles)
    .set(patch)
    .where(eq(profiles.id, profile.id))
    .returning();

  const vendor = await loadVendor(profile.id);
  return Response.json(shape(updated, vendor));
}
