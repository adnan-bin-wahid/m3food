import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import type {
  RateLimitDecision,
  RateLimiter,
  RateLimitInput,
} from "../http/rate-limiter";
import { getDatabase, type Database } from "./index";
import { requestRateLimits } from "./schema";

export class DrizzleRateLimiter implements RateLimiter {
  constructor(
    private readonly salt: string,
    private readonly database: Database = getDatabase(),
  ) {}

  async consume(input: RateLimitInput): Promise<RateLimitDecision> {
    const keyHash = createHmac("sha256", this.salt)
      .update(input.key)
      .digest("hex");
    const databaseExpiry = sql`current_timestamp + (${input.windowMs} * interval '1 millisecond')`;

    const [row] = await this.database
      .insert(requestRateLimits)
      .values({
        scope: input.scope,
        keyHash,
        requestCount: 1,
        windowStartedAt: sql`current_timestamp`,
        expiresAt: databaseExpiry,
        updatedAt: sql`current_timestamp`,
      })
      .onConflictDoUpdate({
        target: [requestRateLimits.scope, requestRateLimits.keyHash],
        set: {
          requestCount: sql`case
            when ${requestRateLimits.expiresAt} <= current_timestamp then 1
            else ${requestRateLimits.requestCount} + 1
          end`,
          windowStartedAt: sql`case
            when ${requestRateLimits.expiresAt} <= current_timestamp then current_timestamp
            else ${requestRateLimits.windowStartedAt}
          end`,
          expiresAt: sql`case
            when ${requestRateLimits.expiresAt} <= current_timestamp then ${databaseExpiry}
            else ${requestRateLimits.expiresAt}
          end`,
          updatedAt: sql`current_timestamp`,
        },
      })
      .returning({
        requestCount: requestRateLimits.requestCount,
        expiresAt: requestRateLimits.expiresAt,
      });

    if (!row) throw new Error("Rate-limit update returned no row.");

    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((row.expiresAt.getTime() - input.now.getTime()) / 1000),
    );

    return {
      allowed: row.requestCount <= input.limit,
      remaining: Math.max(0, input.limit - row.requestCount),
      retryAfterSeconds,
    };
  }
}
