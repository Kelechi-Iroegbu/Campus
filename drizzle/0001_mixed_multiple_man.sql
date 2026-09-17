ALTER TABLE "appointments" ADD COLUMN "platform_fee_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "total_minor" bigint NOT NULL;
