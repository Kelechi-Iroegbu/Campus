import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pushTokens } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { withApi } from "@/lib/apiHandler";

/**
 * POST   /api/push-tokens — register/re-home this device's Expo push token.
 * DELETE /api/push-tokens — drop this device's token (sign-out).
 */

export const POST = withApi(async (request: Request) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  let body: { token?: unknown; platform?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.token !== "string" || !body.token) {
    return Response.json({ error: "token is required" }, { status: 400 });
  }
  const platform = typeof body.platform === "string" ? body.platform : null;

  await db
    .insert(pushTokens)
    .values({ profileId: profile.id, token: body.token, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { profileId: profile.id, platform, updatedAt: new Date() },
    });

  return Response.json({ ok: true });
});

export const DELETE = withApi(async (request: Request) => {
  let profile;
  try {
    profile = await requireProfile(request);
  } catch (res) {
    return res as Response;
  }

  let body: { token?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.token !== "string" || !body.token) {
    return Response.json({ error: "token is required" }, { status: 400 });
  }

  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, body.token), eq(pushTokens.profileId, profile.id)));

  return Response.json({ ok: true });
});
