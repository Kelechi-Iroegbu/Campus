import { eq } from "drizzle-orm";
import { experiment } from "inngest";
import { db } from "@/db";
import { orderItems, orders, profiles, vendorProfiles } from "@/db/schema";
import { ORDER_RECAP_MODEL_MINI, ORDER_RECAP_MODEL_REGULAR } from "@/lib/constants";
import { generateText } from "@/lib/openai";
import { sendPushToProfile } from "@/lib/push";
import { inngest } from "./client";

/**
 * Order recap notification.
 *
 * On `order/placed`, generates a one-line natural-language recap of the
 * order ("2x Jollof Rice, 1x Zobo from Mama Put — ₦4,500, pickup") and pushes
 * it to the student. The model is picked per-run via `group.experiment()`:
 * `gpt-4o-mini` 90% of the time, `gpt-4o` the other 10% — a durable, replay-
 * stable split (weighted on the Inngest run ID), so retries always reuse the
 * variant the run was first assigned.
 */

type PlacedData = {
  orderId: string;
  vendorProfileId: string;
  studentProfileId: string;
};

/**
 * Best-effort: an OpenAI hiccup must never hold up the order-confirmation
 * push, so a failure here yields "" (the caller falls back to a plain
 * templated line) instead of throwing and retrying the whole function.
 */
async function callModel(
  model: string,
  itemsLine: string,
  vendorName: string,
  totalNaira: string,
  fulfillmentType: string,
) {
  try {
    return await generateText(model, [
      {
        role: "system",
        content:
          "You write a single short, friendly order-confirmation sentence for a campus food/services app. " +
          "One sentence, no markdown, no emoji.",
      },
      {
        role: "user",
        content: `Vendor: ${vendorName}\nItems: ${itemsLine}\nTotal: ${totalNaira}\nFulfillment: ${fulfillmentType}`,
      },
    ]);
  } catch (err) {
    console.warn("order-recap model call failed", model, err);
    return "";
  }
}

export const generateOrderRecap = inngest.createFunction(
  { id: "order-recap-notification", triggers: [{ event: "order/placed" }] },
  async ({ event, step, group }) => {
    const data = event.data as PlacedData;

    const order = await step.run("load-order", async () => {
      const [row] = await db
        .select({
          totalMinor: orders.totalMinor,
          fulfillmentType: orders.fulfillmentType,
          vendorName: vendorProfiles.displayName,
        })
        .from(orders)
        .innerJoin(vendorProfiles, eq(vendorProfiles.id, orders.vendorProfileId))
        .where(eq(orders.id, data.orderId))
        .limit(1);
      if (!row) return null;

      const items = await db
        .select({ productName: orderItems.productName, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, data.orderId));

      return { ...row, items };
    });
    if (!order) return { sent: 0, reason: "order-not-found" };

    const itemsLine = order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ");
    const totalNaira = `₦${(order.totalMinor / 100).toLocaleString()}`;

    const { result: recap, variant } = await group.experiment("order-recap-model", {
      variants: {
        mini: () =>
          step.run("generate-mini", () =>
            callModel(ORDER_RECAP_MODEL_MINI, itemsLine, order.vendorName, totalNaira, order.fulfillmentType),
          ),
        regular: () =>
          step.run("generate-regular", () =>
            callModel(ORDER_RECAP_MODEL_REGULAR, itemsLine, order.vendorName, totalNaira, order.fulfillmentType),
          ),
      },
      // Durable, replay-stable 90/10 split — memoized against the run ID so
      // retries never re-roll into a different model mid-run.
      select: experiment.weighted({ mini: 90, regular: 10 }),
    });

    await step.run("notify-student", async () => {
      const [student] = await db
        .select({ profileId: profiles.id })
        .from(profiles)
        .where(eq(profiles.id, data.studentProfileId))
        .limit(1);
      if (!student) return { sent: 0 };
      return sendPushToProfile(student.profileId, {
        title: "Order placed",
        body: recap || `${itemsLine} from ${order.vendorName} — ${totalNaira}`,
        data: { orderId: data.orderId },
      });
    });

    return { variant };
  },
);
