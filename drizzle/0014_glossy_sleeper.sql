ALTER TABLE "order_attributions" ADD COLUMN "first_touch_campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD COLUMN "last_touch_campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_first_touch_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("first_touch_campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_last_touch_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("last_touch_campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD CONSTRAINT "visitor_sessions_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_attributions_first_campaign_idx" ON "order_attributions" USING btree ("store_id","first_touch_campaign_id");--> statement-breakpoint
CREATE INDEX "order_attributions_last_campaign_idx" ON "order_attributions" USING btree ("store_id","last_touch_campaign_id");--> statement-breakpoint
CREATE INDEX "visitor_sessions_campaign_id_idx" ON "visitor_sessions" USING btree ("store_id","campaign_id");

-- PART_N_02_SESSION_CAMPAIGN_BACKFILL
-- Conservative lowercase/trim exact match only. Raw UTM evidence is preserved.
update "visitor_sessions" as vs
set "campaign_id" = mc."id"
from "marketing_campaigns" as mc
where vs."campaign_id" is null
  and vs."store_id" = mc."store_id"
  and lower(trim(coalesce(vs."utm_campaign", ''))) = mc."campaign_key";
