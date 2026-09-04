import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import {
  AdminAuthError,
  loginAdmin,
  logoutAdmin,
  normalizeAdminEmail,
  verifyAdminSession,
} from "../auth/admin-auth";
import type { AdminAuthRepository } from "../auth/admin-repository";
import { adminLoginSchema } from "../auth/contracts";
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  readAdminSessionToken,
} from "../auth/session";
import { ApiError } from "./api-error";
import { jsonApiResponse, safeServerError } from "./api-response";
import { readBoundedJson } from "./request-body";
import { getRequestClientKey, type RateLimiter } from "./rate-limiter";

const LOGIN_BODY_LIMIT = 4 * 1024;
const LOGIN_RATE_LIMIT = 8;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

export interface AdminAuthHandlerDependencies {
  repository: AdminAuthRepository;
  rateLimiter: RateLimiter;
  sessionSecret: string;
  now?: () => Date;
  createRequestId?: () => string;
}

function publicError(
  code: string,
  message: string,
  status: number,
  requestId: string,
  headers: Record<string, string> = {},
) {
  return jsonApiResponse(
    { error: { code, message, requestId } },
    status,
    requestId,
    headers,
  );
}

export async function handleAdminLogin(
  request: Request,
  dependencies: AdminAuthHandlerDependencies,
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();
  try {
    const body = adminLoginSchema.parse(
      await readBoundedJson(request, LOGIN_BODY_LIMIT),
    );
    const now = dependencies.now?.() ?? new Date();
    const rateLimit = await dependencies.rateLimiter.consume({
      scope: "admin-auth:login",
      key: `${getRequestClientKey(request)}\u0000${body.storeSlug}\u0000${normalizeAdminEmail(body.email)}`,
      limit: LOGIN_RATE_LIMIT,
      windowMs: LOGIN_RATE_WINDOW_MS,
      now,
    });
    if (!rateLimit.allowed) {
      return publicError(
        "RATE_LIMITED",
        "Too many login attempts. Try again later.",
        429,
        requestId,
        { "Retry-After": String(rateLimit.retryAfterSeconds) },
      );
    }

    const result = await loginAdmin(
      body,
      dependencies.repository,
      dependencies.sessionSecret,
      { now: () => now },
    );
    return jsonApiResponse(
      {
        data: {
          authenticated: true,
          admin: result.identity,
          expiresAt: result.expiresAt.toISOString(),
        },
      },
      200,
      requestId,
      {
        "Set-Cookie": createAdminSessionCookie(
          result.sessionToken,
          result.expiresAt,
        ),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    );
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return publicError(
        "INVALID_CREDENTIALS",
        "The email or password is incorrect.",
        401,
        requestId,
      );
    }
    if (error instanceof ZodError) {
      return publicError(
        "INVALID_REQUEST",
        "Store, email, and a password of at least 12 characters are required.",
        400,
        requestId,
      );
    }
    if (error instanceof ApiError) {
      return publicError(error.code, error.message, error.status, requestId);
    }
    return safeServerError(error, requestId);
  }
}

export async function handleAdminSession(
  request: Request,
  dependencies: Pick<
    AdminAuthHandlerDependencies,
    "repository" | "sessionSecret" | "createRequestId" | "now"
  >,
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();
  try {
    const identity = await verifyAdminSession(
      readAdminSessionToken(request.headers.get("cookie")),
      dependencies.repository,
      dependencies.sessionSecret,
      dependencies.now?.() ?? new Date(),
    );
    return jsonApiResponse(
      { data: { authenticated: Boolean(identity), admin: identity } },
      200,
      requestId,
    );
  } catch (error) {
    return safeServerError(error, requestId);
  }
}

export async function handleAdminLogout(
  request: Request,
  dependencies: Pick<
    AdminAuthHandlerDependencies,
    "repository" | "sessionSecret" | "createRequestId" | "now"
  >,
) {
  const requestId = dependencies.createRequestId?.() ?? randomUUID();
  try {
    await logoutAdmin(
      readAdminSessionToken(request.headers.get("cookie")),
      dependencies.repository,
      dependencies.sessionSecret,
      dependencies.now?.() ?? new Date(),
    );
    return jsonApiResponse(
      { data: { authenticated: false } },
      200,
      requestId,
      { "Set-Cookie": clearAdminSessionCookie() },
    );
  } catch (error) {
    return safeServerError(error, requestId);
  }
}
