import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, profiles } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { withApi } from "@/lib/apiHandler";

/** GET /api/vendor/appointments — the caller's own service bookings. */
export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { offeringType: "service" }));
  } catch (res) {
    return res as Response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const filters = [eq(appointments.vendorProfileId, vendor.id)];
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
      studentName: profiles.name,
      studentPhone: profiles.phone,
    })
    .from(appointments)
    .innerJoin(profiles, eq(appointments.studentProfileId, profiles.id))
    .where(and(...filters))
    .orderBy(desc(appointments.scheduledStart));

  return Response.json({ appointments: rows });
});
