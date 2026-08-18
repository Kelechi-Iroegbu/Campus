import { Webhook } from "svix";
import { inngest } from "@/inngest/client";
import type {
  ClerkUserCreatedData,
  ClerkUserDeletedData,
  ClerkUserUpdatedData,
} from "@/types/clerk";

export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await request.text();

  let event: { type: string; data: unknown };
  try {
    event = new Webhook(signingSecret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created") {
    await inngest.send({
      name: "clerk/user.created",
      data: event.data as ClerkUserCreatedData,
    });
  } else if (event.type === "user.updated") {
    await inngest.send({
      name: "clerk/user.updated",
      data: event.data as ClerkUserUpdatedData,
    });
  } else if (event.type === "user.deleted") {
    await inngest.send({
      name: "clerk/user.deleted",
      data: event.data as ClerkUserDeletedData,
    });
  }

  return new Response("OK", { status: 200 });
}
