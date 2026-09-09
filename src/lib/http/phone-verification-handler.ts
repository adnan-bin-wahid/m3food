import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import {
  bangladeshMobileSchema,
  maskBangladeshMobile,
} from "../commerce/bd-phone";
import { storeSlugSchema } from "../commerce/contracts";
import {
  createPhoneVerificationToken,
  generateOtpCode,
  hashOtpCode,
  OTP_CODE_TTL_MS,
  OTP_MAX_ATTEMPTS,
  otpCodeSchema,
  OTP_RESEND_COOLDOWN_MS,
} from "../security/phone-verification";
import type { PhoneVerificationRepository } from "../security/phone-verification-repository";
import {
  deliverOrderOtp,
  OtpDeliveryError,
  type OtpDeliveryEnvironment,
} from "../security/otp-delivery";
import { jsonApiResponse, safeServerError } from "./api-response";
import { readBoundedJson } from "./request-body";
import { getRequestClientKey, type RateLimiter } from "./rate-limiter";

const MAX_BODY_BYTES = 4 * 1024;
const START_IP_LIMIT = 5;
const START_PHONE_LIMIT = 3;
const VERIFY_IP_LIMIT = 20;
const VERIFY_PHONE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const startSchema = z.object({
  storeSlug: storeSlugSchema,
  phone: bangladeshMobileSchema,
});

const verifySchema = z.object({
  storeSlug: storeSlugSchema,
  phone: bangladeshMobileSchema,
  challengeId: z.uuid(),
  code: otpCodeSchema,
});

type CommonDependencies = {
  repository: PhoneVerificationRepository;
  rateLimiter: RateLimiter;
  secret: string;
  now?: () => Date;
  createRequestId?: () => string;
};

type StartDependencies = CommonDependencies & {
  deliveryEnvironment: OtpDeliveryEnvironment;
  fetch?: typeof fetch;
  createChallengeId?: () => string;
};

