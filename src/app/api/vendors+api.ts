import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { categories, vendorProfiles } from "@/db/schema";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/vendors?type=product|service|all&q=&categoryId=
 *
 * Approved vendors for the student's campus (falls back to all campuses if the
 * caller has no campus set). Powers the student Home feed + Explore.
 */
export async function GET(request: Request) {
  const profile = await getProfile(request);
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const q = url.searchParams.get("q")?.trim();
  const categoryId = url.searchParams.get("categoryId");

  const filters = [eq(vendorProfiles.status, "approved")];

  if (profile?.campusId) {
    filters.push(eq(vendorProfiles.campusId, profile.campusId));
  }
  if (type === "product" || type === "service" || type === "courier") {
    filters.push(eq(vendorProfiles.offeringType, type));
  }
  if (categoryId) {
    filters.push(eq(vendorProfiles.categoryId, categoryId));
  }
  if (q) {
    const like = `%${q}%`;
    const search = or(
      ilike(vendorProfiles.displayName, like),
      ilike(vendorProfiles.description, like),
    );
    if (search) filters.push(search);
  }

  const rows = await db
    .select({
      id: vendorProfiles.id,
      offeringType: vendorProfiles.offeringType,
      displayName: vendorProfiles.displayName,
      description: vendorProfiles.description,
      coverPhotoUrl: vendorProfiles.coverPhotoUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(vendorProfiles)
    .leftJoin(categories, eq(vendorProfiles.categoryId, categories.id))
    .where(and(...filters))
    .orderBy(asc(vendorProfiles.displayName));

  return Response.json({ vendors: rows });
}
