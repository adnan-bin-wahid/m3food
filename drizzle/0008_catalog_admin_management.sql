ALTER TABLE "products" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "catalog_change_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "product_id" uuid,
  "variant_id" uuid,
  "action" varchar(64) NOT NULL,
  "changed_by_admin_user_id" uuid NOT NULL,
  "changed_by_admin_email" varchar(255) NOT NULL,
  "before_state" jsonb,
  "after_state" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_change_history" ADD CONSTRAINT "catalog_change_history_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_change_history" ADD CONSTRAINT "catalog_change_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_change_history" ADD CONSTRAINT "catalog_change_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_change_history_store_time_idx" ON "catalog_change_history" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "catalog_change_history_product_idx" ON "catalog_change_history" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "catalog_change_history_variant_idx" ON "catalog_change_history" USING btree ("variant_id");--> statement-breakpoint
ALTER TABLE "catalog_change_history" ENABLE ROW LEVEL SECURITY;
