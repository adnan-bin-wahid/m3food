CREATE TABLE "checkout_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "intent_key" varchar(120) NOT NULL,
  "visitor_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "product_id" uuid,
  "variant_id" uuid,
  "phone" varchar(32),
  "email" varchar(255),
  "quantity" integer DEFAULT 1 NOT NULL,
  "privacy_policy_version" varchar(32) NOT NULL,
  "email_marketing_allowed" boolean DEFAULT false NOT NULL,
  "sms_marketing_allowed" boolean DEFAULT false NOT NULL,
  "whatsapp_marketing_allowed" boolean DEFAULT false NOT NULL,
  "last_activity_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "checkout_intents_quantity_positive" CHECK ("checkout_intents"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "customer_marketing_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "email_marketing_allowed" boolean DEFAULT false NOT NULL,
  "sms_marketing_allowed" boolean DEFAULT false NOT NULL,
  "whatsapp_marketing_allowed" boolean DEFAULT false NOT NULL,
  "privacy_policy_version" varchar(32) NOT NULL,
  "source" varchar(32) DEFAULT 'SELF_SERVICE' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillment_shipments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "provider" varchar(32) DEFAULT 'STEADFAST' NOT NULL,
  "status" varchar(32) DEFAULT 'PENDING' NOT NULL,
  "request_fingerprint" varchar(64) NOT NULL,
  "consignment_id" varchar(128),
  "tracking_code" varchar(128),
  "provider_status" varchar(64),
  "last_error" text,
  "provider_response" jsonb,
  "submitted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "fulfillment_shipments_provider_check" CHECK ("fulfillment_shipments"."provider" = 'STEADFAST'),
  CONSTRAINT "fulfillment_shipments_status_check" CHECK ("fulfillment_shipments"."status" in ('PENDING', 'SUBMITTED', 'FAILED'))
);
--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_session_id_visitor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."visitor_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_marketing_preferences" ADD CONSTRAINT "customer_marketing_preferences_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_marketing_preferences" ADD CONSTRAINT "customer_marketing_preferences_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fulfillment_shipments" ADD CONSTRAINT "fulfillment_shipments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fulfillment_shipments" ADD CONSTRAINT "fulfillment_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_intents_store_key_uniq" ON "checkout_intents" USING btree ("store_id","intent_key");
--> statement-breakpoint
CREATE INDEX "checkout_intents_store_activity_idx" ON "checkout_intents" USING btree ("store_id","last_activity_at");
--> statement-breakpoint
CREATE INDEX "checkout_intents_session_idx" ON "checkout_intents" USING btree ("session_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_marketing_preferences_store_customer_uniq" ON "customer_marketing_preferences" USING btree ("store_id","customer_id");
--> statement-breakpoint
CREATE INDEX "customer_marketing_preferences_store_updated_idx" ON "customer_marketing_preferences" USING btree ("store_id","updated_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "fulfillment_shipments_store_order_uniq" ON "fulfillment_shipments" USING btree ("store_id","order_id");
--> statement-breakpoint
CREATE INDEX "fulfillment_shipments_store_status_idx" ON "fulfillment_shipments" USING btree ("store_id","status","updated_at");
--> statement-breakpoint
ALTER TABLE "checkout_intents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customer_marketing_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "fulfillment_shipments" ENABLE ROW LEVEL SECURITY;
