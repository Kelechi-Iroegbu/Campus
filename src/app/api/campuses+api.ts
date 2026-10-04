import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses } from "@/db/schema";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/campuses?universityId=... — campuses, optionally filtered to one
 * university. Reference data for student onboarding. Public.
 */
export const GET = withApi(async (request: Request) => {
  const universityId = new URL(request.url).searchParams.get("universityId");

  const rows = await db
    .select({
      id: campuses.id,
      universityId: campuses.universityId,
      name: campuses.name,
      slug: campuses.slug,
    })
    .from(campuses)
    .where(universityId ? eq(campuses.universityId, universityId) : undefined)
    .orderBy(asc(campuses.name));

  return Response.json({ campuses: rows });
});
