import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceAvailability } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { loadAvailability } from "@/lib/serviceAvailability";
import { withApi } from "@/lib/apiHandler";

/**
 * GET  /api/vendor/availability — the caller's weekly pattern + date overrides.
 * POST /api/vendor/availability — upsert one weekly day or one date override.
 *   `service_availability` is vendor-wide (one calendar shared across all of
 *   a vendor's services), keyed by `vendorProfileId`, not per-service — so a
 *   day/override "save" deletes and re-inserts every row for that
 *   day-of-week/date rather than trying to diff individual windows.
 *
 * Body (POST), one of:
 *   { type: "weekly", dayOfWeek: 0-6, windows: {start,end}[] }   — [] = closed that day
 *   { type: "override", date: "YYYY-MM-DD", closed: boolean, windows: {start,end}[] }
 *   { type: "clear-override", date: "YYYY-MM-DD" }               — revert to the weekly pattern
 */

export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const { weekly, overrides } = await loadAvailability(vendor.id);
  return Response.json({ weekly, overrides });
});

type Window = { start: string; end: string };

function isWindow(w: unknown): w is Window {
  return (
    typeof w === "object" &&
    w !== null &&
    typeof (w as Window).start === "string" &&
    typeof (w as Window).end === "string"
  );
}

export const POST = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.type === "weekly") {
    const dayOfWeek = Number(body.dayOfWeek);
    const windows = Array.isArray(body.windows) ? body.windows.filter(isWindow) : [];
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return Response.json({ error: "Invalid dayOfWeek" }, { status: 400 });
    }

    await db
      .delete(serviceAvailability)
      .where(
        and(
          eq(serviceAvailability.vendorProfileId, vendor.id),
          eq(serviceAvailability.ruleType, "recurring"),
          eq(serviceAvailability.dayOfWeek, dayOfWeek),
        ),
      );
    if (windows.length > 0) {
      await db.insert(serviceAvailability).values(
        windows.map((w) => ({
          vendorProfileId: vendor.id,
          ruleType: "recurring" as const,
          dayOfWeek,
          startTime: w.start,
          endTime: w.end,
        })),
      );
    }
    return Response.json({ ok: true });
  }

  if (body.type === "override") {
    const date = typeof body.date === "string" ? body.date : null;
    const closed = Boolean(body.closed);
    const windows = Array.isArray(body.windows) ? body.windows.filter(isWindow) : [];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: "Invalid date" }, { status: 400 });
    }

    await db
      .delete(serviceAvailability)
      .where(
        and(
          eq(serviceAvailability.vendorProfileId, vendor.id),
          eq(serviceAvailability.ruleType, "date_override"),
          eq(serviceAvailability.date, date),
        ),
      );
    if (closed) {
      await db.insert(serviceAvailability).values({
        vendorProfileId: vendor.id,
        ruleType: "date_override",
        date,
        isClosed: true,
      });
    } else if (windows.length > 0) {
      await db.insert(serviceAvailability).values(
        windows.map((w) => ({
          vendorProfileId: vendor.id,
          ruleType: "date_override" as const,
          date,
          startTime: w.start,
          endTime: w.end,
        })),
      );
    }
    return Response.json({ ok: true });
  }

  if (body.type === "clear-override") {
    const date = typeof body.date === "string" ? body.date : null;
    if (!date) return Response.json({ error: "Invalid date" }, { status: 400 });

    await db
      .delete(serviceAvailability)
      .where(
        and(
          eq(serviceAvailability.vendorProfileId, vendor.id),
          eq(serviceAvailability.ruleType, "date_override"),
          eq(serviceAvailability.date, date),
        ),
      );
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown type" }, { status: 400 });
});
