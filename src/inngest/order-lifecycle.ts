import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorProfiles } from "@/db/schema";
import { ORDER_ACCEPT_TIMEOUT_MINUTES } from "@/lib/constants";
import { cancelOrder } from "@/lib/orders";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "./client";

/**
 * Order accept-timeout (PLAN.md Milestone 5).
 *
 * On `order/placed`, notifies the vendor, then waits up to
 * `ORDER_ACCEPT_TIMEOUT_MINUTES` for a matching `order/accepted` event
 * (emitted by `api/vendor/orders/[id]/accept+api.ts`). If it never arrives,
 * auto-cancels and refunds — `cancelOrder` is no-op-safe if the order was
 * accepted in the small window between the wait timing out and this running.
 */

type PlacedData = {
  orderId: string;
  vendorProfileId: string;
  studentProfileId: string;
};

export const orderAcceptTimeout = inngest.createFunction(
  { id: "order-accept-timeout", triggers: [{ event: "order/placed" }] },
  async ({ event, step }) => {
    const data = event.data as PlacedData;

    await step.run("notify-vendor", async () => {
      const [vendor] = await db
        .select({ profileId: vendorProfiles.profileId, displayName: vendorProfiles.displayName })
        .from(vendorProfiles)
        .where(eq(vendorProfiles.id, data.vendorProfileId))
        .limit(1);
      if (!vendor) return { sent: 0 };
      return sendPushToProfile(vendor.profileId, {
        title: "New order",
        body: `You have ${ORDER_ACCEPT_TIMEOUT_MINUTES} minutes to accept it.`,
        data: { orderId: data.orderId },
      });
    });

    const accepted = await step.waitForEvent("wait-for-accept", {
      event: "order/accepted",
      timeout: `${ORDER_ACCEPT_TIMEOUT_MINUTES}m`,
      match: "data.orderId",
    });

    if (accepted) return { autoCancelled: false };

    const result = await step.run("auto-cancel", () => cancelOrder(data.orderId, "system"));
    return { autoCancelled: result.ok };
  },
);
