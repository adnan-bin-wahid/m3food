import { createHmac, randomUUID } from "node:crypto";
import { recordBrowserCommerceEvent } from "../../../../src/lib/commerce/event-service";
import { getMarketingEnvironment, getOrderApiEnvironment } from "../../../../src/lib/config/server-env";
import { DrizzleCommerceEventRepository } from "../../../../src/lib/db/event-repository";
import { DrizzleRateLimiter } from "../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../src/lib/http/api-response";
import { handleEventPost } from "../../../../src/lib/http/event-handler";
import { sendMetaCapiEvent } from "../../../../src/lib/marketing/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    const repository = new DrizzleCommerceEventRepository();
    const marketing = getMarketingEnvironment();

    return handleEventPost(request, {
      recordEvent: async (input, occurredAt, context) => {
        const result = await recordBrowserCommerceEvent(input, repository, occurredAt, context);
        if (result.created && result.delivery) {
          const capiResult = await sendMetaCapiEvent({
            ...result.delivery,
            clientIp: context.clientIp,
            userAgent: context.userAgent,
          }, marketing);
          console.log("Meta CAPI delivery result", {
            eventName: result.delivery.eventName,
            eventId: result.delivery.eventId,
            sent: capiResult.sent,
            reason: capiResult.reason,
            status: capiResult.status,
          });
        }
        return result;
      },
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
      hashClientKey: (value) =>
        createHmac("sha256", RATE_LIMIT_SALT).update(value).digest("hex"),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
