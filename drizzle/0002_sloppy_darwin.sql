CREATE TYPE "public"."paystack_txn_status" AS ENUM('pending', 'success', 'failed', 'abandoned', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."paystack_txn_type" AS ENUM('topup', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."wallet_kind" AS ENUM('student', 'vendor', 'courier');--> statement-breakpoint
CREATE TYPE "public"."wallet_txn_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."wallet_txn_reason" AS ENUM('topup', 'order_payment', 'order_refund', 'appointment_payment', 'appointment_refund', 'courier_earning', 'vendor_earning', 'payout', 'payout_reversal', 'adjustment');--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"authorization_code" text NOT NULL,
	"card_type" text,
	"last4" text,
	"exp_month" text,
	"exp_year" text,
	"bank" text,
	"reusable" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paystack_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid,
	"type" "paystack_txn_type" DEFAULT 'topup' NOT NULL,
	"reference" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" "paystack_txn_status" DEFAULT 'pending' NOT NULL,
	"access_code" text,
	"authorization_url" text,
	"channel" text,
	"paystack_id" text,
	"authorization_code" text,
	"raw" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paystack_transactions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"direction" "wallet_txn_direction" NOT NULL,
	"amount_minor" bigint NOT NULL,
	"balance_after_minor" bigint NOT NULL,
	"reason" "wallet_txn_reason" NOT NULL,
	"reference" text,
	"idempotency_key" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "wallet_kind" DEFAULT 'student' NOT NULL,
	"balance_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_kind_unique" UNIQUE("user_id","kind")
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paystack_transactions" ADD CONSTRAINT "paystack_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paystack_transactions" ADD CONSTRAINT "paystack_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;