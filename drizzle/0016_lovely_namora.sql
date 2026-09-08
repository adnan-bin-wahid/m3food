CREATE TYPE "public"."paid_ads_sync_run_status" AS ENUM('RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TABLE "paid_ad_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" "paid_ads_provider" NOT NULL,
	"schedule_key" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "paid_ads_sync_run_status" DEFAULT 'RUNNING' NOT NULL,
	"rows_fetched" integer DEFAULT 0 NOT NULL,
	"rows_written" integer DEFAULT 0 NOT NULL,
	"skipped_unmapped" integer DEFAULT 0 NOT NULL,
	"error_code" varchar(64),
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "paid_ad_sync_runs_window_valid" CHECK ("paid_ad_sync_runs"."start_date" <= "paid_ad_sync_runs"."end_date"),
	CONSTRAINT "paid_ad_sync_runs_rows_fetched_nonnegative" CHECK ("paid_ad_sync_runs"."rows_fetched" >= 0),
	CONSTRAINT "paid_ad_sync_runs_rows_written_nonnegative" CHECK ("paid_ad_sync_runs"."rows_written" >= 0),
	CONSTRAINT "paid_ad_sync_runs_skipped_nonnegative" CHECK ("paid_ad_sync_runs"."skipped_unmapped" >= 0)
);
--> statement-breakpoint
ALTER TABLE "paid_ad_sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "paid_ad_accounts" ADD COLUMN "sync_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "paid_ad_accounts" ADD COLUMN "sync_lookback_days" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "paid_ad_sync_runs" ADD CONSTRAINT "paid_ad_sync_runs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_ad_sync_runs" ADD CONSTRAINT "paid_ad_sync_runs_account_id_paid_ad_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."paid_ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "paid_ad_sync_runs_schedule_key_uniq" ON "paid_ad_sync_runs" USING btree ("schedule_key");--> statement-breakpoint
CREATE INDEX "paid_ad_sync_runs_store_started_idx" ON "paid_ad_sync_runs" USING btree ("store_id","started_at");--> statement-breakpoint
CREATE INDEX "paid_ad_sync_runs_account_started_idx" ON "paid_ad_sync_runs" USING btree ("account_id","started_at");--> statement-breakpoint
CREATE INDEX "paid_ad_accounts_sync_enabled_idx" ON "paid_ad_accounts" USING btree ("sync_enabled","is_active");--> statement-breakpoint
ALTER TABLE "paid_ad_accounts" ADD CONSTRAINT "paid_ad_accounts_sync_lookback_valid" CHECK ("paid_ad_accounts"."sync_lookback_days" >= 1 and "paid_ad_accounts"."sync_lookback_days" <= 31);