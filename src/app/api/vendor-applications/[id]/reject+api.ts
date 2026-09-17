import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { inngest } from "@/inngest/client";

/**
 * POST /api/vendor-applications/[id]/reject  (admin only)
 * Body: { reason: string }
 *
 * The vendor can edit and resubmit (POST /api/vendor-applications flips it
 * back to `pending`). Emits `vendor/application.rejected`.
 */
export async function POST(request: Request, { id }: Record<string, string>) {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (res) {
    return res as Response;
  }

  const body = (await request.json().catch(() => null)) as {
    reason?: unknown;
  } | null;
  const reason =
    typeof body?.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : null;
  if (!reason) {
    return Response.json({ error: "A reason is required." }, { status: 400 });
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

  const [updated] = await db
    .update(vendorProfiles)
    .set({
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedByProfileId: admin.id,
      updatedAt: new Date(),
    })
    .where(eq(vendorProfiles.id, id))
    .returning();

  await inngest.send({
    name: "vendor/application.rejected",
    data: { vendorProfileId: app.id, profileId: app.profileId, reason },
  });

  return Response.json({ application: updated });
}
