/**
 * Reference-data seed (PLAN.md Milestone 1).
 *
 *   npm run db:seed
 *
 * Idempotent — safe to run repeatedly. Also applies the `btree_gist`
 * extension + the appointments overlap-exclusion constraint, since
 * `drizzle-kit push` can't model an `EXCLUDE` constraint and skips it.
 * Populates one university + two campuses, the product/service category
 * lists, and one admin profile.
 *
 * The admin profile is keyed by `SEED_ADMIN_CLERK_ID` (falls back to a
 * placeholder). Once you know your real Clerk user id, set that env var and
 * re-run to promote your own account: `is_admin` is Postgres-authoritative and
 * only granted here in Phase 1.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { campuses, categories, profiles, universities } from "./schema";

const ADMIN_CLERK_ID = process.env.SEED_ADMIN_CLERK_ID ?? "seed_admin_placeholder";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@campus.local";

const UNIVERSITY = { name: "Igbinedion University", slug: "iuo" };
// Single campus — the app doesn't ask users to pick one; every profile is
// auto-assigned this campus behind the university. The `campuses` table stays
// (FKs + campus-scoping depend on it) but it's a 1-row lookup for now.
const CAMPUSES = [{ name: "Okada Campus", slug: "okada" }];

const PRODUCT_CATEGORIES = [
  { slug: "food", name: "Food", icon: "fast-food-outline" },
  { slug: "drinks", name: "Drinks", icon: "cafe-outline" },
  { slug: "groceries", name: "Groceries", icon: "basket-outline" },
  { slug: "snacks", name: "Snacks", icon: "ice-cream-outline" },
  { slug: "bakery", name: "Bakery", icon: "restaurant-outline" },
  { slug: "fruits-veggies", name: "Fruits & Veggies", icon: "nutrition-outline" },
  { slug: "stationery-books", name: "Stationery & Books", icon: "book-outline" },
  { slug: "electronics", name: "Electronics & Gadgets", icon: "hardware-chip-outline" },
  { slug: "phone-accessories", name: "Phone Accessories", icon: "phone-portrait-outline" },
  { slug: "fashion", name: "Fashion & Accessories", icon: "shirt-outline" },
  { slug: "beauty", name: "Beauty & Personal Care", icon: "sparkles-outline" },
  { slug: "health-pharmacy", name: "Health & Pharmacy", icon: "medkit-outline" },
  { slug: "home-kitchen", name: "Home & Kitchen", icon: "home-outline" },
  { slug: "sports-fitness", name: "Sports & Fitness", icon: "basketball-outline" },
  { slug: "other", name: "Other", icon: "pricetag-outline" },
];

const SERVICE_CATEGORIES = [
  { slug: "nails", name: "Nails", icon: "hand-left-outline" },
  { slug: "lashes", name: "Lashes", icon: "eye-outline" },
  { slug: "braiding", name: "Braiding", icon: "woman-outline" },
  { slug: "barbing", name: "Barbing", icon: "cut-outline" },
  { slug: "makeup", name: "Makeup", icon: "color-palette-outline" },
  { slug: "laundry", name: "Laundry & Dry Cleaning", icon: "water-outline" },
  { slug: "tailoring", name: "Tailoring & Fashion Design", icon: "shirt-outline" },
  { slug: "photography", name: "Photography", icon: "camera-outline" },
  { slug: "tutoring", name: "Tutoring & Lessons", icon: "school-outline" },
  { slug: "gadget-repair", name: "Phone & Gadget Repair", icon: "build-outline" },
  { slug: "cleaning", name: "Cleaning Services", icon: "sparkles-outline" },
  { slug: "fitness", name: "Fitness & Personal Training", icon: "fitness-outline" },
  { slug: "other", name: "Other", icon: "ellipsis-horizontal-outline" },
];

async function main() {
  console.log("Seeding reference data…");

  // --- Appointments overlap guard (drizzle-kit push can't express EXCLUDE) ---
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS btree_gist`);
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'appointments_no_overlap'
        ) THEN
          ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap"
            EXCLUDE USING gist (
              "vendor_profile_id" WITH =,
              tstzrange("scheduled_start", "scheduled_end") WITH &&
            ) WHERE ("status" NOT IN ('cancelled', 'no_show'));
        END IF;
      END $$;
    `);
    console.log("  btree_gist + appointments_no_overlap constraint: ok");
  } catch (err) {
    console.warn(
      "  ⚠ could not apply btree_gist/exclusion constraint — fall back to a",
      "SERIALIZABLE overlap check in the Milestone 6 booking API.",
      err,
    );
  }

  // --- University ---
  await db
    .insert(universities)
    .values(UNIVERSITY)
    .onConflictDoNothing({ target: universities.slug });
  const [university] = await db
    .select()
    .from(universities)
    .where(eq(universities.slug, UNIVERSITY.slug))
    .limit(1);
  console.log(`  university: ${university.name}`);

  // --- Campuses ---
  for (const c of CAMPUSES) {
    await db
      .insert(campuses)
      .values({ ...c, universityId: university.id })
      .onConflictDoNothing();
  }
  const campusRows = await db
    .select()
    .from(campuses)
    .where(eq(campuses.universityId, university.id));
  console.log(`  campuses: ${campusRows.map((c) => c.name).join(", ")}`);

  // --- Categories ---
  for (const c of PRODUCT_CATEGORIES) {
    await db
      .insert(categories)
      .values({ kind: "product", ...c, sortOrder: PRODUCT_CATEGORIES.indexOf(c) })
      .onConflictDoNothing();
  }
  for (const c of SERVICE_CATEGORIES) {
    await db
      .insert(categories)
      .values({ kind: "service", ...c, sortOrder: SERVICE_CATEGORIES.indexOf(c) })
      .onConflictDoNothing();
  }
  console.log(
    `  categories: ${PRODUCT_CATEGORIES.length} product, ${SERVICE_CATEGORIES.length} service`,
  );

  // --- Admin profile ---
  const mainCampus = campusRows.find((c) => c.slug === "okada") ?? campusRows[0];
  await db
    .insert(profiles)
    .values({
      clerkUserId: ADMIN_CLERK_ID,
      email: ADMIN_EMAIL,
      name: "CampUs Admin",
      isAdmin: true,
      universityId: university.id,
      campusId: mainCampus.id,
      onboardedAt: new Date(),
    })
    .onConflictDoNothing({ target: profiles.clerkUserId });
  // Ensure the flag is set even if the row pre-existed from a Clerk sync.
  await db
    .update(profiles)
    .set({ isAdmin: true, updatedAt: new Date() })
    .where(eq(profiles.clerkUserId, ADMIN_CLERK_ID));
  console.log(`  admin profile: ${ADMIN_EMAIL} (clerk id: ${ADMIN_CLERK_ID})`);

  // Sanity: make sure the campus↔university link is intact.
  const [check] = await db
    .select({ id: campuses.id })
    .from(campuses)
    .where(
      and(
        eq(campuses.universityId, university.id),
        eq(campuses.slug, "okada"),
      ),
    )
    .limit(1);
  if (!check) throw new Error("seed sanity check failed: campus missing");

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
