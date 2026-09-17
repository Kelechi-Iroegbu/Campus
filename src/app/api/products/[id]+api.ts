import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { products, vendorProfiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";

/**
 * GET    /api/products/[id]   — one product (public; used by product detail).
 * PATCH  /api/products/[id]   — update (owner).  Body: partial product fields.
 * DELETE /api/products/[id]   — soft-delete (owner).
 */

export async function GET(_request: Request, { id }: Record<string, string>) {
  const [row] = await db
    .select({
      product: products,
      vendorId: vendorProfiles.id,
      vendorName: vendorProfiles.displayName,
      vendorStatus: vendorProfiles.status,
    })
    .from(products)
    .innerJoin(vendorProfiles, eq(products.vendorProfileId, vendorProfiles.id))
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
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
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
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

  const patch: Partial<typeof products.$inferInsert> = { updatedAt: new Date() };
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
  if (typeof body.imageUrl === "string") {
    patch.imageUrl = body.imageUrl || null;
  }
  if (body.isActive !== undefined) {
    patch.isActive = Boolean(body.isActive);
  }

  const [row] = await db
    .update(products)
    .set(patch)
    .where(eq(products.id, id))
    .returning();

  return Response.json({ product: row });
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const [existing] = await db
    .select({ vendorProfileId: products.vendorProfileId })
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.vendorProfileId !== vendor.id) {
    return new Response("Forbidden", { status: 403 });
  }

  await db
    .update(products)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id));

  return Response.json({ ok: true });
}
