CREATE TYPE "public"."payment_intent_status" AS ENUM('CREATED', 'INITIATING', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('SSL_COMMERZ');--> statement-breakpoint
CREATE TYPE "public"."payment_provider_event_verification_status" AS ENUM('RECEIVED', 'VERIFIED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'ONLINE';--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"status" "payment_intent_status" DEFAULT 'CREATED' NOT NULL,
	"idempotency_key" varchar(120) NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT' NOT NULL,
	"provider_session_id" varchar(255),
	"provider_reference" varchar(255),
	"redirect_url" text,
	"provider_response" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_intents_amount_nonnegative" CHECK ("payment_intents"."amount_minor" >= 0),
	CONSTRAINT "payment_intents_revision_nonnegative" CHECK ("payment_intents"."revision" >= 0)
);
--> statement-breakpoint
ALTER TABLE "payment_intents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_provider_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"payment_intent_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"event_key" varchar(255) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"verification_status" "payment_provider_event_verification_status" DEFAULT 'RECEIVED' NOT NULL,
	"provider_status" varchar(120),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	CONSTRAINT "payment_provider_events_payload_hash_length" CHECK (char_length("payment_provider_events"."payload_hash") = 64)
);
--> statement-breakpoint
ALTER TABLE "payment_provider_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_provider_events" ADD CONSTRAINT "payment_provider_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_provider_events" ADD CONSTRAINT "payment_provider_events_payment_intent_id_payment_intents_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_intents_store_idempotency_uniq" ON "payment_intents" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_intents_store_provider_session_uniq" ON "payment_intents" USING btree ("store_id","provider","provider_session_id");--> statement-breakpoint
CREATE INDEX "payment_intents_order_time_idx" ON "payment_intents" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_intents_payment_time_idx" ON "payment_intents" USING btree ("payment_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_intents_store_status_idx" ON "payment_intents" USING btree ("store_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_events_store_provider_event_uniq" ON "payment_provider_events" USING btree ("store_id","provider","event_key");--> statement-breakpoint
CREATE INDEX "payment_provider_events_intent_time_idx" ON "payment_provider_events" USING btree ("payment_intent_id","received_at");--> statement-breakpoint
CREATE INDEX "payment_provider_events_store_verification_idx" ON "payment_provider_events" USING btree ("store_id","verification_status","received_at");