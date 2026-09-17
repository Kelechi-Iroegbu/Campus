import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { cancelOrder } from "@/lib/orders";

/**
 * POST /api/orders/[id]/cancel — student-initiated cancel. Only while the
 * order is still `placed` (before the vendor accepts); refunds the full
 * amount already debited.
 */
export async function POST(request: Request, { id }: Record<string, string>) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const [order] = await db.select({ studentProfileId: orders.studentProfileId }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  if (order.studentProfileId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const result = await cancelOrder(id, "student");
  if (!result.ok) {
    return Response.json(
      { error: result.reason === "not_found" ? "Not found" : "This order can no longer be cancelled" },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }

  return Response.json({ ok: true });
}
