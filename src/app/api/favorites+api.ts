import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, favoriteVendors, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * GET  /api/favorites — the caller's favorited vendors, newest first.
 * POST /api/favorites — favorite a vendor. Body: `{ vendorProfileId }`.
 * Idempotent both ways: favoriting an already-favorited vendor is a no-op
 * (unique constraint on profile+vendor), unfavoriting lives at
 * `/api/favorites/[vendorId]`.
 */
export const GET = withApi(async (request: Request) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
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
      isOpen: vendorProfiles.isOpen,
      favoritedAt: favoriteVendors.createdAt,
    })
    .from(favoriteVendors)
    .innerJoin(vendorProfiles, eq(favoriteVendors.vendorProfileId, vendorProfiles.id))
    .leftJoin(categories, eq(vendorProfiles.categoryId, categories.id))
    .where(eq(favoriteVendors.profileId, profile.id))
    .orderBy(desc(favoriteVendors.createdAt));

  return Response.json({ vendors: rows });
});

export const POST = withApi(async (request: Request) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  let body: { vendorProfileId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.vendorProfileId !== "string" || !body.vendorProfileId) {
    return Response.json({ error: "vendorProfileId is required" }, { status: 400 });
  }

  const [vendor] = await db
    .select({ id: vendorProfiles.id })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, body.vendorProfileId))
    .limit(1);
  if (!vendor) return Response.json({ error: "Not found" }, { status: 404 });

  await db
    .insert(favoriteVendors)
    .values({ profileId: profile.id, vendorProfileId: vendor.id })
    .onConflictDoNothing();

  return Response.json({ ok: true });
});
