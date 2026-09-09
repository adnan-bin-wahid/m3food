import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import {
  bangladeshMobileSchema,
  normalizeBangladeshMobile,
} from "../commerce/bd-phone";
import { storeSlugSchema } from "../commerce/contracts";

export const OTP_CODE_LENGTH = 6;
export const OTP_CODE_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_TOKEN_TTL_MS = 15 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit verification code.");

export function generateOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(OTP_CODE_LENGTH, "0");
}

export function hashOtpCode(
  secret: string,
  challengeId: string,
  code: string,
) {
  return createHmac("sha256", secret)
    .update(`${challengeId}\u0000${code}`)
    .digest("hex");
}

const tokenPayloadSchema = z.object({
  v: z.literal(1),
  challengeId: z.uuid(),
  storeSlug: storeSlugSchema,
  phone: bangladeshMobileSchema,
  verifiedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type PhoneVerificationTokenPayload = z.infer<
  typeof tokenPayloadSchema
>;

function signBody(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeSignatureEqual(left: string, right: string) {
  try {
    const a = Buffer.from(left, "base64url");
    const b = Buffer.from(right, "base64url");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createPhoneVerificationToken(
  input: {
    challengeId: string;
    storeSlug: string;
    phone: string;
    verifiedAt: Date;
  },
  secret: string,
  now = new Date(),
) {
  const payload: PhoneVerificationTokenPayload = {
    v: 1,
    challengeId: input.challengeId,
    storeSlug: input.storeSlug,
    phone: normalizeBangladeshMobile(input.phone),
    verifiedAt: input.verifiedAt.toISOString(),
    expiresAt: new Date(now.getTime() + OTP_TOKEN_TTL_MS).toISOString(),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${signBody(body, secret)}`;
}

export function verifyPhoneVerificationToken(
  token: string,
  secret: string,
  now = new Date(),
): PhoneVerificationTokenPayload {
  const [body, signature, extra] = token.trim().split(".");
  if (!body || !signature || extra) {
    throw new Error("Phone verification token is malformed.");
  }
  if (!safeSignatureEqual(signature, signBody(body, secret))) {
    throw new Error("Phone verification token signature is invalid.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new Error("Phone verification token payload is invalid.");
  }

  const payload = tokenPayloadSchema.parse(decoded);
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
    throw new Error("Phone verification token has expired.");
  }
  return payload;
}
