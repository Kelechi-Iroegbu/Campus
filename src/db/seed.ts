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
import {
  appointments,
  campuses,
  categories,
  deliveryJobs,
  orderItems,
  orders,
  products,
  profiles,
  serviceAvailability,
  services,
  universities,
  vendorProfiles,
} from "./schema";

const ADMIN_CLERK_ID = process.env.SEED_ADMIN_CLERK_ID ?? "seed_admin_placeholder";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@campus.local";
const PLATFORM_FEE_MINOR = 100_00;

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

/**
 * Sample vendors/catalog/orders/appointments/deliveries for realistic QA
 * (PLAN.md Milestone 10). Portable and idempotent: everything here is
 * self-contained (a dedicated "seed student" places all the sample
 * orders/appointments, so this never touches a real account's data), and
 * every insert is guarded by an application-level existence check (there's
 * no natural DB-level unique key for e.g. "this vendor's product list") so
 * re-running `db:seed` never duplicates rows.
 *
 * Seeded vendors are real, browsable/orderable `vendor_profiles` rows with
 * a placeholder `clerk_user_id` — nobody can sign in as them (fine: QA of
 * the vendor/courier *side* already has real test accounts from live
 * verification; this data is for populating the student-facing browse/
 * order/booking experience and admin/vendor list views).
 *
 * Deliberately does NOT fabricate matching `wallet_transactions` rows for
 * the sample orders/appointments — these are fixtures for exercising list
 * UIs, not the money ledger (that's covered by real, live-verified test
 * transactions from actual app usage).
 */
async function ensureSeedProfile(opts: {
  clerkUserId: string;
  email: string;
  name: string;
  universityId: string;
  campusId: string;
}) {
  await db
    .insert(profiles)
    .values({
      clerkUserId: opts.clerkUserId,
      email: opts.email,
      name: opts.name,
      universityId: opts.universityId,
      campusId: opts.campusId,
      onboardedAt: new Date(),
    })
    .onConflictDoNothing({ target: profiles.clerkUserId });
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, opts.clerkUserId))
    .limit(1);
  return profile;
}

async function ensureSeedVendor(opts: {
  clerkUserId: string;
  email: string;
  name: string;
  universityId: string;
  campusId: string;
  vendor: {
    offeringType: "product" | "service" | "courier";
    displayName: string;
    categoryId?: string;
    vehicleMode?: "car" | "bicycle" | "foot";
    address?: string;
    description?: string;
  };
}) {
  const profile = await ensureSeedProfile(opts);

  await db
    .insert(vendorProfiles)
    .values({
      profileId: profile.id,
      campusId: opts.campusId,
      status: "approved",
      submittedAt: new Date(),
      reviewedAt: new Date(),
      ...opts.vendor,
    })
    .onConflictDoNothing({ target: vendorProfiles.profileId });
  const [vendor] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.profileId, profile.id))
    .limit(1);

  return { profile, vendor };
}

async function ensureProduct(
  vendorProfileId: string,
  name: string,
  fields: { description: string; priceMinor: number },
) {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.vendorProfileId, vendorProfileId), eq(products.name, name)))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db
    .insert(products)
    .values({ vendorProfileId, name, ...fields })
    .returning({ id: products.id });
  return row.id;
}

async function ensureService(
  vendorProfileId: string,
  name: string,
  fields: { description: string; priceMinor: number; durationMinutes: number },
) {
  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.vendorProfileId, vendorProfileId), eq(services.name, name)))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db
    .insert(services)
    .values({ vendorProfileId, name, ...fields })
    .returning({ id: services.id });
  return row.id;
}

