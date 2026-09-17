import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { paymentMethods } from "@/db/schema";
import { requireUser } from "@/lib/auth";

/**
 * PATCH  /api/payment-methods/[id]   — set as default. Body: { isDefault: true }.
 * DELETE /api/payment-methods/[id]   — remove a saved card (owner-only).
 */

export async function PATCH(request: Request, { id }: Record<string, string>) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  let body: { isDefault?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  if (body.isDefault !== true) {
    return Response.json({ error: "Only isDefault: true is supported" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.profileId, user.id)))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await dbPool.transaction(async (tx) => {
    await tx
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(and(eq(paymentMethods.profileId, user.id), eq(paymentMethods.isDefault, true)));
    await tx
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(eq(paymentMethods.id, id));
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.profileId, user.id)))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

  return Response.json({ ok: true });
}
