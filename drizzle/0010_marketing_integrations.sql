ALTER TABLE "stores" ADD COLUMN "ga4_measurement_id" varchar(32) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "gtm_container_id" varchar(32) DEFAULT '' NOT NULL;
