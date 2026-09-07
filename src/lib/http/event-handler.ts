import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import {
  browserCommerceEventInputSchema,
  type BrowserCommerceEventInput,
} from "../commerce/contracts";
import { CommerceError } from "../commerce/commerce-error";
import type {
  BrowserEventRequestContext,
  RecordedCommerceEvent,
} from "../commerce/event-repository";
import { ApiError } from "./api-error";
import { jsonApiResponse, safeServerError } from "./api-response";
import { readBoundedJson } from "./request-body";
import { getRequestClientKey, type RateLimiter } from "./rate-limiter";

const MAX_EVENT_BODY_BYTES = 8 * 1024;
const EVENT_RATE_LIMIT = 120;
const EVENT_RATE_WINDOW_MS = 60 * 1000;

export interface EventHandlerDependencies {
  recordEvent(
    input: BrowserCommerceEventInput,
    occurredAt: Date,
    requestContext: BrowserEventRequestContext,
  ): Promise<RecordedCommerceEvent>;
  rateLimiter: RateLimiter;
  hashClientKey(value: string): string;
  createRequestId?: () => string;
  now?: () => Date;
}

export async function handleEventPost(
  request: Request,
  dependencies: EventHandlerDependencies,
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();

  try {
    const body = browserCommerceEventInputSchema.parse(
      await readBoundedJson(request, MAX_EVENT_BODY_BYTES),
    );
    const now = dependencies.now?.() ?? new Date();
    const clientKey = getRequestClientKey(request);
    const rateLimit = await dependencies.rateLimiter.consume({
      scope: "commerce-events:create",
      key: `${clientKey}\u0000${body.storeSlug}`,
      limit: EVENT_RATE_LIMIT,
      windowMs: EVENT_RATE_WINDOW_MS,
      now,
    });

    if (!rateLimit.allowed) {
      return jsonApiResponse(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many analytics events. Try again later.",
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

    const result = await dependencies.recordEvent(body, now, {
      userAgent: request.headers.get("user-agent")?.slice(0, 2048),
      ipHash: dependencies.hashClientKey(clientKey),
      clientIp: clientKey,
    });
    return jsonApiResponse(
      { data: { eventId: result.eventId, created: result.created } },
      result.created ? 201 : 200,
      requestId,
      { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonApiResponse(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "The analytics event contains invalid fields.",
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
    if (error instanceof CommerceError) {
      return jsonApiResponse(
        {
          error: { code: error.code, message: error.message, requestId },
        },
        error.code === "STORE_NOT_AVAILABLE" ? 404 : 409,
        requestId,
      );
    }
    if (error instanceof ApiError) {
      return jsonApiResponse(
        {
          error: { code: error.code, message: error.message, requestId },
        },
        error.status,
        requestId,
      );
    }
    return safeServerError(error, requestId);
  }
}
