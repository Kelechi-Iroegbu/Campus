import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";

/**
 * GET  /api/products         — the caller's own products (vendor).
 * POST /api/products          — create a product (approved product vendor).
 *   Body: { name, description?, priceMinor, imageUrl?, isActive? }
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
    .from(products)
    .where(
      and(
        eq(products.vendorProfileId, vendor.id),
        isNull(products.deletedAt),
      ),
    )
    .orderBy(desc(products.createdAt));

  return Response.json({ products: rows });
}

export async function POST(request: Request) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, {
      approved: true,
      offeringType: "product",
    }));
  } catch (res) {
    return res as Response;
  }

  let body: {
    name?: unknown;
    description?: unknown;
    priceMinor?: unknown;
    imageUrl?: unknown;
    isActive?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const priceMinor = Math.round(Number(body.priceMinor));

  if (name.length < 2) {
    return Response.json({ error: "Give the product a name." }, { status: 400 });
  }
  if (!Number.isFinite(priceMinor) || priceMinor <= 0) {
    return Response.json({ error: "Enter a valid price." }, { status: 400 });
  }

  const [row] = await db
    .insert(products)
    .values({
      vendorProfileId: vendor.id,
      name,
      description:
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null,
      priceMinor,
      imageUrl:
        typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    })
    .returning();

  return Response.json({ product: row }, { status: 201 });
}
