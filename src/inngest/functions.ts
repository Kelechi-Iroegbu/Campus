import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type {
  ClerkUserCreatedData,
  ClerkUserDeletedData,
  ClerkUserUpdatedData,
} from "@/types/clerk";
import { inngest } from "./client";

function extractProfile(data: ClerkUserCreatedData | ClerkUserUpdatedData) {
  const primaryEmail =
    data.email_addresses.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ?? data.email_addresses[0]?.email_address ?? "";

  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

  return { primaryEmail, name };
}

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email ?? "world"}!` };
  },
);

export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-creation", triggers: [{ event: "clerk/user.created" }] },
  async ({ event }) => {
    const data = event.data as ClerkUserCreatedData;
    const { primaryEmail, name } = extractProfile(data);

    await db
      .insert(users)
      .values({
        clerkId: data.id,
        email: primaryEmail,
        name,
        image: data.image_url,
      })
      .onConflictDoNothing({ target: users.clerkId });

    return { clerkId: data.id };
  },
);

export const syncUserUpdate = inngest.createFunction(
  { id: "sync-user-update", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const data = event.data as ClerkUserUpdatedData;
    const { primaryEmail, name } = extractProfile(data);

    await db
      .update(users)
      .set({
        email: primaryEmail,
        name,
        image: data.image_url,
      })
      .where(eq(users.clerkId, data.id));

    return { clerkId: data.id };
  },
);

export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-deletion", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const data = event.data as ClerkUserDeletedData;

    await db.delete(users).where(eq(users.clerkId, data.id));

    return { clerkId: data.id };
  },
);
