import {
  bigint,
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Wallet & Paystack (PLAN.md — Milestone 4)
 *
 * NOTE: these reference `users.id` for now. Per PLAN.md §1 the owning
 * row is meant to be `profiles`; swap the FK target when that table
 * lands. All money is stored in minor units (kobo) as bigint.
 * ------------------------------------------------------------------ */

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

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: walletKind("kind").notNull().default("student"),
    balanceMinor: bigint("balance_minor", { mode: "number" })
      .notNull()
      .default(0),
    currency: text("currency").notNull().default("NGN"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    oneWalletPerKind: unique("wallets_user_kind_unique").on(t.userId, t.kind),
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
  // Free-form pointer to the thing that caused this movement (paystack ref,
  // order id, appointment id, delivery-job id, payout id…).
  reference: text("reference"),
  // Guards against double-applying the same event (e.g. a resent webhook).
  idempotencyKey: text("idempotency_key").unique(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paystackTransactions = pgTable("paystack_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Paystack reusable authorization — this is all we store, never the PAN.
  authorizationCode: text("authorization_code").notNull(),
  cardType: text("card_type"),
  last4: text("last4"),
  expMonth: text("exp_month"),
  expYear: text("exp_year"),
  bank: text("bank"),
  reusable: boolean("reusable").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
