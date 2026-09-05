import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Resolve the local `users` row for an authenticated API request.
 *
 * ⚠️ SECURITY TODO (PLAN.md §1 — `lib/auth.ts` / `requireProfile`):
 * this currently only *decodes* the Clerk session JWT and trusts its `sub`
 * claim. It does NOT verify the signature. Before this ships, verify the
 * token against Clerk's JWKS — install `@clerk/backend` and use
 * `verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })`.
 */
export async function getUserFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const clerkId = decodeSub(token);
  if (!clerkId) return null;

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return row ?? null;
}

export async function requireUser(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

function decodeSub(jwt: string): string | null {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { sub?: string; exp?: number };
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return claims.sub ?? null;
  } catch {
    return null;
  }
}
