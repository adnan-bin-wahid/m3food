import assert from "node:assert/strict";
import test from "node:test";
import type { AdminDashboardRepository } from "./dashboard-repository";
import {
  classifyDashboardSource,
  getAdminDashboard,
  parseDashboardRange,
  resolveDashboardWindow,
} from "./dashboard-service";

const now = new Date("2026-09-04T12:00:00.000Z");

test("dashboard ranges are bounded and invalid input falls back to 30 days", () => {
  assert.equal(parseDashboardRange("7d"), "7d");
  assert.equal(parseDashboardRange(["90d", "all"]), "90d");
  assert.equal(parseDashboardRange("yesterday"), "30d");
  assert.equal(
    resolveDashboardWindow("7d", now).startAt?.toISOString(),
    "2026-08-28T12:00:00.000Z",
  );
  assert.equal(resolveDashboardWindow("all", now).startAt, null);
});

test("source classification separates Meta, organic, and other traffic", () => {
  assert.equal(classifyDashboardSource("facebook"), "Meta");
  assert.equal(classifyDashboardSource("Instagram Ads"), "Meta");
  assert.equal(classifyDashboardSource("direct"), "Organic");
  assert.equal(classifyDashboardSource("organic"), "Organic");
  assert.equal(classifyDashboardSource("google", "organic"), "Organic");
  assert.equal(classifyDashboardSource("newsletter", null, true), "Meta");
  assert.equal(classifyDashboardSource("google"), "Other");
});

test("live rows become exact store-scoped metrics and channel totals", async () => {
  let requestedStoreId = "";
  const repository: AdminDashboardRepository = {
    async getSnapshot(storeId, startAt, endAt) {
      requestedStoreId = storeId;
      assert.equal(startAt?.toISOString(), "2026-08-05T12:00:00.000Z");
      assert.equal(endAt.toISOString(), now.toISOString());
      return {
        store: { name: "M3Food", currency: "BDT", timezone: "Asia/Dhaka" },
        events: {
          visitors: 40,
          pageViews: 62,
          productViews: 30,
          addToCarts: 12,
          checkouts: 8,
        },
        statuses: [
          { status: "PENDING", orderCount: 3, totalMinor: 375000 },
          { status: "DELIVERED", orderCount: 2, totalMinor: 250000 },
          { status: "CANCELLED", orderCount: 1, totalMinor: 125000 },
        ],
        sources: [
          { source: "Facebook", medium: "paid", hasMetaClick: true, orderCount: 2, totalMinor: 250000 },
          { source: "facebook", medium: null, hasMetaClick: false, orderCount: 1, totalMinor: 125000 },
          { source: "direct", medium: null, hasMetaClick: false, orderCount: 2, totalMinor: 250000 },
          { source: "referral", medium: null, hasMetaClick: false, orderCount: 1, totalMinor: 125000 },
        ],
        recentOrders: [
          {
            publicId: "ORD-1",
            customerName: "Test Customer",
            status: "PENDING",
            totalMinor: 125000,
            currency: "BDT",
            source: "Facebook",
            createdAt: new Date("2026-09-04T10:00:00.000Z"),
          },
        ],
      };
    },
  };

  const dashboard = await getAdminDashboard(
    "store-1",
    "30d",
    repository,
    now,
  );
  assert.equal(requestedStoreId, "store-1");
  assert.equal(dashboard.metrics.orders, 6);
  assert.equal(dashboard.metrics.grossOrderValueMinor, 625000);
  assert.equal(dashboard.metrics.conversionRate, 15);
  assert.equal(dashboard.sources[0]?.source, "facebook");
  assert.equal(dashboard.sources[0]?.orderCount, 3);
  assert.deepEqual(
    dashboard.channels.map(({ channel, orderCount }) => ({ channel, orderCount })),
    [
      { channel: "Meta", orderCount: 3 },
      { channel: "Organic", orderCount: 2 },
      { channel: "Other", orderCount: 1 },
    ],
  );
  assert.equal(dashboard.recentOrders[0]?.createdAt.toISOString(), "2026-09-04T10:00:00.000Z");
});

test("zero visitors produces a finite zero conversion rate", async () => {
  const repository: AdminDashboardRepository = {
    async getSnapshot() {
      return {
        store: { name: "Empty", currency: "BDT", timezone: "Asia/Dhaka" },
        events: { visitors: 0, pageViews: 0, productViews: 0, addToCarts: 0, checkouts: 0 },
        statuses: [],
        sources: [],
        recentOrders: [],
      };
    },
  };
  const dashboard = await getAdminDashboard("store-1", "all", repository, now);
  assert.equal(dashboard.metrics.conversionRate, 0);
  assert.ok(Number.isFinite(dashboard.metrics.conversionRate));
});
