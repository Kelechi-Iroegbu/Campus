import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses, categories, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/vendor-applications/mine
 * The caller's own application (+ status). `{ application: null }` if they
 * haven't started one. Used by the pending/approved status screens.
 */
export const GET = withApi(async (request: Request) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const [row] = await db
    .select({
      id: vendorProfiles.id,
      offeringType: vendorProfiles.offeringType,
      displayName: vendorProfiles.displayName,
      coverPhotoUrl: vendorProfiles.coverPhotoUrl,
      shopIconUrl: vendorProfiles.shopIconUrl,
      status: vendorProfiles.status,
      rejectionReason: vendorProfiles.rejectionReason,
      submittedAt: vendorProfiles.submittedAt,
      reviewedAt: vendorProfiles.reviewedAt,
      campusName: campuses.name,
      categoryName: categories.name,
    })
    .from(vendorProfiles)
    .leftJoin(campuses, eq(vendorProfiles.campusId, campuses.id))
    .leftJoin(categories, eq(vendorProfiles.categoryId, categories.id))
    .where(eq(vendorProfiles.profileId, profile.id))
    .limit(1);

  return Response.json({ application: row ?? null });
});
