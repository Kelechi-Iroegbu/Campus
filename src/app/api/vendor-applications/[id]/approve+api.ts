import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { profiles, vendorProfiles, wallets } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { inngest } from "@/inngest/client";
import { withApi } from "@/lib/apiHandler";

/**
 * POST /api/vendor-applications/[id]/approve  (admin only)
 *
 * Flips a `pending` application to `approved`, and — in the same transaction —
 * creates the vendor's wallet with the right `kind` (courier → `courier`,
 * product/service → `vendor`). Emits `vendor/application.approved` for the
 * push-notification job.
 */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (res) {
    return res as Response;
  }

  const [app] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, id))
    .limit(1);

  if (!app) return Response.json({ error: "Not found" }, { status: 404 });
  if (app.status !== "pending") {
    return Response.json(
      { error: `Application is ${app.status}, not pending.` },
      { status: 409 },
    );
  }

  const walletKind = app.offeringType === "courier" ? "courier" : "vendor";

  const updated = await dbPool.transaction(async (tx) => {
    const [row] = await tx
      .update(vendorProfiles)
      .set({
        status: "approved",
        rejectionReason: null,
        reviewedAt: new Date(),
        reviewedByProfileId: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(vendorProfiles.id, id))
      .returning();

    await tx
      .insert(wallets)
      .values({ profileId: app.profileId, kind: walletKind })
      .onConflictDoNothing();

    // The account is now a vendor — make `active_role` reflect it so post-auth
    // routing (and any later role switcher) lands them on the vendor side.
    await tx
      .update(profiles)
      .set({ activeRole: "vendor", updatedAt: new Date() })
      .where(eq(profiles.id, app.profileId));

    return row;
  });

  await inngest.send({
    name: "vendor/application.approved",
    data: {
      vendorProfileId: app.id,
      profileId: app.profileId,
      offeringType: app.offeringType,
    },
  });

  return Response.json({ application: updated });
});
