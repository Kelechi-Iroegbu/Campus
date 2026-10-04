import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { noShowAppointment } from "@/lib/appointments";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "@/inngest/client";
import { withApi } from "@/lib/apiHandler";

/**
 * POST /api/vendor/appointments/[id]/no-show — vendor-only, only once
 * `scheduledEnd` has passed. Refunds the student in full, same as cancel.
 */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "service" }));
  } catch (res) {
    return res as Response;
  }

  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt || appt.vendorProfileId !== vendor.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const result = await noShowAppointment(id, vendor.id);
  if (!result.ok) {
    const message =
      result.reason === "not_found"
        ? "Not found"
        : result.reason === "not_yet_due"
          ? "The appointment time hasn't passed yet"
          : "Appointment can no longer be marked no-show";
    return Response.json({ error: message }, { status: result.reason === "not_found" ? 404 : 409 });
  }

  try {
    await inngest.send({ name: "appointment/cancelled", data: { appointmentId: id } });
  } catch (err) {
    console.error("Failed to send appointment/cancelled event", err);
  }
  await sendPushToProfile(appt.studentProfileId, {
    title: "Marked as no-show",
    body: `Your ${appt.serviceName} appointment was marked as a no-show — you've been refunded.`,
    data: { appointmentId: id },
  });

  return Response.json({ ok: true });
});
