ALTER TABLE "order_items" ADD COLUMN "unit_cost_minor" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "total_cost_minor" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "unit_cost_minor" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_cost_nonnegative" CHECK ("order_items"."unit_cost_minor" is null or "order_items"."unit_cost_minor" >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_total_cost_nonnegative" CHECK ("order_items"."total_cost_minor" is null or "order_items"."total_cost_minor" >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_cost_pair_consistent" CHECK (("order_items"."unit_cost_minor" is null) = ("order_items"."total_cost_minor" is null));--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_total_cost_consistent" CHECK ("order_items"."total_cost_minor" is null or "order_items"."total_cost_minor" = "order_items"."unit_cost_minor" * "order_items"."quantity");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_unit_cost_nonnegative" CHECK ("product_variants"."unit_cost_minor" is null or "product_variants"."unit_cost_minor" >= 0);