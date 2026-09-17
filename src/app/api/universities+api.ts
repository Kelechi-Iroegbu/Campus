import { asc } from "drizzle-orm";
import { db } from "@/db";
import { universities } from "@/db/schema";

/** GET /api/universities — reference list for student onboarding. Public. */
export async function GET() {
  const rows = await db
    .select({
      id: universities.id,
      name: universities.name,
      slug: universities.slug,
    })
    .from(universities)
    .orderBy(asc(universities.name));

  return Response.json({ universities: rows });
}
