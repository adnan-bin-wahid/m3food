import { randomUUID } from "node:crypto";
import { createLandingOrder } from "../../../../src/lib/commerce/order-service";
import { getMarketingEnvironment, getOrderApiEnvironment } from "../../../../src/lib/config/server-env";
import { DrizzleLandingOrderRepository } from "../../../../src/lib/db/landing-order-repository";
import { DrizzleRateLimiter } from "../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../src/lib/http/api-response";
import { handleOrderPost } from "../../../../src/lib/http/order-handler";
import { getRequestClientKey } from "../../../../src/lib/http/rate-limiter";
import { sendMetaCapiEvent } from "../../../../src/lib/marketing/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    const repository = new DrizzleLandingOrderRepository();
    const marketing = getMarketingEnvironment();

    return handleOrderPost(request, {
      createOrder: async (input) => {
        const result = await createLandingOrder(input, repository);
        if (result.created && result.marketing) {
          await sendMetaCapiEvent({
            ...result.marketing,
            eventName: "PURCHASE",
            clientIp: getRequestClientKey(request),
            userAgent: request.headers.get("user-agent")?.slice(0, 2048),
          }, marketing);
        }
        return result;
      },
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
