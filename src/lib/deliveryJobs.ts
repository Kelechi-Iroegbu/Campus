import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { deliveryJobs, orders, vendorProfiles } from "@/db/schema";
import { completeOrder } from "@/lib/orders";
import { applyCredit, getOrCreateWallet } from "@/lib/wallet";
import { sendPushToProfiles } from "@/lib/push";

/**
 * Delivery-job lifecycle (PLAN.md Milestone 8). Mirrors orders.ts/appointments.ts's
 * shape: no-op-safe, status-guarded functions shared by the claim/pickup/deliver/
 * fail/cancel routes. Two independent ways a job exists —
 * `source: "order" | "errand"` — share every function here identically; only the
 * creation path (in api/orders+api.ts and api/delivery-jobs+api.ts) differs.
 */

export type ClaimResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already_claimed" | "already_has_active_job" };

/**
 * `open -> claimed`. A single atomic conditional update — the `WHERE status =
 * 'open'` clause IS the race guard, the same CAS idiom `applyDebit`
 * (src/lib/wallet.ts) uses for its balance check. No transaction needed since
 * it's a single statement. A courier can only carry one job at a time — checked
 * up front (not itself the race guard, since two *different* jobs can't race
 * on this the way two claims of the *same* job can, so a plain read is fine).
 */
export async function claimDeliveryJob(
  id: string,
  courierVendorProfileId: string,
): Promise<ClaimResult> {
  const [existingActive] = await db
    .select({ id: deliveryJobs.id })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.claimedByVendorProfileId, courierVendorProfileId),
        inArray(deliveryJobs.status, ["claimed", "picked_up"]),
      ),
    )
    .limit(1);
  if (existingActive) return { ok: false, reason: "already_has_active_job" };

  const [updated] = await db
    .update(deliveryJobs)
    .set({
      status: "claimed",
      claimedByVendorProfileId: courierVendorProfileId,
      claimedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(deliveryJobs.id, id), eq(deliveryJobs.status, "open")))
    .returning({ id: deliveryJobs.id });

  if (updated) return { ok: true };

  const [row] = await db
    .select({ id: deliveryJobs.id })
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, id))
    .limit(1);
  return { ok: false, reason: row ? "already_claimed" : "not_found" };
}

export type PickedUpResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_claimed_by_you" | "not_pickable" };

/**
 * `claimed -> picked_up`. No money movement, but for an order-sourced job
 * this is the moment the vendor has actually handed the order off (to the
 * courier, instead of directly to the student) — the same real-world event
 * `ready` represents for a pickup order. Flips the linked order to `ready`
 * here so `completeOrder()` (called from `deliverDeliveryJob` below once
 * this job reaches `delivered`) has a `status === "ready"` order to act on —
 * without this, a delivery order would sit at `accepted` forever, since
 * nothing else in the delivery flow ever moves it past that.
 */
export async function markPickedUp(
  id: string,
  courierVendorProfileId: string,
): Promise<PickedUpResult> {
  const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, id)).limit(1);
  if (!job) return { ok: false, reason: "not_found" };
  if (job.claimedByVendorProfileId !== courierVendorProfileId) {
    return { ok: false, reason: "not_claimed_by_you" };
  }
  if (job.status !== "claimed") return { ok: false, reason: "not_pickable" };

  await db
    .update(deliveryJobs)
    .set({ status: "picked_up", pickedUpAt: new Date(), updatedAt: new Date() })
    .where(eq(deliveryJobs.id, id));

  if (job.orderId) {
    await db
      .update(orders)
      .set({ status: "ready", readyAt: new Date(), updatedAt: new Date() })
      .where(and(eq(orders.id, job.orderId), eq(orders.status, "accepted")));
  }

  return { ok: true };
}

export type DeliverResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_claimed_by_you" | "not_deliverable" };

/**
 * `picked_up -> delivered`; credits the courier the delivery fee. If this job
 * is linked to a product order (`orderId` present), also completes that order
 * right after — `completeOrder` (src/lib/orders.ts) is already no-op-safe
 * (guards on `status === "ready"`), so this composes safely as a separate
 * best-effort step without needing to change its transaction signature.
 */
