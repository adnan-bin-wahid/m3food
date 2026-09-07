import { randomUUID } from "node:crypto";
import { getOrderApiEnvironment } from "../../../../src/lib/config/server-env";
import { DrizzleCheckoutIntentRepository } from "../../../../src/lib/db/checkout-intent-repository";
import { DrizzleRateLimiter } from "../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../src/lib/http/api-response";
import { handleCheckoutIntentPost } from "../../../../src/lib/http/checkout-intent-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    return handleCheckoutIntentPost(request, {
      repository: new DrizzleCheckoutIntentRepository(),
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
