import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import {
  captureCheckoutIntent,
  CheckoutIntentError,
} from "../commerce/checkout-intent-service";
import type { CheckoutIntentRepository } from "../commerce/checkout-intent-repository";
import { ApiError } from "./api-error";
import { jsonApiResponse, safeServerError } from "./api-response";
import { readBoundedJson } from "./request-body";
import { getRequestClientKey, type RateLimiter } from "./rate-limiter";

const MAX_BODY_BYTES = 12 * 1024;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function handleCheckoutIntentPost(
  request: Request,
  dependencies: {
    repository: CheckoutIntentRepository;
    rateLimiter: RateLimiter;
    now?: () => Date;
    createRequestId?: () => string;
  },
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();
  try {
    const rawBody = await readBoundedJson(request, MAX_BODY_BYTES);
    const body = rawBody as { storeSlug?: unknown };
    const now = dependencies.now?.() ?? new Date();
    const clientKey = getRequestClientKey(request);
    const storeKey = typeof body?.storeSlug === "string" ? body.storeSlug.slice(0, 120) : "unknown";
    const rate = await dependencies.rateLimiter.consume({
      scope: "checkout-intents:capture",
      key: `${clientKey}\u0000${storeKey}`,
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
      now,
    });
    if (!rate.allowed) {
      return jsonApiResponse({ error: { code: "RATE_LIMITED", message: "Too many checkout updates.", requestId } }, 429, requestId, {
        "Retry-After": String(rate.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
      });
    }

    const result = await captureCheckoutIntent(rawBody, dependencies.repository, now);
    return jsonApiResponse(
      { data: { captured: true, updatedAt: result.updatedAt.toISOString() } },
      200,
      requestId,
      { "X-RateLimit-Remaining": String(rate.remaining) },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonApiResponse({ error: { code: "INVALID_REQUEST", message: "Checkout recovery fields are invalid.", requestId } }, 400, requestId);
    }
    if (error instanceof CheckoutIntentError) {
      return jsonApiResponse({ error: { code: error.code, message: error.message, requestId } }, 404, requestId);
    }
    if (error instanceof ApiError) {
      return jsonApiResponse({ error: { code: error.code, message: error.message, requestId } }, error.status, requestId);
    }
    return safeServerError(error, requestId);
  }
}