export async function deliverDeliveryJob(
  id: string,
  courierVendorProfileId: string,
): Promise<DeliverResult> {
  const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, id)).limit(1);
  if (!job) return { ok: false, reason: "not_found" };
  if (job.claimedByVendorProfileId !== courierVendorProfileId) {
    return { ok: false, reason: "not_claimed_by_you" };
  }
  if (job.status !== "picked_up") return { ok: false, reason: "not_deliverable" };

  const [courier] = await db
    .select({ profileId: vendorProfiles.profileId })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, courierVendorProfileId))
    .limit(1);
  if (!courier) return { ok: false, reason: "not_found" };

  const courierWallet = await getOrCreateWallet(courier.profileId, "courier");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: courierWallet.id,
      amountMinor: job.deliveryFeeMinor,
      reason: "courier_earning",
      reference: job.id,
      idempotencyKey: `delivery-earning:${job.id}`,
      metadata: { deliveryJobId: job.id },
    });
    await tx
      .update(deliveryJobs)
      .set({ status: "delivered", deliveredAt: new Date(), updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id));
  });

  if (job.orderId) {
    await completeOrder(job.orderId);
  }

  return { ok: true };
}

export type FailResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_claimed_by_you" | "not_failable" };

/**
 * `claimed`/`picked_up` -> `failed`; refunds the delivery fee to the requester
 * in full — the student paid for a delivery that didn't happen.
 */
export async function failDeliveryJob(
  id: string,
  courierVendorProfileId: string,
  failReason: string,
): Promise<FailResult> {
  const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, id)).limit(1);
  if (!job) return { ok: false, reason: "not_found" };
  if (job.claimedByVendorProfileId !== courierVendorProfileId) {
    return { ok: false, reason: "not_claimed_by_you" };
  }
  if (job.status !== "claimed" && job.status !== "picked_up") {
    return { ok: false, reason: "not_failable" };
  }

  const requesterWallet = await getOrCreateWallet(job.requesterProfileId, "student");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: requesterWallet.id,
      amountMinor: job.deliveryFeeMinor,
      reason: "delivery_refund",
      reference: job.id,
      idempotencyKey: `delivery-refund:${job.id}`,
      metadata: { deliveryJobId: job.id, failedReason: failReason },
    });
    await tx
      .update(deliveryJobs)
      .set({
        status: "failed",
        failedAt: new Date(),
        failedReason: failReason,
        updatedAt: new Date(),
      })
      .where(eq(deliveryJobs.id, id));
  });

  return { ok: true };
}

/**
 * Push every approved, open-for-business courier on the job's campus that a
 * new job is available. Matches the same eligibility gate `GET
 * /api/delivery-jobs` already applies to its open-jobs feed (offeringType,
 * approved, isOpen, campus) — a closed courier shouldn't be pushed for a job
 * they can't even see in their own feed.
 */
export async function notifyAvailableCouriers(job: { id: string; campusId: string | null }) {
  const filters = [
    eq(vendorProfiles.offeringType, "courier"),
    eq(vendorProfiles.status, "approved"),
    eq(vendorProfiles.isOpen, true),
  ];
  if (job.campusId) filters.push(eq(vendorProfiles.campusId, job.campusId));

  const couriers = await db
    .select({ profileId: vendorProfiles.profileId })
    .from(vendorProfiles)
    .where(and(...filters));
  if (couriers.length === 0) return;

  await sendPushToProfiles(
    couriers.map((c) => c.profileId),
    {
      title: "New delivery available",
      body: "A delivery job just opened near you.",
      data: { deliveryJobId: job.id },
    },
  );
}

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_cancellable" };

/**
 * Requester-only cancel — only while `open` (unclaimed), refunds in full. In
 * practice this only ever applies to errand-sourced jobs: order-sourced jobs
 * stay `awaiting_vendor` until the vendor accepts (never reach `open` before
 * that), and once claimed a job can't be requester-cancelled at all — only
 * `failDeliveryJob` (courier-initiated) covers that case from there.
 */
export async function cancelDeliveryJob(
  id: string,
  requesterProfileId: string,
): Promise<CancelResult> {
  const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, id)).limit(1);
  if (!job || job.requesterProfileId !== requesterProfileId) {
    return { ok: false, reason: "not_found" };
  }
  if (job.status !== "open") return { ok: false, reason: "not_cancellable" };

  const requesterWallet = await getOrCreateWallet(job.requesterProfileId, "student");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: requesterWallet.id,
      amountMinor: job.deliveryFeeMinor,
      reason: "delivery_refund",
      reference: job.id,
      idempotencyKey: `delivery-cancel-refund:${job.id}`,
      metadata: { deliveryJobId: job.id },
    });
    await tx
      .update(deliveryJobs)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id));
  });

  return { ok: true };
}
