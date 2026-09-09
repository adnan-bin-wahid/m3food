import { randomUUID } from "node:crypto";
import {
  getOrderApiEnvironment,
  getOtpDeliveryEnvironment,
  getPhoneVerificationSecret,
} from "../../../../../src/lib/config/server-env";
import { DrizzlePhoneVerificationRepository } from "../../../../../src/lib/db/phone-verification-repository";
import { DrizzleRateLimiter } from "../../../../../src/lib/db/rate-limiter";
import { safeServerError } from "../../../../../src/lib/http/api-response";
import { handlePhoneVerificationStart } from "../../../../../src/lib/http/phone-verification-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    return handlePhoneVerificationStart(request, {
      repository: new DrizzlePhoneVerificationRepository(),
      rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
      secret: getPhoneVerificationSecret(),
      deliveryEnvironment: getOtpDeliveryEnvironment(),
    });
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
