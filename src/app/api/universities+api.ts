import { asc } from "drizzle-orm";
import { db } from "@/db";
import { universities } from "@/db/schema";
import { withApi } from "@/lib/apiHandler";

/** GET /api/universities — reference list for student onboarding. Public. */
export const GET = withApi(async () => {
  const rows = await db
    .select({
      id: universities.id,
      name: universities.name,
      slug: universities.slug,
    })
    .from(universities)
    .orderBy(asc(universities.name));

  return Response.json({ universities: rows });
});
