import assert from "node:assert/strict";
import test from "node:test";
import type { CommerceEventRepository } from "./event-repository";
import { recordBrowserCommerceEvent } from "./event-service";

const occurredAt = new Date("2026-09-04T00:00:00.000Z");
const baseInput = {
  storeSlug: "demo-store",
  eventId: "event_11111111-1111-4111-8111-111111111111",
  eventName: "PAGE_VIEW" as const,
  attribution: {
    visitorKey: "visitor_1234567890",
    sessionKey: "session_1234567890",
    landingPage: "https://example.test/offer",
  },
};

test("a valid browser event is normalized and persisted", async () => {
  const received: Array<
    Parameters<CommerceEventRepository["recordBrowserEvent"]>[0]
  > = [];
  const repository: CommerceEventRepository = {
    recordBrowserEvent: async (input, eventTime, requestContext) => {
      received.push(input);
      assert.equal(eventTime, occurredAt);
      assert.equal(requestContext.ipHash, "hashed-ip");
      return { eventId: input.eventId, created: true };
    },
  };

  const result = await recordBrowserCommerceEvent(baseInput, repository, occurredAt, {
    ipHash: "hashed-ip",
  });

  assert.equal(result.created, true);
  assert.equal(received[0]?.quantity, 1);
});

test("product events require both product and variant identifiers", () => {
  const repository: CommerceEventRepository = {
    recordBrowserEvent: async () => {
      throw new Error("must not persist");
    },
  };

  assert.throws(() =>
    recordBrowserCommerceEvent(
      { ...baseInput, eventName: "BEGIN_CHECKOUT" },
      repository,
      occurredAt,
    ),
  );
});

test("the public event endpoint cannot forge purchase events", () => {
  const repository: CommerceEventRepository = {
    recordBrowserEvent: async () => {
      throw new Error("must not persist");
    },
  };

  assert.throws(() =>
    recordBrowserCommerceEvent(
      { ...baseInput, eventName: "PURCHASE" },
      repository,
      occurredAt,
    ),
  );
});
