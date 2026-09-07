import assert from "node:assert/strict";
import test from "node:test";
import type { RetargetingRepository } from "./retargeting-repository";
import {
  getRetargetingAudience,
  parseRetargetingAudience,
  parseRetargetingWindow,
  resolveRetargetingWindow,
} from "./retargeting-service";

function repository(): RetargetingRepository {
  return {
    async getAudience(storeId, eventName, startAt, cutoffAt, limit) {
      assert.equal(storeId, "store-1");
      assert.equal(eventName, "ADD_TO_CART");
      assert.equal(limit, 100);
      assert.equal(startAt.toISOString(), "2026-08-08T12:00:00.000Z");
      assert.equal(cutoffAt.toISOString(), "2026-09-07T11:30:00.000Z");
      return {
        store: {
          name: "M3Food",
          slug: "m3food",
          currency: "BDT",
          timezone: "Asia/Dhaka",
          metaPixelId: "123456789012345",
        },
        rows: [
          {
            visitorId: "visitor-1",
            visitorKey: "visitor_key_abcdefghijkl",
            sessionId: "session-1",
            sessionKey: "session_key_abcdefghijkl",
            source: "facebook",
            campaign: "eid",
            productName: "Product A",
            sku: "SKU-A",
            valueMinor: 125000,
            lastActionAt: new Date("2026-09-06T09:00:00.000Z"),
            lastSeenAt: new Date("2026-09-06T09:05:00.000Z"),
          },
          {
            visitorId: "visitor-2",
            visitorKey: "visitor_key_zzzzzzzzzzzzzzzz",
            sessionId: "session-2",
            sessionKey: "session_key_zzzzzzzzzzzzzzzz",
            source: "facebook",
            campaign: null,
            productName: "Product B",
            sku: "SKU-B",
            valueMinor: 75000,
            lastActionAt: new Date("2026-09-05T09:00:00.000Z"),
            lastSeenAt: new Date("2026-09-05T09:05:00.000Z"),
          },
        ],
      };
    },
  };
}

test("retargeting query parsing is bounded to fixed audiences and windows", () => {
  assert.equal(parseRetargetingAudience("CHECKOUT_ABANDONERS"), "CHECKOUT_ABANDONERS");
  assert.equal(parseRetargetingAudience("unknown"), "CART_ABANDONERS");
  assert.equal(parseRetargetingWindow("14"), 14);
  assert.equal(parseRetargetingWindow("365"), 30);
});

test("retargeting windows reserve a 30 minute abandonment grace period", () => {
  const now = new Date("2026-09-07T12:00:00.000Z");
  const window = resolveRetargetingWindow(7, now);
  assert.equal(window.startAt.toISOString(), "2026-08-31T12:00:00.000Z");
  assert.equal(window.cutoffAt.toISOString(), "2026-09-07T11:30:00.000Z");
});

test("cart audience view calculates unique visitor value and sources", async () => {
  const result = await getRetargetingAudience(
    "store-1",
    "CART_ABANDONERS",
    30,
    repository(),
    new Date("2026-09-07T12:00:00.000Z"),
  );
  assert.equal(result.summary.visitors, 2);
  assert.equal(result.summary.potentialValueMinor, 200000);
  assert.equal(result.summary.sourceCount, 1);
  assert.equal(result.sources[0]?.source, "facebook");
  assert.equal(result.sources[0]?.visitors, 2);
  assert.equal(result.definition.metaRule, "Include AddToCart; exclude Purchase");
});
