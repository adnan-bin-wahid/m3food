CREATE TYPE "public"."visitor_interaction_event_name" AS ENUM('SESSION_START', 'SECTION_VIEW', 'CTA_VIEW', 'CTA_CLICK', 'SCROLL_DEPTH', 'WHATSAPP_CLICK', 'MESSENGER_CLICK');
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "clarity_project_id" varchar(64) DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE TABLE "visitor_interaction_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "visitor_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "event_name" "visitor_interaction_event_name" NOT NULL,
  "event_id" varchar(120) NOT NULL,
  "page_url" text,
  "element_key" varchar(160),
  "element_label" varchar(255),
  "section_key" varchar(160),
  "target_url" text,
  "scroll_depth" integer,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "visitor_interaction_events_scroll_depth_check" CHECK ("visitor_interaction_events"."scroll_depth" is null or ("visitor_interaction_events"."scroll_depth" >= 1 and "visitor_interaction_events"."scroll_depth" <= 100))
);
--> statement-breakpoint
ALTER TABLE "visitor_interaction_events" ADD CONSTRAINT "visitor_interaction_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "visitor_interaction_events" ADD CONSTRAINT "visitor_interaction_events_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "visitor_interaction_events" ADD CONSTRAINT "visitor_interaction_events_session_id_visitor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."visitor_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "visitor_interaction_events_store_event_id_uniq" ON "visitor_interaction_events" USING btree ("store_id","event_id");
--> statement-breakpoint
CREATE INDEX "visitor_interaction_events_store_name_time_idx" ON "visitor_interaction_events" USING btree ("store_id","event_name","occurred_at");
--> statement-breakpoint
CREATE INDEX "visitor_interaction_events_session_time_idx" ON "visitor_interaction_events" USING btree ("session_id","occurred_at");
--> statement-breakpoint
CREATE INDEX "visitor_interaction_events_store_element_idx" ON "visitor_interaction_events" USING btree ("store_id","element_key","event_name");
--> statement-breakpoint
ALTER TABLE "visitor_interaction_events" ENABLE ROW LEVEL SECURITY;
