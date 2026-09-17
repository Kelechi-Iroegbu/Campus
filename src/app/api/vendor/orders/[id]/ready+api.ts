import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { sendPushToProfile } from "@/lib/push";

/** POST /api/vendor/orders/[id]/ready — accepted -> ready. */
export async function POST(request: Request, { id }: Record<string, string>) {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "product" }));
  } catch (res) {
    return res as Response;
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order || order.vendorProfileId !== vendor.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status !== "accepted") {
    return Response.json({ error: "Order isn't in progress" }, { status: 409 });
  }

  await db
    .update(orders)
    .set({ status: "ready", readyAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, id));

  await sendPushToProfile(order.studentProfileId, {
    title: "Order ready",
    body: `${vendor.displayName}: your order is ready for pickup.`,
    data: { orderId: id },
  });

  return Response.json({ ok: true });
}
