import { createHmac, randomUUID } from "node:crypto";
import { recordBrowserInteractionEvent } from "../../../../src/lib/analytics/interaction-service";
import { getOrderApiEnvironment } from "../../../../src/lib/config/server-env";
import { DrizzleInteractionEventRepository } from "../../../../src/lib/db/interaction-repository";
import { DrizzleRateLimiter } from "../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../src/lib/http/api-response";
import { handleInteractionPost } from "../../../../src/lib/http/interaction-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    const repository = new DrizzleInteractionEventRepository();
    return handleInteractionPost(request, {
      recordEvent: (input, occurredAt, context) =>
        recordBrowserInteractionEvent(input, repository, occurredAt, context),
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
      hashClientKey: (value) =>
        createHmac("sha256", RATE_LIMIT_SALT).update(value).digest("hex"),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
