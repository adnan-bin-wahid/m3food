import assert from "node:assert/strict";
import test from "node:test";
import type { CheckoutIntentRepository } from "../commerce/checkout-intent-repository";
import { handleCheckoutIntentPost } from "./checkout-intent-handler";
import type { RateLimitDecision, RateLimiter } from "./rate-limiter";

const now = new Date("2026-09-07T10:00:00.000Z");
const requestId = "request-checkout-intent-123";
const validBody = {
  storeSlug: "m3food",
  intentKey: "checkout_intent_1234567890",
  productId: "11111111-1111-4111-8111-111111111111",
  variantId: "22222222-2222-4222-8222-222222222222",
  quantity: 1,
  contact: { phone: "01700000000", email: "person@example.com" },
  attribution: {
    visitorKey: "visitor_checkout_1234567890",
    sessionKey: "session_checkout_1234567890",
    utmSource: "facebook",
  },
  consent: {
    privacyPolicyVersion: "2026-09-07.2",
    privacyAcknowledged: true,
    emailMarketingAllowed: true,
    smsMarketingAllowed: false,
    whatsappMarketingAllowed: true,
  },
};

class FakeRateLimiter implements RateLimiter {
  constructor(private readonly decision: RateLimitDecision = { allowed: true, remaining: 29, retryAfterSeconds: 60 }) {}
  async consume() { return this.decision; }
}

function request(body: unknown = validBody) {
  return new Request("https://example.test/api/v1/checkout-intents", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.40" },
    body: JSON.stringify(body),
  });
}

function repository(): CheckoutIntentRepository {
  return {
    async upsertIntent(input) {
      assert.equal(input.storeSlug, "m3food");
      assert.equal(input.consent.emailMarketingAllowed, true);
      return { kind: "OK", updatedAt: input.now };
    },
  };
}

test("consented abandoned-checkout contact is captured through the bounded public endpoint", async () => {
  const response = await handleCheckoutIntentPost(request(), {
    repository: repository(),
    rateLimiter: new FakeRateLimiter(),
    now: () => now,
    createRequestId: () => requestId,
  });
  assert.equal(response.status, 200);
  const payload = await response.json() as { data: { captured: boolean } };
  assert.equal(payload.data.captured, true);
});

test("checkout recovery rejects contact data when no matching marketing opt-in exists", async () => {
  const response = await handleCheckoutIntentPost(request({
    ...validBody,
    consent: {
      ...validBody.consent,
      emailMarketingAllowed: false,
      smsMarketingAllowed: false,
      whatsappMarketingAllowed: false,
    },
  }), {
    repository: repository(),
    rateLimiter: new FakeRateLimiter(),
    now: () => now,
    createRequestId: () => requestId,
  });
  assert.equal(response.status, 400);
});

test("checkout recovery is rate limited before persistence", async () => {
  let calls = 0;
  const response = await handleCheckoutIntentPost(request(), {
    repository: { async upsertIntent() { calls += 1; return { kind: "OK", updatedAt: now }; } },
    rateLimiter: new FakeRateLimiter({ allowed: false, remaining: 0, retryAfterSeconds: 30 }),
    now: () => now,
    createRequestId: () => requestId,
  });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "30");
  assert.equal(calls, 0);
});
