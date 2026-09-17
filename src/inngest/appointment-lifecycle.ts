import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, vendorProfiles } from "@/db/schema";
import { APPOINTMENT_CONFIRM_TIMEOUT_MINUTES } from "@/lib/constants";
import { cancelAppointment } from "@/lib/appointments";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "./client";

/**
 * Appointment confirm-timeout (PLAN.md Milestone 6). Mirrors
 * `order-lifecycle.ts`'s `orderAcceptTimeout` exactly: on `appointment/booked`,
 * notify the vendor, then wait up to `APPOINTMENT_CONFIRM_TIMEOUT_MINUTES`
 * for a matching `appointment/confirmed` event. If it never arrives,
 * auto-cancel and refund — `cancelAppointment` is no-op-safe if the
 * appointment was confirmed or already cancelled in the interim.
 */

type BookedData = {
  appointmentId: string;
  vendorProfileId: string;
  studentProfileId: string;
};

export const appointmentConfirmTimeout = inngest.createFunction(
  { id: "appointment-confirm-timeout", triggers: [{ event: "appointment/booked" }] },
  async ({ event, step }) => {
    const data = event.data as BookedData;

    await step.run("notify-vendor", async () => {
      const [vendor] = await db
        .select({ profileId: vendorProfiles.profileId, displayName: vendorProfiles.displayName })
        .from(vendorProfiles)
        .where(eq(vendorProfiles.id, data.vendorProfileId))
        .limit(1);
      if (!vendor) return { sent: 0 };
      return sendPushToProfile(vendor.profileId, {
        title: "New booking",
        body: `You have ${APPOINTMENT_CONFIRM_TIMEOUT_MINUTES} minutes to confirm it.`,
        data: { appointmentId: data.appointmentId },
      });
    });

    const confirmed = await step.waitForEvent("wait-for-confirm", {
      event: "appointment/confirmed",
      timeout: `${APPOINTMENT_CONFIRM_TIMEOUT_MINUTES}m`,
      match: "data.appointmentId",
    });

    if (confirmed) return { autoCancelled: false };

    const result = await step.run("auto-cancel", () => cancelAppointment(data.appointmentId, "system"));
    if (result.ok) {
      await step.run("notify-auto-cancel", async () => {
        return sendPushToProfile(data.studentProfileId, {
          title: "Booking cancelled",
          body: "The vendor didn't confirm your booking in time — you've been refunded.",
          data: { appointmentId: data.appointmentId },
        });
      });
    }
    return { autoCancelled: result.ok };
  },
);

/**
 * Appointment reminders. Triggered on `appointment/confirmed` (not
 * `booked` — no point reminding about something that might still
 * auto-cancel via the timeout above). Sends a push 24h before and 1h
 * before the scheduled start, skipping any reminder that's already in the
 * past. `cancelOn` stops pending reminders the moment the appointment is
 * cancelled or marked no-show (both emit `appointment/cancelled`).
 */
type ConfirmedData = { appointmentId: string };

export const appointmentReminders = inngest.createFunction(
  {
    id: "appointment-reminders",
    triggers: [{ event: "appointment/confirmed" }],
    cancelOn: [{ event: "appointment/cancelled", match: "data.appointmentId" }],
  },
  async ({ event, step }) => {
    const data = event.data as ConfirmedData;

    const appt = await step.run("load-appointment", async () => {
      const [row] = await db
        .select({
          scheduledStart: appointments.scheduledStart,
          studentProfileId: appointments.studentProfileId,
          serviceName: appointments.serviceName,
        })
        .from(appointments)
        .where(eq(appointments.id, data.appointmentId))
        .limit(1);
      return row ?? null;
    });
    if (!appt) return { sent: 0 };

    const scheduledStart = new Date(appt.scheduledStart);
    const dayBefore = new Date(scheduledStart.getTime() - 24 * 60 * 60_000);
    const hourBefore = new Date(scheduledStart.getTime() - 60 * 60_000);

    if (dayBefore.getTime() > Date.now()) {
      await step.sleepUntil("sleep-until-day-before", dayBefore);
      await step.run("send-day-before-reminder", () =>
        sendPushToProfile(appt.studentProfileId, {
          title: "Upcoming appointment tomorrow",
          body: `Your ${appt.serviceName} appointment is tomorrow.`,
          data: { appointmentId: data.appointmentId },
        }),
      );
    }

    if (hourBefore.getTime() > Date.now()) {
      await step.sleepUntil("sleep-until-hour-before", hourBefore);
      await step.run("send-hour-before-reminder", () =>
        sendPushToProfile(appt.studentProfileId, {
          title: "Appointment in 1 hour",
          body: `Your ${appt.serviceName} appointment starts soon.`,
          data: { appointmentId: data.appointmentId },
        }),
      );
    }

    return { sent: true };
  },
);
