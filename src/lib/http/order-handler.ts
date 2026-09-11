import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { CommerceError } from "../commerce/commerce-error";
import {
  idempotencyKeySchema,
  landingOrderRequestSchema,
  type LandingOrderInput,
} from "../commerce/contracts";
import type { LandingOrderResult } from "../commerce/order-service";
import { ApiError } from "./api-error";
import { jsonApiResponse, safeServerError } from "./api-response";
import { readBoundedJson } from "./request-body";
import { getRequestClientKey, type RateLimiter } from "./rate-limiter";

const MAX_ORDER_BODY_BYTES = 16 * 1024;
const ORDER_RATE_LIMIT = 10;
const ORDER_RATE_WINDOW_MS = 10 * 60 * 1000;

export interface OrderHandlerDependencies {
  createOrder(input: LandingOrderInput): Promise<LandingOrderResult>;
  rateLimiter: RateLimiter;
  createRequestId?: () => string;
  now?: () => Date;
  phoneOtpRequired?: boolean;
}

function validationResponse(error: ZodError, requestId: string) {
  return jsonApiResponse(
    {
      error: {
        code: "INVALID_REQUEST",
        message: "The order request contains invalid fields.",
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        requestId,
      },
    },
    400,
    requestId,
  );
}

function commerceErrorResponse(error: CommerceError, requestId: string) {
  const status = error.code === "STORE_NOT_AVAILABLE" ? 404 : 409;
  return jsonApiResponse(
    {
      error: {
        code: error.code,
        message: error.message,
        requestId,
      },
    },
    status,
    requestId,
  );
}

export async function handleOrderPost(
  request: Request,
  dependencies: OrderHandlerDependencies,
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();

  try {
    const rawBody = await readBoundedJson(request, MAX_ORDER_BODY_BYTES);
    const body = landingOrderRequestSchema.parse(rawBody);
    const otpRequired = dependencies.phoneOtpRequired ?? true;
    if (otpRequired && !body.phoneVerificationToken) {
      throw new ApiError(
        "INVALID_REQUEST",
        "A valid mobile verification is required before placing the order.",
        400,
      );
    }
    const idempotencyHeader = request.headers.get("idempotency-key");

    if (!idempotencyHeader) {
      throw new ApiError(
        "MISSING_IDEMPOTENCY_KEY",
        "The Idempotency-Key header is required.",
        400,
      );
    }

    const idempotencyKey = idempotencyKeySchema.parse(idempotencyHeader);
    const now = dependencies.now?.() ?? new Date();
    const clientKey = getRequestClientKey(request);
    const rateLimit = await dependencies.rateLimiter.consume({
      scope: "landing-orders:create",
      key: `${clientKey}\u0000${body.storeSlug}`,
      limit: ORDER_RATE_LIMIT,
      windowMs: ORDER_RATE_WINDOW_MS,
      now,
    });

    if (!rateLimit.allowed) {
      return jsonApiResponse(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many order attempts. Try again later.",
            requestId,
          },
        },
        429,
        requestId,
        {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
        },
      );
    }

    const result = await dependencies.createOrder({
      ...body,
      idempotencyKey,
    });

    return jsonApiResponse(
      {
        data: {
          publicId: result.publicId,
          status: result.status,
          totalMinor: result.totalMinor,
          currency: result.currency,
          createdAt: result.createdAt.toISOString(),
          created: result.created,
          preferencesUrl: result.preferencesUrl,
        },
      },
      result.created ? 201 : 200,
      requestId,
      { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    );
  } catch (error) {
    if (error instanceof ZodError) return validationResponse(error, requestId);
    if (error instanceof CommerceError) {
      return commerceErrorResponse(error, requestId);
    }
    if (error instanceof ApiError) {
      return jsonApiResponse(
        {
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
        },
        error.status,
        requestId,
      );
    }
    return safeServerError(error, requestId);
  }
}
