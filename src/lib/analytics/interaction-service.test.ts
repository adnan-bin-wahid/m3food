import assert from "node:assert/strict";
import test from "node:test";
import type { InteractionEventRepository } from "./interaction-repository";
import { recordBrowserInteractionEvent } from "./interaction-service";

const base = {
  storeSlug: "m3food",
  eventId: "interaction_1234567890",
  attribution: {
    visitorKey: "visitor_1234567890",
    sessionKey: "session_1234567890",
  },
  consent: {
    analyticsAllowed: true as const,
    privacyPolicyVersion: "2026-09-07",
  },
};

function repository(received: unknown[]): InteractionEventRepository {
  return {
    async recordInteractionEvent(input, occurredAt, context) {
      received.push({ input, occurredAt, context });
      return { eventId: input.eventId, created: true };
    },
  };
}

test("CTA interactions require a stable element key and preserve bounded metadata", async () => {
  const received: unknown[] = [];
  const result = await recordBrowserInteractionEvent({
    ...base,
    eventName: "CTA_CLICK",
    elementKey: "hero_order_now",
    elementLabel: "Order now",
    sectionKey: "hero",
    targetUrl: "https://example.test/#order",
  }, repository(received), new Date("2026-09-07T10:00:00Z"), { userAgent: "test" });
  assert.equal(result.created, true);
  assert.equal((received[0] as any).input.elementKey, "hero_order_now");
});

test("section views and scroll depth validate event-specific fields", async () => {
  await assert.rejects(
    recordBrowserInteractionEvent({ ...base, eventName: "SECTION_VIEW" }, repository([])),
  );
  await assert.rejects(
    recordBrowserInteractionEvent({ ...base, eventName: "SCROLL_DEPTH" }, repository([])),
  );
  const result = await recordBrowserInteractionEvent({
    ...base,
    eventId: "interaction_abcdefghij",
    eventName: "SCROLL_DEPTH",
    scrollDepth: 75,
  }, repository([]));
  assert.equal(result.created, true);
});
