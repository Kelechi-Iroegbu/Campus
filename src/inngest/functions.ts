import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
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

  const meta = data.unsafe_metadata ?? {};
  const phone = meta.phoneNumber?.trim() || null;
  const matricNo = meta.matricNo?.trim() || null;
  const bankName = meta.bankName?.trim() || null;
  const bankAccountNumber = meta.bankAccountNumber?.trim() || null;
  const bankAccountName = meta.bankAccountName?.trim() || null;

  return {
    primaryEmail,
    name,
    phone,
    matricNo,
    bankName,
    bankAccountNumber,
    bankAccountName,
  };
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
    const { primaryEmail, name, phone, matricNo, bankName, bankAccountNumber, bankAccountName } =
      extractProfile(data);

    await db
      .insert(profiles)
      .values({
        clerkUserId: data.id,
        email: primaryEmail,
        name,
        image: data.image_url,
        phone,
        matricNo,
        bankName,
        bankAccountNumber,
        bankAccountName,
      })
      .onConflictDoNothing({ target: profiles.clerkUserId });

    return { clerkId: data.id };
  },
);

export const syncUserUpdate = inngest.createFunction(
  { id: "sync-user-update", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const data = event.data as ClerkUserUpdatedData;
    const { primaryEmail, name, phone, matricNo, bankName, bankAccountNumber, bankAccountName } =
      extractProfile(data);

    await db
      .update(profiles)
      .set({
        email: primaryEmail,
        name,
        image: data.image_url,
        // only overwrite from metadata when present, so a later profile edit
        // doesn't get wiped by a Clerk sync that lacks these fields
        ...(phone ? { phone } : {}),
        ...(matricNo ? { matricNo } : {}),
        ...(bankName ? { bankName } : {}),
        ...(bankAccountNumber ? { bankAccountNumber } : {}),
        ...(bankAccountName ? { bankAccountName } : {}),
        updatedAt: new Date(),
      })
      .where(eq(profiles.clerkUserId, data.id));

    return { clerkId: data.id };
  },
);

export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-deletion", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const data = event.data as ClerkUserDeletedData;

    await db.delete(profiles).where(eq(profiles.clerkUserId, data.id));

    return { clerkId: data.id };
  },
);
