import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { appointments, vendorProfiles } from "@/db/schema";
import { applyCredit, getOrCreateWallet } from "@/lib/wallet";

export type ConfirmResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_confirmable" };

/**
 * `booked -> confirmed`. No money movement — the student already paid at booking.
 *
 * `expectedVendorProfileId`, when passed, is checked against the row before
 * anything else — defense in depth against a future caller that forgets its
 * own pre-check (every current route already verifies ownership itself
 * before calling this, e.g. `api/vendor/appointments/[id]/confirm+api.ts`).
 * A mismatch reads as "not_found" rather than a distinct forbidden reason,
 * so a caller probing IDs it doesn't own can't distinguish "wrong owner"
 * from "doesn't exist".
 */
export async function confirmAppointment(
  id: string,
  expectedVendorProfileId?: string,
): Promise<ConfirmResult> {
  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt) return { ok: false, reason: "not_found" };
  if (expectedVendorProfileId && appt.vendorProfileId !== expectedVendorProfileId) {
    return { ok: false, reason: "not_found" };
  }
  if (appt.status !== "booked") return { ok: false, reason: "not_confirmable" };

  await db
    .update(appointments)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(appointments.id, id));

  return { ok: true };
}

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_cancellable" };

/**
 * Cancels a `booked` or `confirmed` appointment and refunds the student in
 * full — allowed any time before the scheduled start (unlike orders, where
 * cancellation locks out once accepted; confirmed here with the user).
 * No-op-safe: past its scheduled start, or already in a terminal status,
 * returns `not_cancellable` instead of throwing — needed because the
 * confirm-timeout job (`src/inngest/appointment-lifecycle.ts`) can race a
 * legitimate confirm/cancel.
 */
export async function cancelAppointment(
  id: string,
  by: "student" | "vendor" | "system",
  expectedOwnerProfileId?: string,
): Promise<CancelResult> {
  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt) return { ok: false, reason: "not_found" };
  if (expectedOwnerProfileId) {
    const ownerId = by === "vendor" ? appt.vendorProfileId : appt.studentProfileId;
    if (ownerId !== expectedOwnerProfileId) return { ok: false, reason: "not_found" };
  }
  if (
    (appt.status !== "booked" && appt.status !== "confirmed") ||
    appt.scheduledStart <= new Date()
  ) {
    return { ok: false, reason: "not_cancellable" };
  }

  const studentWallet = await getOrCreateWallet(appt.studentProfileId, "student");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: studentWallet.id,
      amountMinor: appt.totalMinor,
      reason: "appointment_refund",
      reference: appt.id,
      idempotencyKey: `appointment-refund:${appt.id}`,
      metadata: { appointmentId: appt.id, cancelledBy: by },
    });
    await tx
      .update(appointments)
      .set({ status: "cancelled", cancelledAt: new Date(), cancelledBy: by, updatedAt: new Date() })
      .where(eq(appointments.id, id));
  });

  return { ok: true };
}

export type NoShowResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_yet_due" | "not_markable" };

/**
 * Vendor-only (enforced by the caller): marks a past-due `booked` or
 * `confirmed` appointment `no_show` and refunds the student in full, per
 * the locked-in decision. Only once `scheduledEnd` has passed — the vendor
 * is the one who knows whether the student actually showed up.
 */
export async function noShowAppointment(
  id: string,
  expectedVendorProfileId?: string,
): Promise<NoShowResult> {
  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt) return { ok: false, reason: "not_found" };
  if (expectedVendorProfileId && appt.vendorProfileId !== expectedVendorProfileId) {
    return { ok: false, reason: "not_found" };
  }
  if (appt.status !== "booked" && appt.status !== "confirmed") {
    return { ok: false, reason: "not_markable" };
  }
  if (appt.scheduledEnd > new Date()) return { ok: false, reason: "not_yet_due" };

  const studentWallet = await getOrCreateWallet(appt.studentProfileId, "student");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: studentWallet.id,
      amountMinor: appt.totalMinor,
      reason: "appointment_refund",
      reference: appt.id,
      idempotencyKey: `appointment-noshow:${appt.id}`,
      metadata: { appointmentId: appt.id },
    });
    await tx
      .update(appointments)
      .set({ status: "no_show", cancelledAt: new Date(), cancelledBy: "vendor", updatedAt: new Date() })
      .where(eq(appointments.id, id));
  });

  return { ok: true };
}

export type CompleteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_completable" };

/** `confirmed -> completed`; credits the vendor the full price (no platform fee). */
export async function completeAppointment(
  id: string,
  expectedVendorProfileId?: string,
): Promise<CompleteResult> {
  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt) return { ok: false, reason: "not_found" };
  if (expectedVendorProfileId && appt.vendorProfileId !== expectedVendorProfileId) {
    return { ok: false, reason: "not_found" };
  }
  if (appt.status !== "confirmed") return { ok: false, reason: "not_completable" };

  const [vendor] = await db
    .select({ profileId: vendorProfiles.profileId })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, appt.vendorProfileId))
    .limit(1);
  if (!vendor) return { ok: false, reason: "not_found" };

  const vendorWallet = await getOrCreateWallet(vendor.profileId, "vendor");

  await dbPool.transaction(async (tx) => {
    await applyCredit({
      tx,
      walletId: vendorWallet.id,
      amountMinor: appt.priceMinor,
      reason: "vendor_earning",
      reference: appt.id,
      idempotencyKey: `appointment-earning:${appt.id}`,
      metadata: { appointmentId: appt.id },
    });
    await tx
      .update(appointments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(appointments.id, id));
  });

  return { ok: true };
}
