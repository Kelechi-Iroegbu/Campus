import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { cancelOrder } from "@/lib/orders";
import { sendPushToProfile } from "@/lib/push";

/** POST /api/vendor/orders/[id]/cancel — vendor decline. placed -> cancelled; refunds the student. */
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

  const result = await cancelOrder(id, "vendor");
  if (!result.ok) {
    return Response.json(
      { error: result.reason === "not_found" ? "Not found" : "Order can no longer be declined" },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  await sendPushToProfile(order.studentProfileId, {
    title: "Order declined",
    body: `${vendor.displayName} couldn't take your order — you've been refunded.`,
    data: { orderId: id },
  });

  return Response.json({ ok: true });
}
