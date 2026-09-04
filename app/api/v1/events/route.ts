import { createHmac, randomUUID } from "node:crypto";
import { recordBrowserCommerceEvent } from "../../../../src/lib/commerce/event-service";
import { getOrderApiEnvironment } from "../../../../src/lib/config/server-env";
import { DrizzleCommerceEventRepository } from "../../../../src/lib/db/event-repository";
import { DrizzleRateLimiter } from "../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../src/lib/http/api-response";
import { handleEventPost } from "../../../../src/lib/http/event-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    const repository = new DrizzleCommerceEventRepository();

    return handleEventPost(request, {
      recordEvent: (input, occurredAt, context) =>
        recordBrowserCommerceEvent(input, repository, occurredAt, context),
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
      hashClientKey: (value) =>
        createHmac("sha256", RATE_LIMIT_SALT).update(value).digest("hex"),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
