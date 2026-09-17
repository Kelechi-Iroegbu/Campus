import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";

/**
 * GET  /api/services   — the caller's own services (vendor).
 * POST /api/services    — create (must be an approved `service` vendor).
 */

export async function GET(request: Request) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request));
  } catch (res) {
    return res as Response;
  }

  const rows = await db
    .select()
    .from(services)
    .where(and(eq(services.vendorProfileId, vendor.id), isNull(services.deletedAt)))
    .orderBy(desc(services.createdAt));

  return Response.json({ services: rows });
}

export async function POST(request: Request) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "service" }));
  } catch (res) {
    return res as Response;
  }

  let body: {
    name?: unknown;
    description?: unknown;
    priceMinor?: unknown;
    durationMinutes?: unknown;
    isActive?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const priceMinor = Math.round(Number(body.priceMinor));
  const durationMinutes = Math.round(Number(body.durationMinutes));

  if (name.length < 2) {
    return Response.json({ error: "Give the service a name." }, { status: 400 });
  }
  if (!Number.isFinite(priceMinor) || priceMinor <= 0) {
    return Response.json({ error: "Enter a valid price." }, { status: 400 });
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return Response.json({ error: "Enter a valid duration." }, { status: 400 });
  }

  const [row] = await db
    .insert(services)
    .values({
      vendorProfileId: vendor.id,
      name,
      description:
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null,
      priceMinor,
      durationMinutes,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    })
    .returning();

  return Response.json({ service: row }, { status: 201 });
}
