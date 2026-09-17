import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses, categories, profiles, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

/**
 * GET /api/vendor-applications/[id]
 * Full application detail. Admin can read any; a non-admin can only read their
 * own. Powers the admin review screen.
 */
export async function GET(request: Request, { id }: Record<string, string>) {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  const [row] = await db
    .select({
      application: vendorProfiles,
      applicantName: profiles.name,
      applicantEmail: profiles.email,
      campusName: campuses.name,
      categoryName: categories.name,
    })
    .from(vendorProfiles)
    .innerJoin(profiles, eq(vendorProfiles.profileId, profiles.id))
    .leftJoin(campuses, eq(vendorProfiles.campusId, campuses.id))
    .leftJoin(categories, eq(vendorProfiles.categoryId, categories.id))
    .where(eq(vendorProfiles.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (!profile.isAdmin && row.application.profileId !== profile.id) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json(row);
}
