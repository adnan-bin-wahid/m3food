CREATE TYPE "public"."paid_ads_provider" AS ENUM('META', 'GOOGLE');--> statement-breakpoint
CREATE TABLE "paid_ad_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"provider" "paid_ads_provider" NOT NULL,
	"external_account_id" varchar(160) NOT NULL,
	"name" varchar(160) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_by_admin_user_id" uuid NOT NULL,
	"created_by_admin_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paid_ad_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "paid_ad_campaign_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"marketing_campaign_id" uuid,
	"external_campaign_id" varchar(160) NOT NULL,
	"external_campaign_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_by_admin_user_id" uuid NOT NULL,
	"created_by_admin_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paid_ad_campaign_mappings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "paid_ad_daily_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"mapping_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"spend_minor" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"ingestion_source" varchar(16) DEFAULT 'MANUAL' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_by_admin_user_id" uuid NOT NULL,
	"updated_by_admin_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paid_ad_daily_metrics_spend_nonnegative" CHECK ("paid_ad_daily_metrics"."spend_minor" >= 0),
	CONSTRAINT "paid_ad_daily_metrics_impressions_nonnegative" CHECK ("paid_ad_daily_metrics"."impressions" >= 0),
	CONSTRAINT "paid_ad_daily_metrics_clicks_nonnegative" CHECK ("paid_ad_daily_metrics"."clicks" >= 0)
);
--> statement-breakpoint
ALTER TABLE "paid_ad_daily_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "paid_ad_accounts" ADD CONSTRAINT "paid_ad_accounts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_ad_campaign_mappings" ADD CONSTRAINT "paid_ad_campaign_mappings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_ad_campaign_mappings" ADD CONSTRAINT "paid_ad_campaign_mappings_account_id_paid_ad_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."paid_ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_ad_campaign_mappings" ADD CONSTRAINT "paid_ad_campaign_mappings_marketing_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("marketing_campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_ad_daily_metrics" ADD CONSTRAINT "paid_ad_daily_metrics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_ad_daily_metrics" ADD CONSTRAINT "paid_ad_daily_metrics_mapping_id_paid_ad_campaign_mappings_id_fk" FOREIGN KEY ("mapping_id") REFERENCES "public"."paid_ad_campaign_mappings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "paid_ad_accounts_store_provider_external_uniq" ON "paid_ad_accounts" USING btree ("store_id","provider","external_account_id");--> statement-breakpoint
CREATE INDEX "paid_ad_accounts_store_provider_active_idx" ON "paid_ad_accounts" USING btree ("store_id","provider","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "paid_ad_campaign_mappings_account_external_uniq" ON "paid_ad_campaign_mappings" USING btree ("account_id","external_campaign_id");--> statement-breakpoint
CREATE INDEX "paid_ad_campaign_mappings_store_campaign_idx" ON "paid_ad_campaign_mappings" USING btree ("store_id","marketing_campaign_id");--> statement-breakpoint
CREATE INDEX "paid_ad_campaign_mappings_store_account_idx" ON "paid_ad_campaign_mappings" USING btree ("store_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paid_ad_daily_metrics_store_mapping_date_uniq" ON "paid_ad_daily_metrics" USING btree ("store_id","mapping_id","metric_date");--> statement-breakpoint
CREATE INDEX "paid_ad_daily_metrics_store_date_idx" ON "paid_ad_daily_metrics" USING btree ("store_id","metric_date");--> statement-breakpoint
CREATE INDEX "paid_ad_daily_metrics_mapping_date_idx" ON "paid_ad_daily_metrics" USING btree ("mapping_id","metric_date");