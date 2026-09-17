import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { orderItems, orders, products, vendorProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { PLATFORM_FEE_MINOR } from "@/lib/constants";
import { applyDebit, getOrCreateWallet } from "@/lib/wallet";
import { inngest } from "@/inngest/client";

/**
 * GET  /api/orders          — the caller's own orders (student side).
 * POST /api/orders          — place an order. Body: { items: [{ productId, quantity }] }.
 *   Pickup only this milestone — never trusts client-sent prices/fees.
 */

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const filters = [eq(orders.studentProfileId, user.id)];
  if (
    status === "placed" ||
    status === "accepted" ||
    status === "ready" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    filters.push(eq(orders.status, status));
  }

  const rows = await db
    .select({
      order: orders,
      vendorName: vendorProfiles.displayName,
      vendorCoverPhotoUrl: vendorProfiles.coverPhotoUrl,
    })
    .from(orders)
    .innerJoin(vendorProfiles, eq(orders.vendorProfileId, vendorProfiles.id))
    .where(and(...filters))
    .orderBy(desc(orders.placedAt));

  return Response.json({ orders: rows });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (res) {
    return res as Response;
  }

  let body: { items?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }
  const requested = body.items as { productId?: unknown; quantity?: unknown }[];
  const parsed: { productId: string; quantity: number }[] = [];
  for (const item of requested) {
    const productId = typeof item.productId === "string" ? item.productId : null;
    const quantity = Math.round(Number(item.quantity));
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return Response.json({ error: "Invalid cart item" }, { status: 400 });
    }
    parsed.push({ productId, quantity });
  }

  const productIds = parsed.map((i) => i.productId);
  const productRows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), isNull(products.deletedAt)));

  if (productRows.length !== new Set(productIds).size) {
    return Response.json({ error: "One or more items are no longer available" }, { status: 400 });
  }
  if (productRows.some((p) => !p.isActive)) {
    return Response.json({ error: "One or more items are out of stock" }, { status: 400 });
  }

  const vendorProfileIds = new Set(productRows.map((p) => p.vendorProfileId));
  if (vendorProfileIds.size > 1) {
    return Response.json({ error: "An order can only contain items from one vendor" }, { status: 400 });
  }
  const vendorProfileId = [...vendorProfileIds][0];

  const [vendor] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.id, vendorProfileId))
    .limit(1);
  if (!vendor || vendor.status !== "approved" || vendor.offeringType !== "product") {
    return Response.json({ error: "This vendor can't accept orders right now" }, { status: 409 });
  }
  if (!vendor.isOpen) {
    return Response.json({ error: "This vendor is currently closed" }, { status: 409 });
  }

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const lineItems = parsed.map((item) => {
    const product = productById.get(item.productId)!;
    return {
      productId: product.id,
      productName: product.name,
      unitPriceMinor: product.priceMinor,
      quantity: item.quantity,
    };
  });
  const subtotalMinor = lineItems.reduce(
    (sum, i) => sum + i.unitPriceMinor * i.quantity,
    0,
  );
  const platformFeeMinor = PLATFORM_FEE_MINOR;
  const totalMinor = subtotalMinor + platformFeeMinor;

  const studentWallet = await getOrCreateWallet(user.id, "student");
  const orderId = crypto.randomUUID();

  let debitFailed: "insufficient_funds" | null = null;
  await dbPool.transaction(async (tx) => {
    const result = await applyDebit({
      tx,
      walletId: studentWallet.id,
      amountMinor: totalMinor,
      reason: "order_payment",
      reference: orderId,
      idempotencyKey: `order-payment:${orderId}`,
      metadata: { orderId },
    });
    if (!result.applied) {
      debitFailed = result.reason === "insufficient_funds" ? "insufficient_funds" : null;
      return;
    }

    await tx.insert(orders).values({
      id: orderId,
      studentProfileId: user.id,
      vendorProfileId: vendor.id,
      campusId: vendor.campusId,
      status: "placed",
      fulfillmentType: "pickup",
      subtotalMinor,
      platformFeeMinor,
      totalMinor,
    });
    await tx.insert(orderItems).values(
      lineItems.map((i) => ({
        orderId,
        productId: i.productId,
        productName: i.productName,
        unitPriceMinor: i.unitPriceMinor,
        quantity: i.quantity,
      })),
    );
  });

  if (debitFailed) {
    return Response.json(
      { error: "Insufficient wallet balance. Top up and try again." },
      { status: 402 },
    );
  }

  // The order is already placed and paid for — a notification-layer hiccup
  // (e.g. Inngest unreachable) must never fail the request at this point.
  try {
    await inngest.send({
      name: "order/placed",
      data: { orderId, vendorProfileId: vendor.id, studentProfileId: user.id },
    });
  } catch (err) {
    console.error("Failed to send order/placed event", err);
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return Response.json({ order, items: lineItems }, { status: 201 });
}
