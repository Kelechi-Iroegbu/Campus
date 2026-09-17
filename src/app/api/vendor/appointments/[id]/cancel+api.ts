import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { cancelAppointment } from "@/lib/appointments";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "@/inngest/client";

/** POST /api/vendor/appointments/[id]/cancel — vendor-side cancel; refunds the student. */
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

  const result = await cancelAppointment(id, "vendor");
  if (!result.ok) {
    return Response.json(
      { error: result.reason === "not_found" ? "Not found" : "Appointment can no longer be cancelled" },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  try {
    await inngest.send({ name: "appointment/cancelled", data: { appointmentId: id } });
  } catch (err) {
    console.error("Failed to send appointment/cancelled event", err);
  }
  await sendPushToProfile(appt.studentProfileId, {
    title: "Appointment cancelled",
    body: `${vendor.displayName} cancelled your ${appt.serviceName} appointment — you've been refunded.`,
    data: { appointmentId: id },
  });

  return Response.json({ ok: true });
}
