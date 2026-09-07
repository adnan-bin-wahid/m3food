CREATE TABLE "request_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(80) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"request_count" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_rate_limits_count_positive" CHECK ("request_rate_limits"."request_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "request_rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "request_rate_limits_scope_key_uniq" ON "request_rate_limits" USING btree ("scope","key_hash");--> statement-breakpoint
CREATE INDEX "request_rate_limits_expiry_idx" ON "request_rate_limits" USING btree ("expires_at");