function invalidRequest(error: ZodError, requestId: string) {
  return jsonApiResponse(
    {
      error: {
        code: "INVALID_REQUEST",
        message: "Phone verification fields are invalid.",
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

async function applyRateLimits(
  input: {
    request: Request;
    storeSlug: string;
    phone: string;
    scope: string;
    ipLimit: number;
    phoneLimit: number;
    now: Date;
  },
  limiter: RateLimiter,
) {
  const clientKey = getRequestClientKey(input.request);
  const ip = await limiter.consume({
    scope: `${input.scope}:ip`,
    key: `${clientKey}\u0000${input.storeSlug}`,
    limit: input.ipLimit,
    windowMs: RATE_WINDOW_MS,
    now: input.now,
  });
  if (!ip.allowed) return ip;

  const phone = await limiter.consume({
    scope: `${input.scope}:phone`,
    key: `${input.storeSlug}\u0000${input.phone}`,
    limit: input.phoneLimit,
    windowMs: RATE_WINDOW_MS,
    now: input.now,
  });
  return phone;
}

export async function handlePhoneVerificationStart(
  request: Request,
  dependencies: StartDependencies,
) {
  const requestId =
    dependencies.createRequestId?.() ?? randomUUID();
  try {
    const raw = await readBoundedJson(request, MAX_BODY_BYTES);
    const input = startSchema.parse(raw);
    const now = dependencies.now?.() ?? new Date();
    const rate = await applyRateLimits(
      {
        request,
        storeSlug: input.storeSlug,
        phone: input.phone,
        scope: "phone-verification:start",
        ipLimit: START_IP_LIMIT,
        phoneLimit: START_PHONE_LIMIT,
        now,
      },
      dependencies.rateLimiter,
    );

    if (!rate.allowed) {
      return jsonApiResponse(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many OTP requests. Try again later.",
            requestId,
          },
        },
        429,
        requestId,
        { "Retry-After": String(rate.retryAfterSeconds) },
      );
    }

    const challengeId =
      dependencies.createChallengeId?.() ?? randomUUID();
    const code = generateOtpCode();
    const result = await dependencies.repository.startChallenge({
      id: challengeId,
      storeSlug: input.storeSlug,
      phone: input.phone,
      codeHash: hashOtpCode(dependencies.secret, challengeId, code),
      expiresAt: new Date(now.getTime() + OTP_CODE_TTL_MS),
      resendAfter: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
      maxAttempts: OTP_MAX_ATTEMPTS,
      now,
    });

    if (result.kind === "STORE_NOT_AVAILABLE") {
      return jsonApiResponse(
        {
          error: {
            code: "STORE_NOT_AVAILABLE",
            message: "The store is not available.",
            requestId,
          },
        },
        404,
        requestId,
      );
    }

    if (result.kind === "COOLDOWN") {
      return jsonApiResponse(
        {
          error: {
            code: "RESEND_COOLDOWN",
            message: "Please wait before requesting another OTP.",
            requestId,
          },
        },
        409,
        requestId,
        { "Retry-After": String(result.retryAfterSeconds) },
      );
    }

    let delivery: { devCode?: string } = {};
    try {
      delivery = await deliverOrderOtp(
        {
          phone: input.phone,
          code,
          expiresInMinutes: OTP_CODE_TTL_MS / 60_000,
        },
        dependencies.deliveryEnvironment,
        dependencies.fetch,
      );
    } catch (error) {
      await dependencies.repository.invalidateChallenge(
        challengeId,
        now,
      );
      if (error instanceof OtpDeliveryError) {
        return jsonApiResponse(
          {
            error: {
              code: "OTP_DELIVERY_UNAVAILABLE",
              message:
                "Verification code could not be delivered. Try again later.",
              requestId,
            },
          },
          503,
          requestId,
        );
      }
      throw error;
    }

    return jsonApiResponse(
      {
        data: {
          challengeId,
          phone: input.phone,
          maskedPhone: maskBangladeshMobile(input.phone),
          expiresInSeconds: OTP_CODE_TTL_MS / 1000,
          resendAfterSeconds: OTP_RESEND_COOLDOWN_MS / 1000,
          ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
        },
      },
      201,
      requestId,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return invalidRequest(error, requestId);
    }
    return safeServerError(error, requestId);
  }
}

export async function handlePhoneVerificationVerify(
  request: Request,
  dependencies: CommonDependencies,
) {
  const requestId =
    dependencies.createRequestId?.() ?? randomUUID();
  try {
    const raw = await readBoundedJson(request, MAX_BODY_BYTES);
    const input = verifySchema.parse(raw);
    const now = dependencies.now?.() ?? new Date();
    const rate = await applyRateLimits(
      {
        request,
        storeSlug: input.storeSlug,
        phone: input.phone,
        scope: "phone-verification:verify",
        ipLimit: VERIFY_IP_LIMIT,
        phoneLimit: VERIFY_PHONE_LIMIT,
        now,
      },
      dependencies.rateLimiter,
    );

    if (!rate.allowed) {
      return jsonApiResponse(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many verification attempts. Try again later.",
            requestId,
          },
        },
        429,
        requestId,
        { "Retry-After": String(rate.retryAfterSeconds) },
      );
    }

    const result = await dependencies.repository.verifyChallenge({
      challengeId: input.challengeId,
      storeSlug: input.storeSlug,
      phone: input.phone,
      codeHash: hashOtpCode(
        dependencies.secret,
        input.challengeId,
        input.code,
      ),
      now,
    });

    if (result.kind === "NOT_FOUND") {
      return jsonApiResponse(
        {
          error: {
            code: "OTP_NOT_FOUND",
            message: "Verification challenge was not found.",
            requestId,
          },
        },
        404,
        requestId,
      );
    }
    if (result.kind === "EXPIRED") {
      return jsonApiResponse(
        {
          error: {
            code: "OTP_EXPIRED",
            message: "Verification code has expired.",
            requestId,
          },
        },
        409,
        requestId,
      );
    }
    if (result.kind === "INVALID" || result.kind === "LOCKED") {
      return jsonApiResponse(
        {
          error: {
            code: "OTP_LOCKED",
            message: "Verification challenge is no longer usable.",
            requestId,
          },
        },
        409,
        requestId,
      );
    }
    if (result.kind === "INVALID_CODE") {
      return jsonApiResponse(
        {
          error: {
            code: "INVALID_OTP",
            message: "Verification code is incorrect.",
            attemptsRemaining: result.attemptsRemaining,
            requestId,
          },
        },
        400,
        requestId,
      );
    }

    const verificationToken = createPhoneVerificationToken(
      {
        challengeId: input.challengeId,
        storeSlug: input.storeSlug,
        phone: input.phone,
        verifiedAt: result.verifiedAt,
      },
      dependencies.secret,
      now,
    );

    return jsonApiResponse(
      {
        data: {
          verified: true,
          phone: input.phone,
          verifiedAt: result.verifiedAt.toISOString(),
          verificationToken,
        },
      },
      200,
      requestId,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return invalidRequest(error, requestId);
    }
    return safeServerError(error, requestId);
  }
}
