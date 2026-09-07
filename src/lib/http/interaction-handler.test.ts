import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserInteractionEventInput } from "../analytics/interaction-contracts";
import { handleInteractionPost, type InteractionHandlerDependencies } from "./interaction-handler";
import type { RateLimitDecision, RateLimiter } from "./rate-limiter";

const now = new Date("2026-09-07T12:00:00.000Z");
const requestId = "request-interaction-123";
const validBody = {
  storeSlug: "m3food",
  eventId: "interaction_11111111-1111-4111-8111-111111111111",
  eventName: "CTA_CLICK",
  elementKey: "hero_order",
  elementLabel: "Order now",
  sectionKey: "hero",
  targetUrl: "https://example.test/#order",
  consent: {
    analyticsAllowed: true,
    privacyPolicyVersion: "2026-09-07.3",
  },
  attribution: {
    visitorKey: "visitor_interaction_1234567890",
    sessionKey: "session_interaction_1234567890",
    landingPage: "https://example.test/?utm_source=facebook",
    utmSource: "facebook",
  },
};

class FakeRateLimiter implements RateLimiter {
  input: Parameters<RateLimiter["consume"]>[0] | null = null;
  constructor(private readonly decision: RateLimitDecision = { allowed: true, remaining: 239, retryAfterSeconds: 60 }) {}
  async consume(input: Parameters<RateLimiter["consume"]>[0]) {
    this.input = input;
    return this.decision;
  }
}

function request(body: unknown = validBody) {
  return new Request("https://example.test/api/v1/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Interaction Test Browser",
      "x-forwarded-for": "203.0.113.60, 10.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

function dependencies(
  recordEvent: InteractionHandlerDependencies["recordEvent"],
  rateLimiter: RateLimiter = new FakeRateLimiter(),
): InteractionHandlerDependencies {
  return {
    recordEvent,
    rateLimiter,
    hashClientKey: (value) => `hash:${value}`,
    createRequestId: () => requestId,
    now: () => now,
  };
}

test("a consented CTA interaction is persisted with bounded request context", async () => {
  const limiter = new FakeRateLimiter();
  const received: BrowserInteractionEventInput[] = [];
  const response = await handleInteractionPost(
    request(),
    dependencies(async (input, eventTime, context) => {
      received.push(input);
      assert.equal(eventTime, now);
      assert.equal(context.userAgent, "Interaction Test Browser");
      assert.equal(context.ipHash, "hash:203.0.113.60");
      return { eventId: input.eventId, created: true };
    }, limiter),
  );

  assert.equal(response.status, 201);
  assert.equal(received[0]?.eventName, "CTA_CLICK");
  assert.equal(received[0]?.elementKey, "hero_order");
  assert.equal(limiter.input?.scope, "visitor-interactions:create");
});

test("CTA interactions without an element key and analytics consent are rejected", async () => {
  let persistCalls = 0;
  const deps = dependencies(async (input) => {
    persistCalls += 1;
    return { eventId: input.eventId, created: true };
  });

  const missingKey = await handleInteractionPost(
    request({ ...validBody, elementKey: undefined }),
    deps,
  );
  const noConsent = await handleInteractionPost(
    request({ ...validBody, consent: { analyticsAllowed: false, privacyPolicyVersion: "2026-09-07.3" } }),
    deps,
  );

  assert.equal(missingKey.status, 400);
  assert.equal(noConsent.status, 400);
  assert.equal(persistCalls, 0);
});

test("interaction events are rate limited before persistence", async () => {
  let persistCalls = 0;
  const response = await handleInteractionPost(
    request(),
    dependencies(
      async (input) => {
        persistCalls += 1;
        return { eventId: input.eventId, created: true };
      },
      new FakeRateLimiter({ allowed: false, remaining: 0, retryAfterSeconds: 30 }),
    ),
  );

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "30");
  assert.equal(persistCalls, 0);
});
