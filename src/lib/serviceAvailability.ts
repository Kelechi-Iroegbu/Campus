import { and, eq, gte, lt, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { appointments, serviceAvailability } from "@/db/schema";
import type { Appointment, DateStr, DayOverride, TimeStr, WeeklyHours, Weekday } from "@/lib/booking";

/**
 * Server-only adapter between the DB (`service_availability`, `appointments`)
 * and `src/lib/booking.ts`'s pure slot logic. Single-campus pilot — no
 * per-vendor timezone column, so every date/time is treated as West Africa
 * Time (UTC+1, no DST — a fixed offset, safe to hardcode).
 */

const WAT_OFFSET = "+01:00";

/** Build a `timestamptz` instant from a WAT-local date + "HH:MM". */
export function fromWatDateTime(date: DateStr, time: TimeStr): Date {
  return new Date(`${date}T${time}:00${WAT_OFFSET}`);
}

const watFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Split a `timestamptz` instant into its WAT-local `{date, time}`. */
export function toWatDateTime(d: Date): { date: DateStr; time: TimeStr } {
  const parts = watFormatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** The caller's weekly recurring pattern + date overrides, adapted for `booking.ts`. */
export async function loadAvailability(
  vendorProfileId: string,
): Promise<{ weekly: WeeklyHours; overrides: DayOverride[] }> {
  const rows = await db
    .select()
    .from(serviceAvailability)
    .where(eq(serviceAvailability.vendorProfileId, vendorProfileId));

  const weekly: WeeklyHours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const overridesByDate = new Map<string, { closed: boolean; windows: { start: string; end: string }[] }>();

  for (const row of rows) {
    if (row.ruleType === "recurring") {
      if (row.dayOfWeek === null || !row.startTime || !row.endTime) continue;
      weekly[row.dayOfWeek as Weekday].push({ start: row.startTime, end: row.endTime });
    } else if (row.ruleType === "date_override" && row.date) {
      const existing = overridesByDate.get(row.date) ?? { closed: false, windows: [] };
      if (row.isClosed) {
        existing.closed = true;
      } else if (row.startTime && row.endTime) {
        existing.windows.push({ start: row.startTime, end: row.endTime });
      }
      overridesByDate.set(row.date, existing);
    }
  }

  const overrides: DayOverride[] = [...overridesByDate.entries()].map(([date, v]) => ({
    date,
    closed: v.closed,
    windows: v.windows,
  }));

  return { weekly, overrides };
}

/**
 * Non-cancelled/no-show appointments for a vendor on a given WAT calendar
 * date, adapted to `booking.ts`'s pure `Appointment` shape (`status` here
 * is intentionally collapsed to `"booked"` for anything that still occupies
 * the slot — `booked`, `confirmed`, or `completed` in the DB, matching the
 * `appointments_no_overlap` exclusion constraint's own predicate exactly).
 */
export async function loadBookedAppointmentsForDate(
  vendorProfileId: string,
  date: DateStr,
): Promise<Appointment[]> {
  const dayStart = fromWatDateTime(date, "00:00");
  const dayEnd = fromWatDateTime(date, "23:59");

  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.vendorProfileId, vendorProfileId),
        gte(appointments.scheduledStart, dayStart),
        lt(appointments.scheduledStart, dayEnd),
        notInArray(appointments.status, ["cancelled", "no_show"]),
      ),
    );

  return rows.map(rowToAppointment);
}

function rowToAppointment(row: typeof appointments.$inferSelect): Appointment {
  const start = toWatDateTime(row.scheduledStart);
  const end = toWatDateTime(row.scheduledEnd);
  return {
    id: row.id,
    providerId: row.vendorProfileId,
    serviceId: row.serviceId,
    customerName: "",
    date: start.date,
    start: start.time,
    end: end.time,
    priceMinor: row.priceMinor,
    status: "booked" as const,
  };
}

/**
 * Non-cancelled/no-show appointments for a vendor across a WAT date range
 * `[fromDate, toDate)` — one query, used for month-level "which days have
 * open slots" checks instead of one query per day.
 */
export async function loadBookedAppointmentsInRange(
  vendorProfileId: string,
  fromDate: DateStr,
  toDate: DateStr,
): Promise<Appointment[]> {
  const rangeStart = fromWatDateTime(fromDate, "00:00");
  const rangeEnd = fromWatDateTime(toDate, "00:00");

  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.vendorProfileId, vendorProfileId),
        gte(appointments.scheduledStart, rangeStart),
        lt(appointments.scheduledStart, rangeEnd),
        notInArray(appointments.status, ["cancelled", "no_show"]),
      ),
    );

  return rows.map(rowToAppointment);
}
