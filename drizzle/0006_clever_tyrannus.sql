ALTER TABLE "order_status_history" ADD COLUMN "changed_by_admin_user_id" uuid;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN "changed_by_admin_email" varchar(255);--> statement-breakpoint
CREATE INDEX "order_status_history_admin_idx" ON "order_status_history" USING btree ("changed_by_admin_user_id");