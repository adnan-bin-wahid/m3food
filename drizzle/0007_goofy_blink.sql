ALTER TABLE "stores" ADD COLUMN "meta_pixel_id" varchar(25) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "settings_revision" integer DEFAULT 0 NOT NULL;