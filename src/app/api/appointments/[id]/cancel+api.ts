import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { cancelAppointment } from "@/lib/appointments";
import { inngest } from "@/inngest/client";

/** POST /api/appointments/[id]/cancel — student-side cancel, full refund. */
export async function POST(request: Request, { id }: Record<string, string>) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt || appt.studentProfileId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const result = await cancelAppointment(id, "student");
  if (!result.ok) {
    const message =
      result.reason === "not_found"
        ? "Not found"
        : "This appointment can no longer be cancelled.";
    return Response.json({ error: message }, { status: 409 });
  }

  try {
    await inngest.send({
      name: "appointment/cancelled",
      data: { appointmentId: id },
    });
  } catch (err) {
    console.error("Failed to send appointment/cancelled event", err);
  }

  return Response.json({ ok: true });
}
