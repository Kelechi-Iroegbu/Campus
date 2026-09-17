import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";

/**
 * GET /api/vendor/orders — the caller's incoming/active orders (product vendor),
 * each with its line items.
 */
export async function GET(request: Request) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "product" }));
  } catch (res) {
    return res as Response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const filters = [eq(orders.vendorProfileId, vendor.id)];
  if (
    status === "placed" ||
    status === "accepted" ||
    status === "ready" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    filters.push(eq(orders.status, status));
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(and(...filters))
    .orderBy(desc(orders.placedAt));

  const itemRows = orderRows.length
    ? await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)))
    : [];

  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const result = orderRows.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return Response.json({ orders: result });
}
