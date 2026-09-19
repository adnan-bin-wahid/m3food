import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketingOverview, parseMarketingRange, resolveMarketingWindow } from "./marketing-analytics-service";

test("marketing ranges are bounded and deterministic", () => {
  assert.equal(parseMarketingRange("7d"), "7d");
  assert.equal(parseMarketingRange("365d"), "30d");
  assert.equal(parseMarketingRange("today"), "today");
  assert.equal(parseMarketingRange("yesterday"), "yesterday");
  assert.equal(parseMarketingRange(undefined, "2026-09-15", "2026-09-15"), "custom");
  const window = resolveMarketingWindow("7d", new Date("2026-09-07T12:00:00Z"));
  assert.equal(window.startAt?.toISOString(), "2026-08-31T18:00:00.000Z");
  assert.equal(window.endAt?.toISOString(), "2026-09-07T18:00:00.000Z");

  const customWindow = resolveMarketingWindow("custom", new Date(), "2026-09-15", "2026-09-15");
  assert.equal(customWindow.label, "2026-09-15");
  assert.equal(customWindow.startAt?.toISOString(), "2026-09-14T18:00:00.000Z");
  assert.equal(customWindow.endAt?.toISOString(), "2026-09-15T18:00:00.000Z");
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

test("marketing overview handles single-page landing direct checkout without separate cart stage", () => {
  const result = buildMarketingOverview({
    store: { name: "Niyamah Attires", slug: "niyamah-attires", currency: "BDT", timezone: "Asia/Dhaka" },
    events: { visitors: 8, pageViews: 9, productViews: 8, addToCarts: 0, checkouts: 1, purchases: 1 },
    orders: { orders: 1, grossRevenueMinor: 137500, deliveredOrders: 0, deliveredRevenueMinor: 0 },
    funnelVisitors: { productViews: 7, addToCarts: 0, checkouts: 1, purchasers: 1 },
    statuses: [],
    recoverableCheckoutContacts: 0,
    sources: [
      { source: "direct", medium: null, visitors: 8, sessions: 8, productViews: 8, addToCarts: 0, checkouts: 1, orders: 1, revenueMinor: 137500 },
    ],
  }, resolveMarketingWindow("30d", new Date("2026-09-13T12:00:00Z")));
  assert.equal(result.conversionRate, 12.5);
  assert.deepEqual(result.funnel.map((stage) => stage.value), [8, 7, 1, 1, 1]);
  assert.ok(result.funnel.every((stage, index) => index === 0 || stage.value <= result.funnel[index - 1].value));
});