async function seedSampleData(universityId: string, campusId: string) {
  console.log("Seeding sample vendors/catalog/orders for QA…");

  const categoryBySlug = new Map(
    (await db.select().from(categories)).map((c) => [c.slug, c.id]),
  );

  // --- A dedicated seed student places every sample order/appointment/errand ---
  const student = await ensureSeedProfile({
    clerkUserId: "seed_student_qa",
    email: "seed.student@campus.local",
    name: "Seed Student",
    universityId,
    campusId,
  });

  // --- Vendors: 2 product, 2 service, 1 courier ---
  const { vendor: snacks } = await ensureSeedVendor({
    clerkUserId: "seed_vendor_snacks",
    email: "snacks@campus.local",
    name: "Snacks Vendor",
    universityId,
    campusId,
    vendor: {
      offeringType: "product",
      displayName: "Campus Snacks Hub",
      categoryId: categoryBySlug.get("snacks"),
      address: "Along the main gate road",
      description: "Chin-chin, plantain chips, and cold drinks between classes.",
    },
  });
  const { vendor: stationery } = await ensureSeedVendor({
    clerkUserId: "seed_vendor_stationery",
    email: "stationery@campus.local",
    name: "Stationery Vendor",
    universityId,
    campusId,
    vendor: {
      offeringType: "product",
      displayName: "PrintPoint Stationery",
      categoryId: categoryBySlug.get("stationery-books"),
      address: "Beside the faculty of science",
      description: "Notebooks, printing, and exam-season essentials.",
    },
  });
  const { vendor: nails } = await ensureSeedVendor({
    clerkUserId: "seed_vendor_nails",
    email: "nails@campus.local",
    name: "Nails Vendor",
    universityId,
    campusId,
    vendor: {
      offeringType: "service",
      displayName: "Glow Nails Studio",
      categoryId: categoryBySlug.get("nails"),
      address: "Female hostel B, room 12",
      description: "Acrylics, gel, and nail art — book ahead.",
    },
  });
  const { vendor: barbing } = await ensureSeedVendor({
    clerkUserId: "seed_vendor_barbing",
    email: "barbing@campus.local",
    name: "Barbing Vendor",
    universityId,
    campusId,
    vendor: {
      offeringType: "service",
      displayName: "Fresh Fade Barbershop",
      categoryId: categoryBySlug.get("barbing"),
      address: "Male hostel A, ground floor",
      description: "Clean fades, no long queues.",
    },
  });
  const { vendor: courier } = await ensureSeedVendor({
    clerkUserId: "seed_vendor_courier",
    email: "courier@campus.local",
    name: "Courier Vendor",
    universityId,
    campusId,
    vendor: {
      offeringType: "courier",
      displayName: "Campus Riders",
      vehicleMode: "bicycle",
    },
  });
  console.log("  vendors: 2 product, 2 service, 1 courier");

  // --- Catalog ---
  const chinChin = await ensureProduct(snacks.id, "Chin-chin (small pack)", {
    description: "Freshly fried, lightly sweet.",
    priceMinor: 500_00,
  });
  await ensureProduct(snacks.id, "Plantain chips", {
    description: "Crispy, salted.",
    priceMinor: 700_00,
  });
  await ensureProduct(snacks.id, "Chilled zobo (50cl)", {
    description: "Homemade, served cold.",
    priceMinor: 600_00,
  });

  const notebook = await ensureProduct(stationery.id, "A4 notebook (200 leaves)", {
    description: "Hardcover, ruled.",
    priceMinor: 1_200_00,
  });
  await ensureProduct(stationery.id, "Document printing (per page)", {
    description: "Black & white, A4.",
    priceMinor: 50_00,
  });

  const fullSet = await ensureService(nails.id, "Full Set Acrylics", {
    description: "Extensions with your choice of shape and color.",
    priceMinor: 5_000_00,
    durationMinutes: 90,
  });
  await ensureService(nails.id, "Gel Polish (natural nails)", {
    description: "Long-lasting shine, no extensions.",
    priceMinor: 2_500_00,
    durationMinutes: 45,
  });

  const fade = await ensureService(barbing.id, "Skin Fade", {
    description: "Clean fade with line-up.",
    priceMinor: 1_500_00,
    durationMinutes: 30,
  });
  await ensureService(barbing.id, "Beard Trim", {
    description: "Shape-up and trim.",
    priceMinor: 800_00,
    durationMinutes: 20,
  });

  for (const vendorProfileId of [nails.id, barbing.id]) {
    const [existing] = await db
      .select({ id: serviceAvailability.id })
      .from(serviceAvailability)
      .where(eq(serviceAvailability.vendorProfileId, vendorProfileId))
      .limit(1);
    if (existing) continue;
    for (let day = 1; day <= 5; day++) {
      await db.insert(serviceAvailability).values({
        vendorProfileId,
        ruleType: "recurring",
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      });
    }
  }
  console.log("  catalog: 5 products, 4 services, weekday availability for both service vendors");

  // --- Sample orders (product vendors), varied lifecycle states ---
  const [existingOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.vendorProfileId, snacks.id))
    .limit(1);
  if (!existingOrder) {
    const orderSpecs: { status: "placed" | "accepted" | "ready" | "completed"; productId: string; productName: string; unitPriceMinor: number; vendorProfileId: string }[] = [
      { status: "placed", productId: chinChin, productName: "Chin-chin (small pack)", unitPriceMinor: 500_00, vendorProfileId: snacks.id },
      { status: "accepted", productId: chinChin, productName: "Chin-chin (small pack)", unitPriceMinor: 500_00, vendorProfileId: snacks.id },
      { status: "ready", productId: notebook, productName: "A4 notebook (200 leaves)", unitPriceMinor: 1_200_00, vendorProfileId: stationery.id },
      { status: "completed", productId: notebook, productName: "A4 notebook (200 leaves)", unitPriceMinor: 1_200_00, vendorProfileId: stationery.id },
    ];
    for (const spec of orderSpecs) {
      const quantity = 2;
      const subtotalMinor = spec.unitPriceMinor * quantity;
      const [order] = await db
        .insert(orders)
        .values({
          studentProfileId: student.id,
          vendorProfileId: spec.vendorProfileId,
          campusId,
          status: spec.status,
          fulfillmentType: "pickup",
          subtotalMinor,
          platformFeeMinor: PLATFORM_FEE_MINOR,
          totalMinor: subtotalMinor + PLATFORM_FEE_MINOR,
          acceptedAt: spec.status === "placed" ? null : new Date(),
          readyAt: spec.status === "ready" || spec.status === "completed" ? new Date() : null,
          completedAt: spec.status === "completed" ? new Date() : null,
        })
        .returning({ id: orders.id });
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: spec.productId,
        productName: spec.productName,
        unitPriceMinor: spec.unitPriceMinor,
        quantity,
      });
    }
    console.log("  sample orders: 4 (placed, accepted, ready, completed)");
  }

  // --- Sample appointments (service vendors), varied lifecycle states ---
  const [existingAppt] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.vendorProfileId, nails.id))
    .limit(1);
  if (!existingAppt) {
    const base = new Date();
    base.setDate(base.getDate() + 7); // a week out — clear of any real bookings
    base.setHours(10, 0, 0, 0);
    const daySlot = (offsetDays: number) => {
      const start = new Date(base);
      start.setDate(start.getDate() + offsetDays);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 60);
      return { start, end };
    };
    const apptSpecs: { status: "booked" | "confirmed" | "completed" | "cancelled"; vendorProfileId: string; serviceId: string; serviceName: string; priceMinor: number; offsetDays: number }[] = [
      { status: "booked", vendorProfileId: nails.id, serviceId: fullSet, serviceName: "Full Set Acrylics", priceMinor: 5_000_00, offsetDays: 0 },
      { status: "confirmed", vendorProfileId: nails.id, serviceId: fullSet, serviceName: "Full Set Acrylics", priceMinor: 5_000_00, offsetDays: 1 },
      { status: "completed", vendorProfileId: barbing.id, serviceId: fade, serviceName: "Skin Fade", priceMinor: 1_500_00, offsetDays: -7 },
      { status: "cancelled", vendorProfileId: barbing.id, serviceId: fade, serviceName: "Skin Fade", priceMinor: 1_500_00, offsetDays: 2 },
    ];
    for (const spec of apptSpecs) {
      const { start, end } = daySlot(spec.offsetDays);
      await db.insert(appointments).values({
        studentProfileId: student.id,
        vendorProfileId: spec.vendorProfileId,
        serviceId: spec.serviceId,
        serviceName: spec.serviceName,
        priceMinor: spec.priceMinor,
        platformFeeMinor: PLATFORM_FEE_MINOR,
        totalMinor: spec.priceMinor + PLATFORM_FEE_MINOR,
        durationMinutes: 60,
        scheduledStart: start,
        scheduledEnd: end,
        status: spec.status,
        cancelledAt: spec.status === "cancelled" ? new Date() : null,
        cancelledBy: spec.status === "cancelled" ? "student" : null,
      });
    }
    console.log("  sample appointments: 4 (booked, confirmed, completed, cancelled)");
  }

  // --- Sample delivery jobs (standalone errands) for the courier feed ---
  const [existingJob] = await db
    .select({ id: deliveryJobs.id })
    .from(deliveryJobs)
    .where(eq(deliveryJobs.requesterProfileId, student.id))
    .limit(1);
  if (!existingJob) {
    await db.insert(deliveryJobs).values({
      source: "errand",
      requesterProfileId: student.id,
      campusId,
      status: "open",
      deliveryFeeMinor: 300_00,
      pickupNote: "Print Hub & Stationery, near the main gate",
      dropoffNote: "Block C, Room 214",
      itemDescription: "A sealed envelope",
    });
    await db.insert(deliveryJobs).values({
      source: "errand",
      requesterProfileId: student.id,
      claimedByVendorProfileId: courier.id,
      campusId,
      status: "delivered",
      deliveryFeeMinor: 300_00,
      pickupNote: "Faculty of Science reception",
      dropoffNote: "Male hostel A",
      itemDescription: "Printed handout",
      claimedAt: new Date(),
      pickedUpAt: new Date(),
      deliveredAt: new Date(),
    });
    console.log("  sample delivery jobs: 2 (open, delivered)");
  }

  console.log("Done seeding sample data.");
}

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

  await seedSampleData(university.id, mainCampus.id);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
