import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryJobs, orders } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { sendPushToProfile } from "@/lib/push";
import { notifyAvailableCouriers } from "@/lib/deliveryJobs";
import { inngest } from "@/inngest/client";
import { withApi } from "@/lib/apiHandler";

/** POST /api/vendor/orders/[id]/accept — placed -> accepted. */
export const POST = withApi(async (request: Request, { id }: Record<string, string>) => {
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

  if (order.fulfillmentType === "delivery") {
    const [flipped] = await db
      .update(deliveryJobs)
      .set({ status: "open", updatedAt: new Date() })
      .where(and(eq(deliveryJobs.orderId, id), eq(deliveryJobs.status, "awaiting_vendor")))
      .returning({ id: deliveryJobs.id, campusId: deliveryJobs.campusId });
    if (flipped) {
      try {
        await notifyAvailableCouriers(flipped);
      } catch (err) {
        console.error("Failed to notify couriers of newly opened delivery job", err);
      }
    }
  }

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
});
