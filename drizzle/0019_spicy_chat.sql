CREATE TABLE "payment_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"from_status" "payment_status" NOT NULL,
	"to_status" "payment_status" NOT NULL,
	"before_provider_reference" varchar(255),
	"after_provider_reference" varchar(255),
	"note" text,
	"changed_by_admin_user_id" uuid NOT NULL,
	"changed_by_admin_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_status_history_store_time_idx" ON "payment_status_history" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_status_history_order_time_idx" ON "payment_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_status_history_payment_time_idx" ON "payment_status_history" USING btree ("payment_id","created_at");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_revision_nonnegative" CHECK ("payments"."revision" >= 0);