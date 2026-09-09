CREATE TYPE "public"."order_risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TABLE "phone_verification_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"phone" varchar(20) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"resend_after" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_verification_attempt_count_nonnegative" CHECK ("phone_verification_challenges"."attempt_count" >= 0),
	CONSTRAINT "phone_verification_max_attempts_positive" CHECK ("phone_verification_challenges"."max_attempts" > 0)
);
--> statement-breakpoint
ALTER TABLE "phone_verification_challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "phone_verification_challenge_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "risk_level" "order_risk_level" DEFAULT 'LOW' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "risk_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "risk_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "manual_review_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phone_verification_challenges" ADD CONSTRAINT "phone_verification_challenges_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phone_verification_store_phone_created_idx" ON "phone_verification_challenges" USING btree ("store_id","phone","created_at");--> statement-breakpoint
CREATE INDEX "phone_verification_expires_idx" ON "phone_verification_challenges" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_phone_verification_challenge_id_phone_verification_challenges_id_fk" FOREIGN KEY ("phone_verification_challenge_id") REFERENCES "public"."phone_verification_challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_store_risk_created_idx" ON "orders" USING btree ("store_id","risk_level","created_at");