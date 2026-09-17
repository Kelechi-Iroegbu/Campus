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

/** Send one message to every registered token for a profile. Best-effort. */
export async function sendPushToProfile(
  profileId: string,
  message: PushMessage,
): Promise<{ sent: number }> {
  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.profileId, profileId));

  const tokens = rows
    .map((r) => r.token)
    .filter((t) => t.startsWith("ExponentPushToken") || t.startsWith("ExpoPushToken"));

  if (tokens.length === 0) return { sent: 0 };

  const messages = tokens.map((to) => ({
    to,
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
    return { sent: tokens.length };
  } catch (err) {
    console.warn("expo push failed", err);
    return { sent: 0 };
  }
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
