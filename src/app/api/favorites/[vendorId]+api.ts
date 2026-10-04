import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { favoriteVendors } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/** DELETE /api/favorites/[vendorId] — unfavorite. No-op if not favorited. */
export const DELETE = withApi(async (request: Request, { vendorId }: Record<string, string>) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  await db
    .delete(favoriteVendors)
    .where(
      and(
        eq(favoriteVendors.profileId, profile.id),
        eq(favoriteVendors.vendorProfileId, vendorId),
      ),
    );

  return Response.json({ ok: true });
});
