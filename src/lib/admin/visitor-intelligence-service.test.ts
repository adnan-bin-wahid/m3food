import assert from "node:assert/strict";
import test from "node:test";
import { buildVisitorIntelligenceOverview, normalizeCtaPerformance } from "./visitor-intelligence-service";

const store = { name: "M3Food", slug: "m3food", currency: "BDT", timezone: "Asia/Dhaka", clarityProjectId: "abc123xyz" };

test("CTA CTR uses unique viewed sessions and cannot exceed 100 percent", () => {
  const row = normalizeCtaPerformance({
    elementKey: "hero_order",
    elementLabel: "Order now",
    sectionKey: "hero",
    uniqueViews: 10,
    uniqueClicks: 12,
    clicks: 19,
    orders: 3,
    revenueMinor: 375000,
  });
  assert.equal(row.uniqueClicks, 10);
  assert.equal(row.ctr, 100);
  assert.equal(row.clicks, 19);
});

test("visitor intelligence overview normalizes CTA, section and scroll metrics", () => {
  const result = buildVisitorIntelligenceOverview({
    store,
    interactionEvents: 20,
    ctas: [{ elementKey: "hero", elementLabel: null, sectionKey: "hero", uniqueViews: 8, uniqueClicks: 2, clicks: 3, orders: 1, revenueMinor: 125000 }],
    sections: [{ sectionKey: "reviews", uniqueVisitors: 4, uniqueSessions: 5 }],
    scrollDepths: [{ scrollDepth: 75, uniqueSessions: 3 }, { scrollDepth: 25, uniqueSessions: 8 }],
  }, { range: "30d", startAt: new Date(), endAt: new Date(), label: "Last 30 days" });
  assert.equal(result.ctas[0]?.ctr, 25);
  assert.deepEqual(result.scrollDepths.map((row) => row.scrollDepth), [25, 75]);
});
