import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireVendor } from "@/lib/vendor";
import { completeOrder } from "@/lib/orders";
import { sendPushToProfile } from "@/lib/push";

/** POST /api/vendor/orders/[id]/complete — ready -> completed; credits the vendor. */
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

  const result = await completeOrder(id);
  if (!result.ok) {
    return Response.json(
      { error: result.reason === "not_found" ? "Not found" : "Order isn't ready to complete" },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  await sendPushToProfile(order.studentProfileId, {
    title: "Order completed",
    body: `Thanks for ordering from ${vendor.displayName}!`,
    data: { orderId: id },
  });

  return Response.json({ ok: true });
}
