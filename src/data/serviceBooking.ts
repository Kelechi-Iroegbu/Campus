/**
 * In-memory service-booking store (no backend yet — PLAN.md Milestone 6).
 *
 * Holds one sample provider's weekly hours, per-day overrides, service list and
 * a mutable appointments list. Student booking screens append appointments here;
 * the vendor availability + bookings screens read the same state, so a booking
 * made on the student side shows up on the vendor side within the session.
 * Everything resets on reload. Swap for the real API when it lands.
 */
import { useSyncExternalStore } from "react";
import {
  addDays,
  hasAnyAvailability,
  ymd,
  type Appointment,
  type DayOverride,
  type ServiceDef,
  type WeeklyHours,
  type Window,
} from "@/lib/booking";

export const PROVIDER = {
  id: "beauty-bar",
  name: "Mama Ngozi's Beauty Bar",
  category: "Beauty & Grooming",
};

/** Stand-in for the signed-in student until real identity is wired. */
export const STUDENT_NAME = "Tobi A.";

/** A service the vendor has created. `active` = published / bookable by students. */
export type ServiceItem = ServiceDef & { active: boolean };

let services: ServiceItem[] = [
  {
    id: "acrylics-full",
    providerId: PROVIDER.id,
    name: "Full Set Acrylics",
    durationMin: 45,
    priceMinor: 500000,
    active: true,
  },
  {
    id: "gel-toes",
    providerId: PROVIDER.id,
    name: "Gel Polish (Toes)",
    durationMin: 30,
    priceMinor: 300000,
    active: true,
  },
  {
    id: "nail-art",
    providerId: PROVIDER.id,
    name: "Nail Art (add-on)",
    durationMin: 20,
    priceMinor: 150000,
    active: true,
  },
  {
    id: "lash-refill",
    providerId: PROVIDER.id,
    name: "Lash Refill",
    durationMin: 60,
    priceMinor: 600000,
    active: false,
  },
];

export const getService = (id: string) => services.find((s) => s.id === id);

/* -------------------------- seed data (relative to now) -------------------- */

const std = (): Window[] => [{ start: "09:00", end: "17:00" }];

let weekly: WeeklyHours = {
  0: [], // Sunday — closed by default, openable per-day
  1: std(),
  2: std(),
  3: std(),
  4: std(),
  5: std(),
  6: [{ start: "10:00", end: "14:00" }], // Saturday
};

const today = new Date();

/** First date strictly after `from` that lands on weekday `wd`. */
function nextWeekday(from: Date, wd: number) {
  let d = addDays(from, 1);
  while (d.getDay() !== wd) d = addDays(d, 1);
  return d;
}

/** The n-th upcoming Mon–Fri from today (n = 1 is the next one). */
function upcomingWorkday(n: number) {
  let d = new Date(today);
  let count = 0;
  while (count < n) {
    d = addDays(d, 1);
    const wd = d.getDay();
    if (wd >= 1 && wd <= 5) count += 1;
  }
  return d;
}

let overrides: DayOverride[] = [
  // a Sunday the provider has opted into
  {
    date: ymd(nextWeekday(today, 0)),
    closed: false,
    windows: [{ start: "11:00", end: "15:00" }],
  },
  // a Saturday with extended, split hours
  {
    date: ymd(nextWeekday(today, 6)),
    closed: false,
    windows: [
      { start: "10:00", end: "13:00" },
      { start: "15:00", end: "19:00" },
    ],
  },
  // a full working day taken off, ~2 weeks out
  { date: ymd(upcomingWorkday(9)), closed: true, windows: [] },
];

const wd1 = ymd(upcomingWorkday(2));
const wd2 = ymd(upcomingWorkday(4));

let appointments: Appointment[] = [
  {
    id: "seed-1",
    providerId: PROVIDER.id,
    serviceId: "acrylics-full",
    customerName: "Halima S.",
    date: wd1,
    start: "11:00",
    end: "11:45",
    priceMinor: 500000,
    status: "booked",
  },
  {
    id: "seed-2",
    providerId: PROVIDER.id,
    serviceId: "gel-toes",
    customerName: "Ruth K.",
    date: wd1,
    start: "14:00",
    end: "14:30",
    priceMinor: 300000,
    status: "booked",
  },
  {
    id: "seed-3",
    providerId: PROVIDER.id,
    serviceId: "lash-refill",
    customerName: "Damilola A.",
    date: wd2,
    start: "10:00",
    end: "11:00",
    priceMinor: 600000,
    status: "booked",
  },
];

/* ------------------------------- store plumbing --------------------------- */

type Snapshot = {
  weekly: WeeklyHours;
  overrides: DayOverride[];
  appointments: Appointment[];
  services: ServiceItem[];
  /** true once the provider has any weekly open day or future open override */
  availabilityReady: boolean;
};

const listeners = new Set<() => void>();
let snapshot: Snapshot = rebuild();

function rebuild(): Snapshot {
  return {
    weekly,
    overrides: [...overrides],
    appointments: [...appointments],
    services: [...services],
    availabilityReady: hasAnyAvailability(weekly, overrides),
  };
}

function emit() {
  snapshot = rebuild();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useBookingStore(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}

/* --------------------------------- mutators ------------------------------- */

export function upsertOverride(o: DayOverride) {
  overrides = [...overrides.filter((x) => x.date !== o.date), o];
  emit();
}

export function clearOverride(date: string) {
  overrides = overrides.filter((x) => x.date !== date);
  emit();
}

export function addAppointment(
  a: Omit<Appointment, "id" | "status">,
): Appointment {
  const appt: Appointment = { ...a, id: `appt-${Date.now()}`, status: "booked" };
  appointments = [...appointments, appt];
  emit();
  return appt;
}

export function cancelAppointment(id: string) {
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, status: "cancelled" } : a,
  );
  emit();
}

export function bookingsForDate(date: string) {
  return appointments.filter((a) => a.status === "booked" && a.date === date);
}

/* --------------------------------- services ------------------------------- */

/** Non-hook read of the availability gate (for event handlers). */
export function availabilityReady() {
  return hasAnyAvailability(weekly, overrides);
}

export function addService(input: {
  name: string;
  durationMin: number;
  priceMinor: number;
}): ServiceItem {
  const svc: ServiceItem = {
    id: `svc-${Date.now()}`,
    providerId: PROVIDER.id,
    name: input.name,
    durationMin: input.durationMin,
    priceMinor: input.priceMinor,
    active: false, // stays off until availability is set and the vendor turns it on
  };
  services = [...services, svc];
  emit();
  return svc;
}

/**
 * Publish / unpublish a service. Turning one on is refused until the provider
 * has set up availability — returns false and leaves the service unchanged.
 */
export function setServiceActive(id: string, active: boolean): boolean {
  if (active && !hasAnyAvailability(weekly, overrides)) return false;
  services = services.map((s) => (s.id === id ? { ...s, active } : s));
  emit();
  return true;
}

export function removeService(id: string) {
  services = services.filter((s) => s.id !== id);
  emit();
}
