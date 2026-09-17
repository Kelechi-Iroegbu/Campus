import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { appointments, services, vendorProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { applyDebit, getOrCreateWallet } from "@/lib/wallet";
import {
  fromWatDateTime,
  loadAvailability,
  loadBookedAppointmentsForDate,
} from "@/lib/serviceAvailability";
import { slotsForDate } from "@/lib/booking";
import { PLATFORM_FEE_MINOR } from "@/lib/constants";
import { inngest } from "@/inngest/client";

/**
 * GET  /api/appointments   — the caller's own appointments (student side).
 * POST /api/appointments   — book. Body: { serviceId, date, start }.
 *   Never trusts client-sent price/duration; re-derives everything from the
 *   service row. The Postgres exclusion constraint on `appointments` is the
 *   authoritative guard against a double-booking race — the pre-check here
 *   is only for a friendlier error message.
 */

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const filters = [eq(appointments.studentProfileId, user.id)];
  if (
    status === "booked" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "cancelled" ||
    status === "no_show"
  ) {
    filters.push(eq(appointments.status, status));
  }

  const rows = await db
    .select({
      appointment: appointments,
      vendorName: vendorProfiles.displayName,
      vendorCoverPhotoUrl: vendorProfiles.coverPhotoUrl,
    })
    .from(appointments)
    .innerJoin(vendorProfiles, eq(appointments.vendorProfileId, vendorProfiles.id))
    .where(and(...filters))
    .orderBy(desc(appointments.scheduledStart));

  return Response.json({ appointments: rows });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  let body: { serviceId?: unknown; date?: unknown; start?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const serviceId = typeof body.serviceId === "string" ? body.serviceId : null;
  const date = typeof body.date === "string" ? body.date : null;
  const start = typeof body.start === "string" ? body.start : null;
  if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !start || !/^\d{2}:\d{2}$/.test(start)) {
    return Response.json({ error: "Missing or invalid serviceId/date/start" }, { status: 400 });
  }

  const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service || !service.isActive || service.deletedAt) {
    return Response.json({ error: "This service is no longer available" }, { status: 400 });
  }

  const [vendor] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, service.vendorProfileId))
    .limit(1);
  if (!vendor || vendor.status !== "approved" || vendor.offeringType !== "service") {
    return Response.json({ error: "This vendor can't accept bookings right now" }, { status: 409 });
  }
  if (!vendor.isOpen) {
    return Response.json({ error: "This vendor isn't accepting bookings right now" }, { status: 409 });
  }

  // Friendlier pre-check — the exclusion constraint below is authoritative.
  const { weekly, overrides } = await loadAvailability(vendor.id);
  const bookedAppointments = await loadBookedAppointmentsForDate(vendor.id, date);
  const slots = slotsForDate({
    date,
    service: {
      id: service.id,
      providerId: vendor.id,
      name: service.name,
      durationMin: service.durationMinutes,
      priceMinor: service.priceMinor,
    },
    weekly,
    overrides,
    appointments: bookedAppointments,
  });
  const slot = slots.find((s) => s.time === start);
  if (!slot || slot.taken) {
    return Response.json({ error: "That slot isn't available." }, { status: 409 });
  }

  const scheduledStart = fromWatDateTime(date, start);
  const scheduledEnd = new Date(scheduledStart.getTime() + service.durationMinutes * 60_000);

  const platformFeeMinor = PLATFORM_FEE_MINOR;
  const totalMinor = service.priceMinor + platformFeeMinor;

  const studentWallet = await getOrCreateWallet(user.id, "student");
  const appointmentId = crypto.randomUUID();

  let debitFailed = false;
  let slotTaken = false;
  try {
    await dbPool.transaction(async (tx) => {
      const result = await applyDebit({
        tx,
        walletId: studentWallet.id,
        amountMinor: totalMinor,
        reason: "appointment_payment",
        reference: appointmentId,
        idempotencyKey: `appointment-payment:${appointmentId}`,
        metadata: { appointmentId },
      });
      if (!result.applied) {
        debitFailed = true;
        return;
      }

      await tx.insert(appointments).values({
        id: appointmentId,
        studentProfileId: user.id,
        vendorProfileId: vendor.id,
        serviceId: service.id,
        serviceName: service.name,
        priceMinor: service.priceMinor,
        platformFeeMinor,
        totalMinor,
        durationMinutes: service.durationMinutes,
        scheduledStart,
        scheduledEnd,
        status: "booked",
      });
    });
  } catch (err) {
    // Postgres exclusion-violation SQLSTATE — someone else took the slot
    // between our pre-check and the insert. drizzle-orm wraps the real pg
    // error in `.cause`, so `err.code` itself is always undefined here —
    // confirmed live by inspecting the actual thrown DrizzleQueryError.
    const pgCode =
      (err as { code?: string } | undefined)?.code ??
      (err as { cause?: { code?: string } } | undefined)?.cause?.code;
    if (pgCode === "23P01") {
      slotTaken = true;
    } else {
      throw err;
    }
  }

  if (slotTaken) {
    return Response.json({ error: "That slot was just taken. Pick another time." }, { status: 409 });
  }
  if (debitFailed) {
    return Response.json(
      { error: "Insufficient wallet balance. Top up and try again." },
      { status: 402 },
    );
  }

  try {
    await inngest.send({
      name: "appointment/booked",
      data: { appointmentId, vendorProfileId: vendor.id, studentProfileId: user.id },
    });
  } catch (err) {
    console.error("Failed to send appointment/booked event", err);
  }

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  return Response.json({ appointment }, { status: 201 });
}
