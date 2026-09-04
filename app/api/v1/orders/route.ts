import { randomUUID } from "node:crypto";
import { createLandingOrder } from "../../../../src/lib/commerce/order-service";
import { getOrderApiEnvironment } from "../../../../src/lib/config/server-env";
import { DrizzleLandingOrderRepository } from "../../../../src/lib/db/landing-order-repository";
import { DrizzleRateLimiter } from "../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../src/lib/http/api-response";
import { handleOrderPost } from "../../../../src/lib/http/order-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    const repository = new DrizzleLandingOrderRepository();

    return handleOrderPost(request, {
      createOrder: (input) => createLandingOrder(input, repository),
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
