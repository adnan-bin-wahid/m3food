CREATE TABLE "order_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"privacy_policy_version" varchar(32) NOT NULL,
	"analytics_allowed" boolean DEFAULT false NOT NULL,
	"email_marketing_allowed" boolean DEFAULT false NOT NULL,
	"sms_marketing_allowed" boolean DEFAULT false NOT NULL,
	"whatsapp_marketing_allowed" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_consents" ADD CONSTRAINT "order_consents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_consents" ADD CONSTRAINT "order_consents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_consents_order_uniq" ON "order_consents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_consents_store_captured_idx" ON "order_consents" USING btree ("store_id","captured_at");