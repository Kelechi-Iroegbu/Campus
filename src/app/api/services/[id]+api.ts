import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { services, vendorProfiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";

/**
 * GET    /api/services/[id]   — one service (public; used by the booking flow).
 * PATCH  /api/services/[id]   — update (owner).  Body: partial service fields.
 * DELETE /api/services/[id]   — soft-delete (owner).
 */

export async function GET(_request: Request, { id }: Record<string, string>) {
  const [row] = await db
    .select({
      service: services,
      vendorId: vendorProfiles.id,
      vendorName: vendorProfiles.displayName,
      vendorStatus: vendorProfiles.status,
    })
    .from(services)
    .innerJoin(vendorProfiles, eq(services.vendorProfileId, vendorProfiles.id))
    .where(and(eq(services.id, id), isNull(services.deletedAt)))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(request: Request, { id }: Record<string, string>) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const [existing] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), isNull(services.deletedAt)))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.vendorProfileId !== vendor.id) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: Partial<typeof services.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    patch.name = body.name.trim();
  }
  if (typeof body.description === "string") {
    patch.description = body.description.trim() || null;
  }
  if (body.priceMinor !== undefined) {
    const p = Math.round(Number(body.priceMinor));
    if (!Number.isFinite(p) || p <= 0) {
      return Response.json({ error: "Invalid price." }, { status: 400 });
    }
    patch.priceMinor = p;
  }
  if (body.durationMinutes !== undefined) {
    const d = Math.round(Number(body.durationMinutes));
    if (!Number.isFinite(d) || d <= 0) {
      return Response.json({ error: "Invalid duration." }, { status: 400 });
    }
    patch.durationMinutes = d;
  }
  if (body.isActive !== undefined) {
    patch.isActive = Boolean(body.isActive);
  }

  const [row] = await db
    .update(services)
    .set(patch)
    .where(eq(services.id, id))
    .returning();

  return Response.json({ service: row });
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const [existing] = await db
    .select({ vendorProfileId: services.vendorProfileId })
    .from(services)
    .where(and(eq(services.id, id), isNull(services.deletedAt)))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.vendorProfileId !== vendor.id) {
    return new Response("Forbidden", { status: 403 });
  }

  await db
    .update(services)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(services.id, id));

  return Response.json({ ok: true });
}
