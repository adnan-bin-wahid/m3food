import assert from "node:assert/strict";
import test from "node:test";
import { CommerceError } from "../commerce/commerce-error";
import type { LandingOrderInput } from "../commerce/contracts";
import type { LandingOrderResult } from "../commerce/order-service";
import { handleOrderPost, type OrderHandlerDependencies } from "./order-handler";
import type { RateLimitDecision, RateLimiter } from "./rate-limiter";

const now = new Date("2026-09-04T00:00:00.000Z");
const requestId = "request-123";

const validBody = {
  storeSlug: "demo-store",
  variantId: "11111111-1111-4111-8111-111111111111",
  quantity: 2,
  customer: {
    name: "Demo Customer",
    phone: "+8801700000000",
  },
  shippingAddress: {
    addressLine1: "House 1, Road 2",
    district: "Dhaka",
  },
  phoneVerificationToken: "phone_verification_token_test_12345678901234567890",
  consent: {
    privacyPolicyVersion: "2026-09-04",
    analyticsAllowed: true,
    emailMarketingAllowed: false,
    smsMarketingAllowed: true,
    whatsappMarketingAllowed: true,
  },
  attribution: {
    visitorKey: "visitor_1234567890",
    sessionKey: "session_1234567890",
    landingPage: "https://example.test/offer",
  },
};

const createdOrder: LandingOrderResult = {
  id: "22222222-2222-4222-8222-222222222222",
  publicId: "ORD-20260904-ABCDEF12",
  requestHash: "a".repeat(64),
  status: "PENDING",
  totalMinor: 250000,
  currency: "BDT",
  createdAt: now,
  created: true,
};

class FakeRateLimiter implements RateLimiter {
  input: Parameters<RateLimiter["consume"]>[0] | null = null;

  constructor(
    private readonly decision: RateLimitDecision = {
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 600,
    },
  ) {}

  async consume(input: Parameters<RateLimiter["consume"]>[0]) {
    this.input = input;
    return this.decision;
  }
}

function createRequest(overrides: {
  body?: unknown;
  idempotencyKey?: string | null;
} = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
  };
  const key = Object.hasOwn(overrides, "idempotencyKey")
    ? overrides.idempotencyKey
    : "checkout_attempt_123456";
  if (key) headers["idempotency-key"] = key;

  return new Request("https://example.test/api/v1/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(overrides.body ?? validBody),
  });
}

function createDependencies(
  createOrder: (input: LandingOrderInput) => Promise<LandingOrderResult>,
  rateLimiter: RateLimiter = new FakeRateLimiter(),
): OrderHandlerDependencies {
  return {
    createOrder,
    rateLimiter,
    createRequestId: () => requestId,
    now: () => now,
  };
}

test("a valid order returns only its safe public representation", async () => {
  const limiter = new FakeRateLimiter();
  let receivedIdempotencyKey: string | undefined;
  const response = await handleOrderPost(
    createRequest(),
    createDependencies(async (input) => {
      receivedIdempotencyKey = input.idempotencyKey;
      return createdOrder;
    }, limiter),
  );
  const body = (await response.json()) as {
    data: Record<string, unknown>;
  };

  assert.equal(response.status, 201);
  assert.equal(response.headers.get("x-request-id"), requestId);
  assert.equal(response.headers.get("x-ratelimit-remaining"), "9");
  assert.equal(body.data.publicId, createdOrder.publicId);
  assert.equal(body.data.id, undefined);
  assert.equal(body.data.requestHash, undefined);
  assert.equal(receivedIdempotencyKey, "checkout_attempt_123456");
  assert.match(limiter.input?.key ?? "", /^203\.0\.113\.10\u0000demo-store$/);
});

test("an idempotent replay returns 200 instead of creating again", async () => {
  const response = await handleOrderPost(
    createRequest(),
    createDependencies(async () => ({ ...createdOrder, created: false })),
  );

  assert.equal(response.status, 200);
  assert.equal(((await response.json()) as { data: { created: boolean } }).data.created, false);
});

test("a missing idempotency key is rejected before persistence", async () => {
  let createCalls = 0;
  const response = await handleOrderPost(
    createRequest({ idempotencyKey: null }),
    createDependencies(async () => {
      createCalls += 1;
      return createdOrder;
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(
    ((await response.json()) as { error: { code: string } }).error.code,
    "MISSING_IDEMPOTENCY_KEY",
  );
  assert.equal(createCalls, 0);
});

test("an order without a versioned consent snapshot is rejected", async () => {
  let createCalls = 0;
  const { consent: _consent, ...withoutConsent } = validBody;
  const response = await handleOrderPost(
    createRequest({ body: withoutConsent }),
    createDependencies(async () => {
      createCalls += 1;
      return createdOrder;
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(createCalls, 0);
});

test("rate-limited requests receive 429 and are not persisted", async () => {
  let createCalls = 0;
  const limiter = new FakeRateLimiter({
    allowed: false,
    remaining: 0,
    retryAfterSeconds: 120,
  });
  const response = await handleOrderPost(
    createRequest(),
    createDependencies(async () => {
      createCalls += 1;
      return createdOrder;
    }, limiter),
  );

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "120");
  assert.equal(createCalls, 0);
});

test("commerce conflicts are mapped without leaking internal fields", async () => {
  const response = await handleOrderPost(
    createRequest(),
    createDependencies(async () => {
      throw new CommerceError("OUT_OF_STOCK", "The item is out of stock.");
    }),
  );
  const body = (await response.json()) as { error: Record<string, unknown> };

  assert.equal(response.status, 409);
  assert.equal(body.error.code, "OUT_OF_STOCK");
  assert.equal(body.error.stack, undefined);
});

test("an order without phone verification is rejected before persistence", async () => {
  let createCalls = 0;
  const { phoneVerificationToken: _token, ...withoutVerification } = validBody;
  const response = await handleOrderPost(
    createRequest({ body: withoutVerification }),
    createDependencies(async () => {
      createCalls += 1;
      return createdOrder;
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(createCalls, 0);
});
