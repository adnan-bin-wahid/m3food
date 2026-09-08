import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPaidAcquisitionPerformance,
  getAdminPaidAcquisitionPerformance,
} from "./paid-ads-performance-service";
import type {
  PaidAdsPerformanceRaw,
  PaidAdsPerformanceRepository,
} from "./paid-ads-performance-repository";

function baseRaw(): PaidAdsPerformanceRaw {
  return {
    storeCurrency: "BDT",
    delivery: [
      {
        marketingCampaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        mappingId: "22222222-2222-4222-8222-222222222222",
        provider: "META",
        accountName: "Meta Main",
        accountCurrency: "BDT",
        externalCampaignId: "meta-1",
        externalCampaignName: "Meta Launch",
        spendMinor: 10000,
        impressions: 1000,
        clicks: 50,
      },
      {
        marketingCampaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        mappingId: "33333333-3333-4333-8333-333333333333",
        provider: "GOOGLE",
        accountName: "Google Main",
        accountCurrency: "BDT",
        externalCampaignId: "google-1",
        externalCampaignName: "Google Launch",
        spendMinor: 5000,
        impressions: 500,
        clicks: 25,
      },
    ],
    outcomes: [
      {
        campaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        storeCurrency: "BDT",
        visitors: 60,
        sessions: 75,
        firstTouchOrders: 5,
        placedOrders: 3,
        placedRevenueMinor: 45000,
        confirmedReachedOrders: 2,
        confirmedReachedRevenueMinor: 30000,
        deliveredReachedOrders: 1,
        deliveredReachedRevenueMinor: 15000,
      },
    ],
  };
}

test("multiple provider mappings aggregate delivery but never double-count first-party orders", () => {
  const result = buildPaidAcquisitionPerformance(baseRaw());

  assert.equal(result.rows.length, 1);
  const row = result.rows[0]!;
  assert.deepEqual(row.providers, ["GOOGLE", "META"]);
  assert.equal(row.mappingCount, 2);
  assert.equal(row.spendMinor, 15000);
  assert.equal(row.impressions, 1500);
  assert.equal(row.clicks, 75);
  assert.equal(row.placedOrders, 3);
  assert.equal(row.placedRevenueMinor, 45000);
  assert.equal(row.placedRoas, 3);
  assert.equal(row.deliveredRoas, 1);
  assert.equal(row.placedCpaMinor, 5000);
  assert.equal(row.deliveredCpaMinor, 15000);
});

test("mixed spend currencies suppress combined CPA and ROAS instead of inventing FX conversion", () => {
  const raw = baseRaw();
  raw.delivery[1] = {
    ...raw.delivery[1]!,
    accountCurrency: "USD",
    spendMinor: 2500,
  };

  const row = buildPaidAcquisitionPerformance(raw).rows[0]!;
  assert.equal(row.spendMinor, null);
  assert.equal(row.spendCurrency, null);
  assert.equal(row.placedCpaMinor, null);
  assert.equal(row.deliveredCpaMinor, null);
  assert.equal(row.placedRoas, null);
  assert.equal(row.deliveredRoas, null);
  assert.equal(row.revenueComparable, false);
  assert.deepEqual(row.spendByCurrency, [
    { currency: "BDT", spendMinor: 10000 },
    { currency: "USD", spendMinor: 2500 },
  ]);
});

test("single non-store currency keeps CPA but suppresses revenue ROAS", () => {
  const raw = baseRaw();
  raw.delivery = [
    {
      ...raw.delivery[0]!,
      accountCurrency: "USD",
      spendMinor: 900,
    },
  ];

  const row = buildPaidAcquisitionPerformance(raw).rows[0]!;
  assert.equal(row.spendCurrency, "USD");
  assert.equal(row.placedCpaMinor, 300);
  assert.equal(row.placedRoas, null);
  assert.equal(row.revenueComparable, false);
});

test("paid acquisition performance passes the exact marketing range to the repository", async () => {
  let captured:
    | { storeId: string; startAt: Date | null; endAt: Date }
    | undefined;

  const repository: PaidAdsPerformanceRepository = {
    async getPerformance(storeId, startAt, endAt) {
      captured = { storeId, startAt, endAt };
      return baseRaw();
    },
  };

  const now = new Date("2026-09-08T12:00:00.000Z");
  const result = await getAdminPaidAcquisitionPerformance(
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "30d",
    repository,
    now,
  );

  assert.ok(result);
  assert.equal(captured?.storeId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(captured?.endAt.toISOString(), now.toISOString());
  assert.equal(
    captured?.startAt?.toISOString(),
    "2026-08-09T12:00:00.000Z",
  );
});
