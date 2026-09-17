import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "@/inngest/client";

/** POST /api/vendor/orders/[id]/accept — placed -> accepted. */
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
  if (order.status !== "placed") {
    return Response.json({ error: "Order can no longer be accepted" }, { status: 409 });
  }

  await db
    .update(orders)
    .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, id));

  try {
    await inngest.send({ name: "order/accepted", data: { orderId: id } });
  } catch (err) {
    console.error("Failed to send order/accepted event", err);
  }
  await sendPushToProfile(order.studentProfileId, {
    title: "Order accepted",
    body: `${vendor.displayName} is preparing your order.`,
    data: { orderId: id },
  });

  return Response.json({ ok: true });
}
