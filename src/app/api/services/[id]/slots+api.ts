import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { slotsForDate } from "@/lib/booking";
import { loadAvailability, loadBookedAppointmentsForDate } from "@/lib/serviceAvailability";

/** GET /api/services/[id]/slots?date=YYYY-MM-DD — public. */
export async function GET(request: Request, { id }: Record<string, string>) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Missing or invalid ?date=" }, { status: 400 });
  }

  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), isNull(services.deletedAt)))
    .limit(1);
  if (!service) return Response.json({ error: "Not found" }, { status: 404 });

  const { weekly, overrides } = await loadAvailability(service.vendorProfileId);
  const bookedAppointments = await loadBookedAppointmentsForDate(service.vendorProfileId, date);

  const slots = slotsForDate({
    date,
    service: {
      id: service.id,
      providerId: service.vendorProfileId,
      name: service.name,
      durationMin: service.durationMinutes,
      priceMinor: service.priceMinor,
    },
    weekly,
    overrides,
    appointments: bookedAppointments,
  });

  return Response.json({ slots });
}
