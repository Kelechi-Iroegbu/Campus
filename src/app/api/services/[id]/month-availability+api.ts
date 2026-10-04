import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { addDays, hasOpenSlots, parseYmd, ymd } from "@/lib/booking";
import { loadAvailability, loadBookedAppointmentsInRange } from "@/lib/serviceAvailability";
import { withApi } from "@/lib/apiHandler";

/**
 * GET /api/services/[id]/month-availability?month=YYYY-MM — public.
 * Which dates in the month have at least one open slot, for the booking
 * calendar's dots — computed in one request instead of one per day.
 */
export const GET = withApi(async (request: Request, { id }: Record<string, string>) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return Response.json({ error: "Missing or invalid ?month= (YYYY-MM)" }, { status: 400 });
  }

  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), isNull(services.deletedAt)))
    .limit(1);
  if (!service) return Response.json({ error: "Not found" }, { status: 404 });

  const { weekly, overrides } = await loadAvailability(service.vendorProfileId);

  const monthStart = parseYmd(`${month}-01`);
  const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const daysInMonth = Math.round(
    (nextMonthStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  const fromDate = ymd(monthStart);
  const toDate = ymd(addDays(monthStart, daysInMonth));
  const bookedAppointments = await loadBookedAppointmentsInRange(
    service.vendorProfileId,
    fromDate,
    toDate,
  );

  const serviceDef = {
    id: service.id,
    providerId: service.vendorProfileId,
    name: service.name,
    durationMin: service.durationMinutes,
    priceMinor: service.priceMinor,
  };

  const openDates: string[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const date = ymd(addDays(monthStart, i));
    if (
      hasOpenSlots({
        date,
        service: serviceDef,
        weekly,
        overrides,
        appointments: bookedAppointments,
      })
    ) {
      openDates.push(date);
    }
  }

  return Response.json({ openDates });
});
