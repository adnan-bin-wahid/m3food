import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserCommerceEventInput } from "../commerce/contracts";
import { handleEventPost, type EventHandlerDependencies } from "./event-handler";
import type { RateLimitDecision, RateLimiter } from "./rate-limiter";

const now = new Date("2026-09-04T00:00:00.000Z");
const requestId = "request-event-123";
const validBody = {
  storeSlug: "demo-store",
  eventId: "event_11111111-1111-4111-8111-111111111111",
  eventName: "VIEW_CONTENT",
  productId: "11111111-1111-4111-8111-111111111111",
  variantId: "22222222-2222-4222-8222-222222222222",
  quantity: 1,
  consent: {
    analyticsAllowed: true,
    privacyPolicyVersion: "2026-09-07.4",
  },
  attribution: {
    visitorKey: "visitor_1234567890",
    sessionKey: "session_1234567890",
    landingPage: "https://example.test/offer",
  },
};

class FakeRateLimiter implements RateLimiter {
  input: Parameters<RateLimiter["consume"]>[0] | null = null;

  constructor(
    private readonly decision: RateLimitDecision = {
      allowed: true,
      remaining: 119,
      retryAfterSeconds: 60,
    },
  ) {}

  async consume(input: Parameters<RateLimiter["consume"]>[0]) {
    this.input = input;
    return this.decision;
  }
}

function request(body: unknown = validBody) {
  return new Request("https://example.test/api/v1/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Event Test Browser",
      "x-forwarded-for": "203.0.113.20, 10.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

function dependencies(
  recordEvent: EventHandlerDependencies["recordEvent"],
  rateLimiter: RateLimiter = new FakeRateLimiter(),
): EventHandlerDependencies {
  return {
    recordEvent,
    rateLimiter,
    hashClientKey: (value) => `hash:${value}`,
    createRequestId: () => requestId,
    now: () => now,
  };
}

test("a consented browser event is persisted with full server request context", async () => {
  const limiter = new FakeRateLimiter();
  const received: BrowserCommerceEventInput[] = [];
  const response = await handleEventPost(
    request(),
    dependencies(async (input, eventTime, context) => {
      received.push(input);
      assert.equal(eventTime, now);
      assert.equal(context.userAgent, "Event Test Browser");
      assert.equal(context.ipHash, "hash:203.0.113.20");
      assert.equal(context.clientIp, "203.0.113.20");
      return { eventId: input.eventId, created: true };
    }, limiter),
  );

  assert.equal(response.status, 201);
  assert.equal(received[0]?.eventName, "VIEW_CONTENT");
  assert.match(limiter.input?.key ?? "", /^203\.0\.113\.20\u0000demo-store$/);
});

test("privacy-reduced first-party events are accepted without storing request fingerprint context", async () => {
  let persistCalls = 0;
  const response = await handleEventPost(
    request({
      ...validBody,
      consent: {
        analyticsAllowed: false,
        privacyPolicyVersion: "2026-09-07.4",
      },
      attribution: {
        ...validBody.attribution,
        visitorKey: "visitor_session_1234567890",
        sessionKey: "session_anon_1234567890",
      },
    }),
    dependencies(async (input, _eventTime, context) => {
      persistCalls += 1;
      assert.equal(input.consent.analyticsAllowed, false);
      assert.deepEqual(context, {});
      return { eventId: input.eventId, created: true };
    }),
  );

  assert.equal(response.status, 201);
  assert.equal(persistCalls, 1);
});

test("an idempotently repeated browser event returns 200", async () => {
  const response = await handleEventPost(
    request(),
    dependencies(async (input) => ({ eventId: input.eventId, created: false })),
  );

  assert.equal(response.status, 200);
  assert.equal(
    ((await response.json()) as { data: { created: boolean } }).data.created,
    false,
  );
});

test("purchase events and malformed product events are rejected", async () => {
  let persistCalls = 0;
  const deps = dependencies(async (input) => {
    persistCalls += 1;
    return { eventId: input.eventId, created: true };
  });
  const purchase = await handleEventPost(
    request({ ...validBody, eventName: "PURCHASE" }),
    deps,
  );
  const missingVariant = await handleEventPost(
    request({ ...validBody, eventName: "ADD_TO_CART", variantId: undefined }),
    deps,
  );

  assert.equal(purchase.status, 400);
  assert.equal(missingVariant.status, 400);
  assert.equal(persistCalls, 0);
});

test("rate-limited events are rejected before persistence", async () => {
  let persistCalls = 0;
  const response = await handleEventPost(
    request(),
    dependencies(
      async (input) => {
        persistCalls += 1;
        return { eventId: input.eventId, created: true };
      },
      new FakeRateLimiter({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 30,
      }),
    ),
  );

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "30");
  assert.equal(persistCalls, 0);
});
