import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketingOverview, parseMarketingRange, resolveMarketingWindow } from "./marketing-analytics-service";

test("marketing ranges are bounded and deterministic", () => {
  assert.equal(parseMarketingRange("7d"), "7d");
  assert.equal(parseMarketingRange("365d"), "30d");
  const window = resolveMarketingWindow("7d", new Date("2026-09-07T12:00:00Z"));
  assert.equal(window.startAt?.toISOString(), "2026-08-31T12:00:00.000Z");
});

test("marketing overview calculates funnel conversion and channel totals", () => {
  const result = buildMarketingOverview({
    store: { name: "M3Food", slug: "m3food", currency: "BDT", timezone: "Asia/Dhaka" },
    events: { visitors: 10, pageViews: 18, productViews: 8, addToCarts: 5, checkouts: 3, purchases: 2 },
    orders: { orders: 2, grossRevenueMinor: 250000, deliveredOrders: 1, deliveredRevenueMinor: 125000 },
    funnelVisitors: { productViews: 6, addToCarts: 4, checkouts: 3, purchasers: 2 },
    statuses: [],
    recoverableCheckoutContacts: 1,
    sources: [
      { source: "facebook", medium: "paid", visitors: 6, sessions: 7, productViews: 5, addToCarts: 4, checkouts: 2, orders: 2, revenueMinor: 250000 },
      { source: "direct", medium: null, visitors: 4, sessions: 4, productViews: 3, addToCarts: 1, checkouts: 1, orders: 0, revenueMinor: 0 },
    ],
  }, resolveMarketingWindow("30d", new Date("2026-09-07T12:00:00Z")));
  assert.equal(result.conversionRate, 20);
  assert.deepEqual(result.funnel.map((stage) => stage.value), [10, 6, 4, 3, 2]);
  assert.ok(result.funnel.every((stage, index) => index === 0 || stage.value <= result.funnel[index - 1].value));
  assert.equal(result.channels.find((row) => row.channel === "Meta")?.orders, 2);
  assert.equal(result.recoverableCheckoutContacts, 1);
});
