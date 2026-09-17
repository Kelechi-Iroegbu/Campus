import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { campuses, categories, products, services, vendorProfiles } from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/vendors/[id]
 * One approved vendor + its live catalogue (products for product vendors,
 * services for service vendors). Public.
 */
export async function GET(_request: Request, { id }: Record<string, string>) {
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [vendor] = await db
    .select({
      id: vendorProfiles.id,
      offeringType: vendorProfiles.offeringType,
      displayName: vendorProfiles.displayName,
      description: vendorProfiles.description,
      address: vendorProfiles.address,
      coverPhotoUrl: vendorProfiles.coverPhotoUrl,
      shopIconUrl: vendorProfiles.shopIconUrl,
      status: vendorProfiles.status,
      categoryName: categories.name,
      campusName: campuses.name,
    })
    .from(vendorProfiles)
    .leftJoin(categories, eq(vendorProfiles.categoryId, categories.id))
    .leftJoin(campuses, eq(vendorProfiles.campusId, campuses.id))
    .where(eq(vendorProfiles.id, id))
    .limit(1);

  if (!vendor || vendor.status !== "approved") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const productRows =
    vendor.offeringType === "product"
      ? await db
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            priceMinor: products.priceMinor,
            imageUrl: products.imageUrl,
            isActive: products.isActive,
          })
          .from(products)
          .where(
            and(
              eq(products.vendorProfileId, vendor.id),
              isNull(products.deletedAt),
            ),
          )
          .orderBy(asc(products.name))
      : [];

  const serviceRows =
    vendor.offeringType === "service"
      ? await db
          .select({
            id: services.id,
            name: services.name,
            description: services.description,
            durationMinutes: services.durationMinutes,
            priceMinor: services.priceMinor,
            isActive: services.isActive,
          })
          .from(services)
          .where(
            and(
              eq(services.vendorProfileId, vendor.id),
              isNull(services.deletedAt),
            ),
          )
          .orderBy(asc(services.name))
      : [];

  return Response.json({ vendor, products: productRows, services: serviceRows });
}
