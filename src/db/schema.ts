import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/* ================================================================== *
 * Enums
 * ================================================================== */

export const activeRole = pgEnum("active_role", ["student", "vendor"]);

export const categoryKind = pgEnum("category_kind", ["product", "service"]);

export const offeringType = pgEnum("offering_type", [
  "product",
  "service",
  "courier",
]);

export const vehicleMode = pgEnum("vehicle_mode", ["car", "bicycle", "foot"]);

export const vendorStatus = pgEnum("vendor_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const availabilityRuleType = pgEnum("availability_rule_type", [
  "recurring",
  "date_override",
]);

export const appointmentStatus = pgEnum("appointment_status", [
  "booked",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const orderStatus = pgEnum("order_status", [
  "placed",
  "accepted",
  "ready",
  "completed",
  "cancelled",
]);

export const fulfillmentType = pgEnum("fulfillment_type", ["pickup", "delivery"]);

export const deliveryJobSource = pgEnum("delivery_job_source", [
  "order",
  "errand",
]);

export const deliveryJobStatus = pgEnum("delivery_job_status", [
  "awaiting_vendor",
  "open",
  "claimed",
  "picked_up",
  "delivered",
  "failed",
  "cancelled",
]);

export const walletKind = pgEnum("wallet_kind", [
  "student",
  "vendor",
  "courier",
]);

export const walletTxnDirection = pgEnum("wallet_txn_direction", [
  "credit",
  "debit",
]);

export const walletTxnReason = pgEnum("wallet_txn_reason", [
  "topup",
  "order_payment",
  "order_refund",
  "appointment_payment",
  "appointment_refund",
  "courier_earning",
  "vendor_earning",
  "payout",
  "payout_reversal",
  "adjustment",
]);

export const paystackTxnType = pgEnum("paystack_txn_type", [
  "topup",
  "transfer",
]);

export const paystackTxnStatus = pgEnum("paystack_txn_status", [
  "pending",
  "success",
  "failed",
  "abandoned",
  "reversed",
]);

/* ================================================================== *
 * Reference data — universities / campuses / categories
 * ================================================================== */

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const campuses = pgTable(
  "campuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    universityId: uuid("university_id")
      .notNull()
      .references(() => universities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    campusSlugPerUniversity: unique("campuses_university_slug_unique").on(
      t.universityId,
      t.slug,
    ),
  }),
);

/**
 * Feeds one shared icon-grid picker: filter on `kind` to get the product
 * category list (food/drinks/beauty/other) or the service-type list
 * (nails/lashes/braiding/barbing/makeup/other).
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: categoryKind("kind").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    // Ionicons / SF Symbol name for the picker tile.
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    categorySlugPerKind: unique("categories_kind_slug_unique").on(t.kind, t.slug),
  }),
);

/* ================================================================== *
 * profiles — one row per Clerk user (was `users`)
 * ================================================================== */

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  image: text("image"),
  phone: text("phone"),
  // Account / matric number, collected at email sign-up (Register-ui-design).
  matricNo: text("matric_no"),
  // Personal bank account, collected at email sign-up — the account wallet
  // top-ups are debited from and withdrawals are paid back to.
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  // Nullable until student onboarding is completed.
  universityId: uuid("university_id").references(() => universities.id, {
    onDelete: "set null",
  }),
  campusId: uuid("campus_id").references(() => campuses.id, {
    onDelete: "set null",
  }),
  isAdmin: boolean("is_admin").notNull().default(false),
  activeRole: activeRole("active_role").notNull().default("student"),
  // True once the account has explicitly picked student vs. vendor at least
  // once (via the post-auth picker or the in-app switch) — distinguishes a
  // deliberate choice from activeRole's system-set default on approval.
  hasChosenRole: boolean("has_chosen_role").notNull().default(false),
  onboardedAt: timestamp("onboarded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ================================================================== *
 * vendor_profiles — 1:1 with a profile, one offering type, fixed
 * ================================================================== */

export const vendorProfiles = pgTable("vendor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  offeringType: offeringType("offering_type").notNull(),
  displayName: text("display_name").notNull(),
  ownerName: text("owner_name"),
  phone: text("phone"),
  email: text("email"),
  // product + service use this; null for courier.
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  // courier only.
  vehicleMode: vehicleMode("vehicle_mode"),
  campusId: uuid("campus_id").references(() => campuses.id, {
    onDelete: "set null",
  }),
  // required for product, optional otherwise.
  address: text("address"),
  description: text("description"),
  coverPhotoUrl: text("cover_photo_url"),
  // optional custom logo, product only.
  shopIconUrl: text("shop_icon_url"),
  // KYC verification documents (kyc.tsx), collected during application.
  govIdUrl: text("gov_id_url"),
  selfieUrl: text("selfie_url"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  paystackRecipientCode: text("paystack_recipient_code"),
  // Vendor-controlled "accepting orders right now" toggle (Profile screen),
  // shown on the dashboard and (later) the student-facing store page.
  isOpen: boolean("is_open").notNull().default(true),
  status: vendorStatus("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByProfileId: uuid("reviewed_by_profile_id").references(
    () => profiles.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ================================================================== *
 * Catalog — products / services / availability
 * ================================================================== */

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorProfileId: uuid("vendor_profile_id")
    .notNull()
    .references(() => vendorProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  // soft-deleted so past order_items keep referencing a real row.
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorProfileId: uuid("vendor_profile_id")
    .notNull()
    .references(() => vendorProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Keyed by `vendor_profile_id` (shared across all of a provider's services —
 * they can't do two at once). `recurring` rows use `day_of_week` + window;
 * `date_override` rows use `date` + window, or `is_closed` to blank a day.
 */
export const serviceAvailability = pgTable("service_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorProfileId: uuid("vendor_profile_id")
    .notNull()
    .references(() => vendorProfiles.id, { onDelete: "cascade" }),
  ruleType: availabilityRuleType("rule_type").notNull(),
  // 0 = Sunday … 6 = Saturday. Set for `recurring`.
  dayOfWeek: integer("day_of_week"),
  // Set for `date_override`.
  date: date("date"),
  // "HH:MM" 24h.
  startTime: text("start_time"),
  endTime: text("end_time"),
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ================================================================== *
 * appointments — service bookings (not modeled through orders)
 *
 * Double-booking is prevented at the DB level with a gist exclusion
 * constraint added in a hand-written migration (needs `btree_gist`):
 *   EXCLUDE USING gist (
 *     vendor_profile_id WITH =,
 *     tstzrange(scheduled_start, scheduled_end) WITH &&
 *   ) WHERE (status NOT IN ('cancelled','no_show'))
 * ================================================================== */

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  vendorProfileId: uuid("vendor_profile_id")
    .notNull()
    .references(() => vendorProfiles.id, { onDelete: "restrict" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  // snapshots at booking time. priceMinor is the service price (what the
  // vendor is credited at completion); totalMinor = priceMinor +
  // platformFeeMinor is what the student actually pays/is refunded.
  serviceName: text("service_name").notNull(),
  priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
  platformFeeMinor: bigint("platform_fee_minor", { mode: "number" })
    .notNull()
    .default(0),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  scheduledStart: timestamp("scheduled_start", {
    withTimezone: true,
  }).notNull(),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
  status: appointmentStatus("status").notNull().default("booked"),
  cancelledAt: timestamp("cancelled_at"),
  // 'student' | 'vendor' | 'system'
  cancelledBy: text("cancelled_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ================================================================== *
 * orders / order_items — product orders only
 * ================================================================== */

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  vendorProfileId: uuid("vendor_profile_id")
    .notNull()
    .references(() => vendorProfiles.id, { onDelete: "restrict" }),
  campusId: uuid("campus_id").references(() => campuses.id, {
    onDelete: "set null",
  }),
  status: orderStatus("status").notNull().default("placed"),
  fulfillmentType: fulfillmentType("fulfillment_type")
    .notNull()
    .default("pickup"),
  // all amounts snapshotted at placement, minor units.
  subtotalMinor: bigint("subtotal_minor", { mode: "number" }).notNull(),
  platformFeeMinor: bigint("platform_fee_minor", { mode: "number" })
    .notNull()
    .default(0),
  // delivery orders only.
  deliveryFeeMinor: bigint("delivery_fee_minor", { mode: "number" }),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
  placedAt: timestamp("placed_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  readyAt: timestamp("ready_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  // snapshots.
  productName: text("product_name").notNull(),
  unitPriceMinor: bigint("unit_price_minor", { mode: "number" }).notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ================================================================== *
 * delivery_jobs — order-sourced OR standalone errand (Revision note 2)
 * ================================================================== */

export const deliveryJobs = pgTable("delivery_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: deliveryJobSource("source").notNull(),
  // present only for source='order'.
  orderId: uuid("order_id")
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  // who requested it — always set (student for errands, order's student for orders).
  requesterProfileId: uuid("requester_profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  // the prepping vendor — null for errands.
  vendorProfileId: uuid("vendor_profile_id").references(
    () => vendorProfiles.id,
    { onDelete: "set null" },
  ),
  campusId: uuid("campus_id").references(() => campuses.id, {
    onDelete: "set null",
  }),
  status: deliveryJobStatus("status").notNull().default("open"),
  // the courier's vendor_profiles row, once claimed.
  claimedByVendorProfileId: uuid("claimed_by_vendor_profile_id").references(
    () => vendorProfiles.id,
    { onDelete: "set null" },
  ),
  deliveryFeeMinor: bigint("delivery_fee_minor", { mode: "number" }).notNull(),
  pickupNote: text("pickup_note"),
  dropoffNote: text("dropoff_note"),
  itemDescription: text("item_description"),
  claimedAt: timestamp("claimed_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  failedReason: text("failed_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ================================================================== *
 * Wallet & Paystack — money in minor units (kobo), bigint
 * ================================================================== */

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: walletKind("kind").notNull().default("student"),
    balanceMinor: bigint("balance_minor", { mode: "number" })
      .notNull()
      .default(0),
    currency: text("currency").notNull().default("NGN"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    oneWalletPerKind: unique("wallets_profile_kind_unique").on(
      t.profileId,
      t.kind,
    ),
  }),
);

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  direction: walletTxnDirection("direction").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  balanceAfterMinor: bigint("balance_after_minor", { mode: "number" }).notNull(),
  reason: walletTxnReason("reason").notNull(),
  // Free-form pointer (paystack ref, payout id…) kept for anything without
  // a dedicated column below.
  reference: text("reference"),
  relatedOrderId: uuid("related_order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  relatedAppointmentId: uuid("related_appointment_id").references(
    () => appointments.id,
    { onDelete: "set null" },
  ),
  relatedDeliveryJobId: uuid("related_delivery_job_id").references(
    () => deliveryJobs.id,
    { onDelete: "set null" },
  ),
  // Guards against double-applying the same event (e.g. a resent webhook).
  idempotencyKey: text("idempotency_key").unique(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paystackTransactions = pgTable("paystack_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  walletId: uuid("wallet_id").references(() => wallets.id, {
    onDelete: "set null",
  }),
  type: paystackTxnType("type").notNull().default("topup"),
  // Our reference, passed to Paystack as `reference` — unique per attempt.
  reference: text("reference").notNull().unique(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  status: paystackTxnStatus("status").notNull().default("pending"),
  accessCode: text("access_code"),
  authorizationUrl: text("authorization_url"),
  channel: text("channel"),
  // Paystack's own numeric transaction id, filled in on verify/webhook.
  paystackId: text("paystack_id"),
  // Reusable card authorization returned by Paystack, if any.
  authorizationCode: text("authorization_code"),
  raw: jsonb("raw").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // Paystack reusable authorization — this is all we store, never the PAN.
  authorizationCode: text("authorization_code").notNull().unique(),
  cardType: text("card_type"),
  last4: text("last4"),
  expMonth: text("exp_month"),
  expYear: text("exp_year"),
  bank: text("bank"),
  reusable: boolean("reusable").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ================================================================== *
 * Supporting tables for existing screens
 * ================================================================== */

export const favoriteVendors = pgTable(
  "favorite_vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    vendorProfileId: uuid("vendor_profile_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    oneFavoritePerVendor: unique("favorite_vendors_profile_vendor_unique").on(
      t.profileId,
      t.vendorProfileId,
    ),
  }),
);

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  // 'ios' | 'android' | 'web'
  platform: text("platform"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
