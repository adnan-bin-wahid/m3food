import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import {
  browserInteractionEventInputSchema,
  type BrowserInteractionEventInput,
} from "../analytics/interaction-contracts";
import type {
  BrowserInteractionRequestContext,
  RecordedInteractionEvent,
} from "../analytics/interaction-repository";
import { CommerceError } from "../commerce/commerce-error";
import { ApiError } from "./api-error";
import { jsonApiResponse, safeServerError } from "./api-response";
import { readBoundedJson } from "./request-body";
import { getRequestClientKey, type RateLimiter } from "./rate-limiter";

const MAX_INTERACTION_BODY_BYTES = 10 * 1024;
const INTERACTION_RATE_LIMIT = 240;
const INTERACTION_RATE_WINDOW_MS = 60 * 1000;

export interface InteractionHandlerDependencies {
  recordEvent(
    input: BrowserInteractionEventInput,
    occurredAt: Date,
    requestContext: BrowserInteractionRequestContext,
  ): Promise<RecordedInteractionEvent>;
  rateLimiter: RateLimiter;
  hashClientKey(value: string): string;
  createRequestId?: () => string;
  now?: () => Date;
}

export async function handleInteractionPost(
  request: Request,
  dependencies: InteractionHandlerDependencies,
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();
  try {
    const body = browserInteractionEventInputSchema.parse(
      await readBoundedJson(request, MAX_INTERACTION_BODY_BYTES),
    );
    const now = dependencies.now?.() ?? new Date();
    const clientKey = getRequestClientKey(request);
    const rateLimit = await dependencies.rateLimiter.consume({
      scope: "visitor-interactions:create",
      key: `${clientKey}\u0000${body.storeSlug}`,
      limit: INTERACTION_RATE_LIMIT,
      windowMs: INTERACTION_RATE_WINDOW_MS,
      now,
    });
    if (!rateLimit.allowed) {
      return jsonApiResponse({ error: {
        code: "RATE_LIMITED",
        message: "Too many interaction events. Try again later.",
        requestId,
      } }, 429, requestId, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
      });
    }

    const requestContext: BrowserInteractionRequestContext =
      body.consent.analyticsAllowed
        ? {
            userAgent: request.headers.get("user-agent")?.slice(0, 2048),
            ipHash: dependencies.hashClientKey(clientKey),
          }
        : {};

    const result = await dependencies.recordEvent(body, now, requestContext);
    return jsonApiResponse(
      { data: { eventId: result.eventId, created: result.created } },
      result.created ? 201 : 200,
      requestId,
      { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonApiResponse({ error: {
        code: "INVALID_REQUEST",
        message: "The interaction event contains invalid fields.",
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        requestId,
      } }, 400, requestId);
    }
    if (error instanceof CommerceError) {
      return jsonApiResponse({ error: {
        code: error.code,
        message: error.message,
        requestId,
      } }, error.code === "STORE_NOT_AVAILABLE" ? 404 : 409, requestId);
    }
    if (error instanceof ApiError) {
      return jsonApiResponse({ error: {
        code: error.code,
        message: error.message,
        requestId,
      } }, error.status, requestId);
    }
    return safeServerError(error, requestId);
  }
}
