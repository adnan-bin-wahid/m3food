CREATE TYPE "public"."marketing_campaign_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"campaign_key" varchar(120) NOT NULL,
	"source" varchar(120) NOT NULL,
	"medium" varchar(120) NOT NULL,
	"content" varchar(160),
	"term" varchar(160),
	"landing_url" text,
	"notes" text,
	"status" "marketing_campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_by_admin_user_id" uuid NOT NULL,
	"created_by_admin_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_campaigns_store_key_uniq" ON "marketing_campaigns" USING btree ("store_id","campaign_key");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_store_status_idx" ON "marketing_campaigns" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_store_created_idx" ON "marketing_campaigns" USING btree ("store_id","created_at");