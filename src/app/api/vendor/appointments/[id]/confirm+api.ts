import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { confirmAppointment } from "@/lib/appointments";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "@/inngest/client";

/** POST /api/vendor/appointments/[id]/confirm — booked -> confirmed. */
export async function POST(request: Request, { id }: Record<string, string>) {
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

  const result = await confirmAppointment(id);
  if (!result.ok) {
    return Response.json(
      { error: result.reason === "not_found" ? "Not found" : "Appointment can no longer be confirmed" },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  try {
    await inngest.send({ name: "appointment/confirmed", data: { appointmentId: id } });
  } catch (err) {
    console.error("Failed to send appointment/confirmed event", err);
  }
  await sendPushToProfile(appt.studentProfileId, {
    title: "Booking confirmed",
    body: `${vendor.displayName} confirmed your ${appt.serviceName} appointment.`,
    data: { appointmentId: id },
  });

  return Response.json({ ok: true });
}
