import assert from "node:assert/strict";
import test from "node:test";
import {
  getCampaignAttributionDetailReport,
  getCampaignAttributionDiagnostics,
} from "./campaign-attribution-diagnostics-service";
import type {
  CampaignAttributionDiagnosticsRepository,
} from "./campaign-attribution-diagnostics-repository";

function repository(): CampaignAttributionDiagnosticsRepository {
  return {
    async getUnregisteredCampaignTraffic(storeId, startAt, endAt, limit) {
      assert.equal(storeId, "store-1");
      assert.equal(startAt?.toISOString(), "2026-09-01T00:00:00.000Z");
      assert.equal(endAt.toISOString(), "2026-09-08T00:00:00.000Z");
      assert.equal(limit, 25);
      return [
        {
          rawCampaign: " Eid Sale / Meta ",
          source: "facebook",
          medium: "paid-social",
          sessions: 4,
          visitors: 3,
          lastSeenAt: new Date("2026-09-07T12:00:00Z"),
        },
      ];
    },
    async getCampaignAttributionDetail(
      storeId,
      campaignId,
      startAt,
      endAt,
      orderLimit,
    ) {
      assert.equal(storeId, "store-1");
      assert.equal(campaignId, "campaign-1");
      assert.equal(startAt?.toISOString(), "2026-09-01T00:00:00.000Z");
      assert.equal(endAt.toISOString(), "2026-09-08T00:00:00.000Z");
      assert.equal(orderLimit, 50);
      return {
        campaign: {
          id: "campaign-1",
          name: "Launch",
          campaignKey: "launch",
          source: "facebook",
          medium: "paid-social",
          content: null,
          term: null,
          landingUrl: null,
          notes: null,
          status: "ACTIVE",
          currency: "BDT",
          timezone: "Asia/Dhaka",
        },
        metrics: {
          sessions: 10,
          visitors: 8,
          firstTouchOrders: 3,
          lastTouchOrders: 2,
          lastTouchRevenueMinor: 250000,
          confirmedReachedOrders: 2,
          deliveredReachedOrders: 1,
        },
        orders: [
          {
            publicId: "ORD-1",
            status: "DELIVERED",
            totalMinor: 125000,
            currency: "BDT",
            createdAt: new Date("2026-09-07T13:00:00Z"),
            source: "facebook",
            medium: "paid-social",
            campaign: "launch",
            firstTouchCampaignId: "campaign-1",
            lastTouchCampaignId: "campaign-1",
            firstTouch: { campaign: "launch" },
            lastTouch: { campaign: "launch" },
          },
        ],
      };
    },
  };
}

test("unregistered UTM diagnostics are range scoped and suggest canonical keys only", async () => {
  const result = await getCampaignAttributionDiagnostics(
    "store-1",
    "7d",
    repository(),
    new Date("2026-09-08T00:00:00Z"),
  );

  assert.equal(result.rows[0]?.suggestedCampaignKey, "eid-sale-meta");
  assert.equal(result.rows[0]?.sessions, 4);
});

test("campaign detail exposes lifecycle reach and first/last attribution role", async () => {
  const result = await getCampaignAttributionDetailReport(
    "store-1",
    "campaign-1",
    "7d",
    repository(),
    new Date("2026-09-08T00:00:00Z"),
  );

  assert.ok(result);
  assert.equal(result.metrics.confirmedReachedOrders, 2);
  assert.equal(result.metrics.deliveredReachedOrders, 1);
  assert.equal(result.orders[0]?.role, "FIRST + LAST");
  assert.equal(result.orders[0]?.firstTouchCampaign, "launch");
  assert.equal(result.orders[0]?.lastTouchCampaign, "launch");
});
