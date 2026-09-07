import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCampaignConversionRate,
  getAdminCampaignPerformance,
} from "./campaign-performance-service";

test("campaign conversion is finite, bounded and session based", () => {
  assert.equal(calculateCampaignConversionRate(2, 10), 20);
  assert.equal(calculateCampaignConversionRate(0, 0), 0);
  assert.equal(calculateCampaignConversionRate(20, 10), 100);
});

test("campaign performance is range scoped and preserves attribution metrics", async () => {
  const now = new Date("2026-09-08T00:00:00Z");
  const result = await getAdminCampaignPerformance(
    "store-1",
    "30d",
    {
      async getCampaignPerformance(storeId, startAt, endAt) {
        assert.equal(storeId, "store-1");
        assert.equal(startAt?.toISOString(), "2026-08-09T00:00:00.000Z");
        assert.equal(endAt.toISOString(), "2026-09-08T00:00:00.000Z");
        return [
          {
            campaignId: "campaign-1",
            name: "Launch",
            campaignKey: "launch",
            status: "ACTIVE",
            currency: "BDT",
            visitors: 8,
            sessions: 10,
            firstTouchOrders: 3,
            lastTouchOrders: 2,
            placedRevenueMinor: 250000,
          },
        ];
      },
    },
    now,
  );

  assert.equal(result.window.label, "Last 30 days");
  assert.equal(result.rows[0]?.firstTouchOrders, 3);
  assert.equal(result.rows[0]?.lastTouchOrders, 2);
  assert.equal(result.rows[0]?.lastTouchConversionRate, 20);
  assert.equal(result.rows[0]?.placedRevenueMinor, 250000);
});
