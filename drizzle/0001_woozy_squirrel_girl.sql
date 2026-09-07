ALTER TABLE "order_attributions" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "request_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_value_nonnegative" CHECK ("commerce_events"."value_minor" is null or "commerce_events"."value_minor" >= 0);--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_available_nonnegative" CHECK ("inventory"."available" >= 0);--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_reserved_nonnegative" CHECK ("inventory"."reserved" >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_nonnegative" CHECK ("order_items"."unit_price_minor" >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_total_nonnegative" CHECK ("order_items"."total_minor" >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_total_consistent" CHECK ("order_items"."total_minor" = "order_items"."unit_price_minor" * "order_items"."quantity");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_nonnegative" CHECK ("orders"."subtotal_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_nonnegative" CHECK ("orders"."discount_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_not_above_subtotal" CHECK ("orders"."discount_minor" <= "orders"."subtotal_minor");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_nonnegative" CHECK ("orders"."shipping_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_nonnegative" CHECK ("orders"."total_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_consistent" CHECK ("orders"."total_minor" = "orders"."subtotal_minor" - "orders"."discount_minor" + "orders"."shipping_minor");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_nonnegative" CHECK ("payments"."amount_minor" >= 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_price_nonnegative" CHECK ("product_variants"."price_minor" >= 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_compare_price_nonnegative" CHECK ("product_variants"."compare_at_price_minor" is null or "product_variants"."compare_at_price_minor" >= 0);