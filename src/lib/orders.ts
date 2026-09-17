import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { orders, vendorProfiles } from "@/db/schema";
import { applyCredit, getOrCreateWallet } from "@/lib/wallet";

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_cancellable" };

/**
 * Cancels a `placed` order and refunds the student the full amount already
 * debited. No-op-safe: if the order has moved past `placed` (already
 * accepted, already cancelled/completed), returns `not_cancellable` instead
 * of throwing — needed because the accept-timeout job
 * (`src/inngest/order-lifecycle.ts`) can race a legitimate accept.
 */
export async function cancelOrder(
  orderId: string,
  by: "student" | "vendor" | "system",
): Promise<CancelResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "placed") return { ok: false, reason: "not_cancellable" };

  const studentWallet = await getOrCreateWallet(order.studentProfileId, "student");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: studentWallet.id,
      amountMinor: order.totalMinor,
      reason: "order_refund",
      reference: order.id,
      idempotencyKey: `order-refund:${order.id}`,
      metadata: { orderId: order.id, cancelledBy: by },
    });
    await tx
      .update(orders)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  return { ok: true };
}

export type CompleteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_completable" };

/**
 * Marks a `ready` order `completed` and credits the vendor the order's
 * subtotal (not the total — the platform fee is the platform's revenue,
 * never paid out).
 */
export async function completeOrder(orderId: string): Promise<CompleteResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "ready") return { ok: false, reason: "not_completable" };

  const [vendor] = await db
    .select({ profileId: vendorProfiles.profileId })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, order.vendorProfileId))
    .limit(1);
  if (!vendor) return { ok: false, reason: "not_found" };

  const vendorWallet = await getOrCreateWallet(vendor.profileId, "vendor");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: vendorWallet.id,
      amountMinor: order.subtotalMinor,
      reason: "vendor_earning",
      reference: order.id,
      idempotencyKey: `order-earning:${order.id}`,
      metadata: { orderId: order.id },
    });
    await tx
      .update(orders)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  return { ok: true };
}
