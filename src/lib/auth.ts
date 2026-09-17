import { createClerkClient, verifyToken } from "@clerk/backend";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses, profiles, vendorProfiles } from "@/db/schema";

/**
 * Server-side auth for `+api.ts` handlers.
 *
 * The client sends the Clerk session JWT as `Authorization: Bearer <token>`.
 * `verifyToken` checks the signature against Clerk's JWKS (keyed by
 * `CLERK_SECRET_KEY`) — a decoded-but-unverified token is never trusted.
 */

const secretKey = process.env.CLERK_SECRET_KEY ?? "";

export const clerkClient = createClerkClient({ secretKey });

export type Profile = typeof profiles.$inferSelect;

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function forbidden() {
  return new Response("Forbidden", { status: 403 });
}

/** Verify the Clerk session token and return its `sub` (Clerk user id). */
export async function verifyRequest(request: Request): Promise<string | null> {
  const token = bearerToken(request);
  if (!token || !secretKey) return null;
  try {
    const claims = await verifyToken(token, { secretKey });
    return claims.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Create the local `profiles` row for a Clerk user, pulling email/name/image
 * from the Clerk API. Used as a backstop when the Clerk webhook sync hasn't
 * fired yet. Safe to call concurrently — the insert is `onConflictDoNothing`.
 */
export async function lazyCreateProfile(
  clerkUserId: string,
): Promise<Profile | null> {
  let email = "";
  let name: string | null = null;
  let image: string | null = null;
  let phone: string | null = null;
  let matricNo: string | null = null;
  let bankName: string | null = null;
  let bankAccountNumber: string | null = null;
  let bankAccountName: string | null = null;

  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";
    name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    image = user.imageUrl ?? null;
    const meta = user.unsafeMetadata as
      | {
          phoneNumber?: string;
          matricNo?: string;
          bankName?: string;
          bankAccountNumber?: string;
          bankAccountName?: string;
        }
      | undefined;
    phone = meta?.phoneNumber?.trim() || null;
    matricNo = meta?.matricNo?.trim() || null;
    bankName = meta?.bankName?.trim() || null;
    bankAccountNumber = meta?.bankAccountNumber?.trim() || null;
    bankAccountName = meta?.bankAccountName?.trim() || null;
  } catch {
    // Clerk API unreachable — insert a stub; the webhook sync fills it in.
  }

  await db
    .insert(profiles)
    .values({
      clerkUserId,
      email,
      name,
      image,
      phone,
      matricNo,
      bankName,
      bankAccountNumber,
      bankAccountName,
    })
    .onConflictDoNothing({ target: profiles.clerkUserId });

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);
  return row ? ensureCampusAssigned(row) : null;
}

/**
 * The app has no campus picker (single-campus pilot — PLAN.md Revision
 * note (5)). Any profile without a campus gets the sole seeded one, along
 * with its university, and is marked onboarded. No-op once assigned.
 */
export async function ensureCampusAssigned(profile: Profile): Promise<Profile> {
  if (profile.campusId) return profile;

  const [campus] = await db
    .select({ id: campuses.id, universityId: campuses.universityId })
    .from(campuses)
    .orderBy(asc(campuses.createdAt))
    .limit(1);
  if (!campus) return profile; // DB not seeded yet

  const [updated] = await db
    .update(profiles)
    .set({
      campusId: campus.id,
      universityId: campus.universityId,
      onboardedAt: profile.onboardedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id))
    .returning();

  return updated ?? profile;
}

/** Verified profile or null — never throws. */
export async function getProfile(request: Request): Promise<Profile | null> {
  const clerkUserId = await verifyRequest(request);
  if (!clerkUserId) return null;
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);
  return row ? ensureCampusAssigned(row) : null;
}

/** Verified profile, lazily created if the webhook hasn't synced yet. */
export async function requireProfile(request: Request): Promise<Profile> {
  const clerkUserId = await verifyRequest(request);
  if (!clerkUserId) throw unauthorized();

  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);
  if (existing) return ensureCampusAssigned(existing);

  const created = await lazyCreateProfile(clerkUserId);
  if (!created) throw unauthorized();
  return created;
}

export async function requireAdmin(request: Request): Promise<Profile> {
  const profile = await requireProfile(request);
  if (!profile.isAdmin) throw forbidden();
  return profile;
}

/** Assert the caller owns the given `vendor_profiles` row. */
export async function requireVendorOwner(
  request: Request,
  vendorProfileId: string,
): Promise<Profile> {
  const profile = await requireProfile(request);
  const [vp] = await db
    .select({ id: vendorProfiles.id })
    .from(vendorProfiles)
    .where(
      and(
        eq(vendorProfiles.id, vendorProfileId),
        eq(vendorProfiles.profileId, profile.id),
      ),
    )
    .limit(1);
  if (!vp) throw forbidden();
  return profile;
}

/**
 * Back-compat alias — the Milestone 4 wallet routes were written against a
 * `requireUser` that returned the old `users` row. Same `id`/`email` shape.
 */
export const requireUser = requireProfile;
