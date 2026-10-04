import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { deliveryJobs, vendorProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { requireVendor } from "@/lib/vendor";
import { COURIER_FEE_MINOR } from "@/lib/constants";
import { applyDebit, getOrCreateWallet } from "@/lib/wallet";
import { notifyAvailableCouriers } from "@/lib/deliveryJobs";
import { withApi } from "@/lib/apiHandler";

/**
 * GET  /api/delivery-jobs — the open claim feed for couriers (campus-filtered,
 *      mixes order- and errand-sourced jobs — couriers don't need to know which).
 *      Returns an empty list while the courier is offline (`vendor.isOpen` false).
 * POST /api/delivery-jobs — student-initiated standalone errand request
 *      ("Send a Delivery"). Debits the requester immediately and inserts the
 *      job directly as `open` — no vendor-accept gate, unlike an order-sourced
 *      job which starts `awaiting_vendor`.
 */

export const GET = withApi(async (request: Request) => {
  let vendor;
  try {
    ({ vendor } = await requireVendor(request, { approved: true, offeringType: "courier" }));
  } catch (res) {
    return res as Response;
  }

  if (!vendor.isOpen) {
    return Response.json({ jobs: [] });
  }

  const filters = [eq(deliveryJobs.status, "open")];
  if (vendor.campusId) {
    filters.push(eq(deliveryJobs.campusId, vendor.campusId));
  }

  const rows = await db
    .select({
      job: deliveryJobs,
      pickupVendorName: vendorProfiles.displayName,
    })
    .from(deliveryJobs)
    .leftJoin(vendorProfiles, eq(deliveryJobs.vendorProfileId, vendorProfiles.id))
    .where(and(...filters))
    .orderBy(desc(deliveryJobs.createdAt));

  return Response.json({ jobs: rows });
});

export const POST = withApi(async (request: Request) => {
  let user;
  try {
    user = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  let body: { pickupNote?: unknown; dropoffNote?: unknown; itemDescription?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const pickupNote = typeof body.pickupNote === "string" ? body.pickupNote.trim() : "";
  const dropoffNote = typeof body.dropoffNote === "string" ? body.dropoffNote.trim() : "";
  const itemDescription =
    typeof body.itemDescription === "string" ? body.itemDescription.trim() : "";

  if (!pickupNote || !dropoffNote) {
    return Response.json({ error: "Pickup and dropoff details are required" }, { status: 400 });
  }

  const requesterWallet = await getOrCreateWallet(user.id, "student");
  const jobId = crypto.randomUUID();

  let debitFailed = false;
  await dbPool.transaction(async (tx) => {
    const result = await applyDebit({
      tx,
      walletId: requesterWallet.id,
      amountMinor: COURIER_FEE_MINOR,
      reason: "delivery_payment",
      reference: jobId,
      idempotencyKey: `delivery-payment:${jobId}`,
      metadata: { deliveryJobId: jobId },
    });
    if (!result.applied) {
      debitFailed = true;
      return;
    }

    await tx.insert(deliveryJobs).values({
      id: jobId,
      source: "errand",
      requesterProfileId: user.id,
      campusId: user.campusId,
      status: "open",
      deliveryFeeMinor: COURIER_FEE_MINOR,
      pickupNote,
      dropoffNote,
      itemDescription: itemDescription || null,
    });
  });

  if (debitFailed) {
    return Response.json(
      { error: "Insufficient wallet balance. Top up and try again." },
      { status: 402 },
    );
  }

  const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, jobId)).limit(1);

  try {
    await notifyAvailableCouriers({ id: jobId, campusId: user.campusId });
  } catch (err) {
    console.error("Failed to notify couriers of new errand job", err);
  }

  return Response.json({ job }, { status: 201 });
});
