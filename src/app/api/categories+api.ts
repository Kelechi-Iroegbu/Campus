import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

/**
 * GET /api/categories?kind=product|service
 * Feeds the shared icon-grid picker in the vendor application. Public.
 */
export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");

  const rows = await db
    .select({
      id: categories.id,
      kind: categories.kind,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
    })
    .from(categories)
    .where(kind === "product" || kind === "service" ? eq(categories.kind, kind) : undefined)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return Response.json({ categories: rows });
}
