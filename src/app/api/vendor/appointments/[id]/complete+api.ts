import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { completeAppointment } from "@/lib/appointments";
import { sendPushToProfile } from "@/lib/push";

/** POST /api/vendor/appointments/[id]/complete — confirmed -> completed; credits the vendor. */
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

  const result = await completeAppointment(id);
  if (!result.ok) {
    return Response.json(
      { error: result.reason === "not_found" ? "Not found" : "Appointment isn't ready to complete" },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  await sendPushToProfile(appt.studentProfileId, {
    title: "Appointment completed",
    body: `Thanks for visiting ${vendor.displayName}!`,
    data: { appointmentId: id },
  });

  return Response.json({ ok: true });
}
