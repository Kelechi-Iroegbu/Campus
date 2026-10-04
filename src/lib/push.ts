import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { pushTokens } from "@/db/schema";

/**
 * Expo push send. No SDK — the REST endpoint is a single POST.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoPushTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

/** Send `message` to every token belonging to the given profiles, in one batched call. */
async function sendToTokenRows(
  rows: { token: string; profileId: string }[],
  message: PushMessage,
): Promise<{ sent: number }> {
  const eligible = rows.filter(
    (r) => r.token.startsWith("ExponentPushToken") || r.token.startsWith("ExpoPushToken"),
  );
  if (eligible.length === 0) return { sent: 0 };

  const messages = eligible.map((r) => ({
    to: r.token,
    sound: "default" as const,
    title: message.title,
    body: message.body,
    data: message.data ?? {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.warn("expo push non-200", res.status, await res.text());
      return { sent: 0 };
    }
    const { data: tickets } = (await res.json()) as { data: ExpoPushTicket[] };
    const errors = tickets.filter((t) => t.status === "error");
    if (errors.length > 0) {
      console.warn("expo push ticket errors", JSON.stringify(errors));
    }
    await pruneUnregisteredTokens(eligible, tickets);
    return { sent: eligible.length - errors.length };
  } catch (err) {
    console.warn("expo push failed", err);
    return { sent: 0 };
  }
}

/** Drop any token Expo's ticket response flags as no longer installed. */
async function pruneUnregisteredTokens(
  rows: { token: string; profileId: string }[],
  tickets: ExpoPushTicket[],
) {
  const stale = rows.filter(
    (_, i) => tickets[i]?.status === "error" && tickets[i].details?.error === "DeviceNotRegistered",
  );
  await Promise.all(stale.map((r) => removeTokens(r.profileId, [r.token])));
}

/** Send one message to every registered token for a profile. Best-effort. */
export async function sendPushToProfile(
  profileId: string,
  message: PushMessage,
): Promise<{ sent: number }> {
  const rows = await db
    .select({ token: pushTokens.token, profileId: pushTokens.profileId })
    .from(pushTokens)
    .where(eq(pushTokens.profileId, profileId));

  return sendToTokenRows(rows, message);
}

/** Send one message to every registered token across a set of profiles. Best-effort. */
export async function sendPushToProfiles(
  profileIds: string[],
  message: PushMessage,
): Promise<{ sent: number }> {
  if (profileIds.length === 0) return { sent: 0 };

  const rows = await db
    .select({ token: pushTokens.token, profileId: pushTokens.profileId })
    .from(pushTokens)
    .where(inArray(pushTokens.profileId, profileIds));

  return sendToTokenRows(rows, message);
}

/** Drop tokens Expo reports as unregistered (called from a push-receipt sweep later). */
export async function removeTokens(profileId: string, tokens: string[]) {
  if (tokens.length === 0) return;
  await db
    .delete(pushTokens)
    .where(
      and(
        eq(pushTokens.profileId, profileId),
        inArray(pushTokens.token, tokens),
      ),
    );
}
