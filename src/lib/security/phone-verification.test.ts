import assert from "node:assert/strict";
import test from "node:test";
import {
  createPhoneVerificationToken,
  hashOtpCode,
  verifyPhoneVerificationToken,
} from "./phone-verification";

const secret = "a-secure-phone-verification-secret-with-more-than-32-characters";
const now = new Date("2026-09-09T05:00:00.000Z");

test("OTP hashes do not store the plaintext code", () => {
  const hash = hashOtpCode(
    secret,
    "11111111-1111-4111-8111-111111111111",
    "123456",
  );
  assert.equal(hash.length, 64);
  assert.notEqual(hash, "123456");
});

test("phone verification tokens bind challenge store and normalized phone", () => {
  const token = createPhoneVerificationToken(
    {
      challengeId: "11111111-1111-4111-8111-111111111111",
      storeSlug: "client-store",
      phone: "+8801712345678",
      verifiedAt: now,
    },
    secret,
    now,
  );
  const payload = verifyPhoneVerificationToken(token, secret, now);
  assert.equal(payload.storeSlug, "client-store");
  assert.equal(payload.phone, "01712345678");
});

test("tampered or expired verification tokens fail closed", () => {
  const token = createPhoneVerificationToken(
    {
      challengeId: "11111111-1111-4111-8111-111111111111",
      storeSlug: "client-store",
      phone: "01712345678",
      verifiedAt: now,
    },
    secret,
    now,
  );
  assert.throws(() =>
    verifyPhoneVerificationToken(`${token}x`, secret, now),
  );
  assert.throws(() =>
    verifyPhoneVerificationToken(
      token,
      secret,
      new Date(now.getTime() + 16 * 60 * 1000),
    ),
  );
});
