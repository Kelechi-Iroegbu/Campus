/**
 * Service-booking logic — availability windows + on-demand slot computation.
 *
 * No persistence yet (PLAN.md Milestone 6). This module is pure: the in-memory
 * store in `src/data/serviceBooking.ts` feeds it weekly hours, day overrides and
 * booked appointments; screens call `slotsForDate` / `hasOpenSlots`.
 *
 * Decisions baked in here (see the vendor booking-design thread):
 *  - one appointment per time slot (no concurrent capacity)
 *  - every appointment reserves its duration + a 2-minute buffer
 *  - slots are stepped every 15 min from the start of each window
 *  - a booking must be at least 2 hours out
 */

export const BOOKING_HORIZON_DAYS = 30;
export const BUFFER_MIN = 2;
export const SLOT_STEP_MIN = 15;
export const MIN_NOTICE_MIN = 120;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** "HH:MM" 24-hour, e.g. "09:00", "17:30". */
export type TimeStr = string;
/** "YYYY-MM-DD". */
export type DateStr = string;

export type Window = { start: TimeStr; end: TimeStr };

/** Recurring weekly pattern. An empty array for a weekday = closed that day. */
export type WeeklyHours = Record<Weekday, Window[]>;

/** A single-date exception layered on top of the weekly pattern. */
export type DayOverride = {
  date: DateStr;
  closed: boolean;
  /** ignored when `closed` */
  windows: Window[];
};

export type ServiceDef = {
  id: string;
  providerId: string;
  name: string;
  durationMin: number;
  priceMinor: number;
};

export type Appointment = {
  id: string;
  providerId: string;
  serviceId: string;
  customerName: string;
  date: DateStr;
  start: TimeStr;
  end: TimeStr;
  priceMinor: number;
  status: "booked" | "cancelled";
};

export type Slot = { time: TimeStr; taken: boolean };

/* ------------------------------ date/time utils ----------------------------- */

export const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

export const toMin = (t: TimeStr) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const fromMin = (min: number) => {
  const m = Math.max(0, Math.min(1439, Math.round(min)));
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};

export const ymd = (d: Date): DateStr =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseYmd = (s: DateStr) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const weekdayOf = (s: DateStr) => parseYmd(s).getDay() as Weekday;

const WD_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MO_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Tuesday, September 15" */
export const formatDayLong = (s: DateStr) => {
  const d = parseYmd(s);
  return `${WD_LONG[d.getDay()]}, ${MO_LONG[d.getMonth()]} ${d.getDate()}`;
};

/** "Tue, Sep 15" */
export const formatDayShort = (s: DateStr) => {
  const d = parseYmd(s);
  return `${WD_LONG[d.getDay()].slice(0, 3)}, ${MO_LONG[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};

/** "9:00 AM" */
export const format12 = (t: TimeStr) => {
  let [h] = t.split(":").map(Number);
  const m = Number(t.split(":")[1]);
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${pad2(m)} ${ap}`;
};

export const formatNaira = (minor: number) => `₦${(minor / 100).toLocaleString()}`;

export const windowsLabel = (ws: Window[]) =>
  ws.length
    ? ws.map((w) => `${format12(w.start)} – ${format12(w.end)}`).join(", ")
    : "Closed";

/* ---------------------------- availability logic --------------------------- */

/** The effective windows for a date: an override wins over the weekly pattern. */
export function windowsForDate(
  date: DateStr,
  weekly: WeeklyHours,
  overrides: DayOverride[],
): { closed: boolean; windows: Window[]; source: "override" | "weekly" } {
  const o = overrides.find((x) => x.date === date);
  if (o) {
    return o.closed
      ? { closed: true, windows: [], source: "override" }
      : { closed: o.windows.length === 0, windows: o.windows, source: "override" };
  }
  const w = weekly[weekdayOf(date)] ?? [];
  return { closed: w.length === 0, windows: w, source: "weekly" };
}

/**
 * Bookable slots for a date and service. Includes already-taken times (flagged
 * `taken`) so a student can see them greyed; times that are past / inside the
 * minimum-notice window are omitted entirely.
 */
export function slotsForDate(opts: {
  date: DateStr;
  service: ServiceDef;
  weekly: WeeklyHours;
  overrides: DayOverride[];
  appointments: Appointment[];
  now?: Date;
}): Slot[] {
  const { date, service, weekly, overrides, appointments } = opts;
  const now = opts.now ?? new Date();

  const { closed, windows } = windowsForDate(date, weekly, overrides);
  if (closed) return [];

  const dur = service.durationMin;
  const todayStr = ymd(now);
  const earliest =
    date < todayStr
      ? Infinity
      : date === todayStr
        ? now.getHours() * 60 + now.getMinutes() + MIN_NOTICE_MIN
        : -1;

  const booked = appointments.filter(
    (a) =>
      a.status === "booked" &&
      a.date === date &&
      a.providerId === service.providerId,
  );

  const seen = new Map<string, boolean>();
  for (const w of windows) {
    const ws = toMin(w.start);
    const we = toMin(w.end);
    for (let s = ws; s + dur <= we; s += SLOT_STEP_MIN) {
      if (s < earliest) continue;
      const e = s + dur;
      const taken = booked.some((a) => {
        const as = toMin(a.start);
        const ae = toMin(a.end);
        // both sides reserve a trailing buffer
        return s < ae + BUFFER_MIN && as < e + BUFFER_MIN;
      });
      const key = fromMin(s);
      if (!seen.has(key)) seen.set(key, taken);
    }
  }

  return [...seen.entries()]
    .map(([time, taken]) => ({ time, taken }))
    .sort((a, b) => toMin(a.time) - toMin(b.time));
}

export function hasOpenSlots(opts: {
  date: DateStr;
  service: ServiceDef;
  weekly: WeeklyHours;
  overrides: DayOverride[];
  appointments: Appointment[];
  now?: Date;
}): boolean {
  return slotsForDate(opts).some((s) => !s.taken);
}

/**
 * Whether the provider has set up any availability at all — a weekly open day
 * or a future open override. A service can't be published until this is true.
 */
export function hasAnyAvailability(
  weekly: WeeklyHours,
  overrides: DayOverride[],
  now: Date = new Date(),
): boolean {
  if (Object.values(weekly).some((ws) => ws.length > 0)) return true;
  const min = ymd(now);
  const max = ymd(addDays(now, BOOKING_HORIZON_DAYS));
  return overrides.some(
    (o) =>
      !o.closed && o.windows.length > 0 && o.date >= min && o.date <= max,
  );
}
