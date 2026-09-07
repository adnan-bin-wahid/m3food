CREATE TABLE "customer_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "note" text NOT NULL,
  "created_by_admin_user_id" uuid NOT NULL,
  "created_by_admin_email" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "tag" varchar(40) NOT NULL,
  "added_by_admin_user_id" uuid NOT NULL,
  "added_by_admin_email" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_activity_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "action" varchar(64) NOT NULL,
  "changed_by_admin_user_id" uuid NOT NULL,
  "changed_by_admin_email" varchar(255) NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activity_history" ADD CONSTRAINT "customer_activity_history_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activity_history" ADD CONSTRAINT "customer_activity_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_notes_store_customer_time_idx" ON "customer_notes" USING btree ("store_id","customer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tags_store_customer_tag_uniq" ON "customer_tags" USING btree ("store_id","customer_id","tag");--> statement-breakpoint
CREATE INDEX "customer_tags_store_tag_idx" ON "customer_tags" USING btree ("store_id","tag");--> statement-breakpoint
CREATE INDEX "customer_activity_store_customer_time_idx" ON "customer_activity_history" USING btree ("store_id","customer_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_activity_store_action_time_idx" ON "customer_activity_history" USING btree ("store_id","action","created_at");--> statement-breakpoint
ALTER TABLE "customer_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_activity_history" ENABLE ROW LEVEL SECURITY;
