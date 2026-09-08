CREATE TABLE "order_cost_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"action" varchar(64) NOT NULL,
	"before_fulfillment_cost_minor" integer,
	"after_fulfillment_cost_minor" integer,
	"changed_by_admin_user_id" uuid NOT NULL,
	"changed_by_admin_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_cost_history_before_nonnegative" CHECK ("order_cost_history"."before_fulfillment_cost_minor" is null or "order_cost_history"."before_fulfillment_cost_minor" >= 0),
	CONSTRAINT "order_cost_history_after_nonnegative" CHECK ("order_cost_history"."after_fulfillment_cost_minor" is null or "order_cost_history"."after_fulfillment_cost_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "order_cost_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_cost_minor" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_cost_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_cost_history" ADD CONSTRAINT "order_cost_history_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_cost_history" ADD CONSTRAINT "order_cost_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_cost_history_store_time_idx" ON "order_cost_history" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "order_cost_history_order_time_idx" ON "order_cost_history" USING btree ("order_id","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfillment_cost_nonnegative" CHECK ("orders"."fulfillment_cost_minor" is null or "orders"."fulfillment_cost_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfillment_cost_revision_nonnegative" CHECK ("orders"."fulfillment_cost_revision" >= 0);