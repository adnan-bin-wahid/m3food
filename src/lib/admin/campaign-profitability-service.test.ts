import assert from "node:assert/strict";
import test from "node:test";
import type {
  CampaignProfitabilityRaw,
  CampaignProfitabilityRepository,
} from "./campaign-profitability-repository";
import {
  buildCampaignProfitability,
  getAdminCampaignProfitability,
} from "./campaign-profitability-service";

function baseRaw(): CampaignProfitabilityRaw {
  return {
    storeCurrency: "BDT",
    delivery: [
      {
        marketingCampaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        mappingId: "22222222-2222-4222-8222-222222222222",
        provider: "META",
        accountCurrency: "BDT",
        spendMinor: 10000,
      },
      {
        marketingCampaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        mappingId: "33333333-3333-4333-8333-333333333333",
        provider: "GOOGLE",
        accountCurrency: "BDT",
        spendMinor: 5000,
      },
    ],
    deliveredOrders: [
      {
        campaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        orderId: "44444444-4444-4444-8444-444444444444",
        currency: "BDT",
        revenueMinor: 30000,
        fulfillmentCostMinor: 2500,
        itemCount: 2,
        knownItemCostCount: 2,
        knownCogsMinor: 12000,
      },
      {
        campaignId: "11111111-1111-4111-8111-111111111111",
        campaignName: "Launch",
        campaignKey: "launch",
        orderId: "55555555-5555-4555-8555-555555555555",
        currency: "BDT",
        revenueMinor: 15000,
        fulfillmentCostMinor: 1500,
        itemCount: 1,
        knownItemCostCount: 1,
        knownCogsMinor: 6000,
      },
    ],
  };
}

test("campaign profitability uses delivered first-party commerce and complete cost truth", () => {
  const row = buildCampaignProfitability(baseRaw()).rows[0]!;

  assert.deepEqual(row.providers, ["GOOGLE", "META"]);
  assert.equal(row.mappingCount, 2);
  assert.equal(row.spendMinor, 15000);
  assert.equal(row.deliveredOrders, 2);
  assert.equal(row.deliveredRevenueMinor, 45000);
  assert.equal(row.knownCogsMinor, 18000);
  assert.equal(row.knownFulfillmentCostMinor, 4000);
  assert.equal(row.contributionBeforeAdsMinor, 23000);
  assert.equal(row.netContributionAfterAdsMinor, 8000);
  assert.equal(row.contributionMarginPercent, 17.78);
  assert.equal(row.profitEfficiency, 23000 / 15000);
  assert.equal(row.costCoverageComplete, true);
  assert.equal(row.profitabilityComplete, true);
});

test("unknown delivered item COGS fails closed instead of treating missing cost as zero", () => {
  const raw = baseRaw();
  raw.deliveredOrders[1] = {
    ...raw.deliveredOrders[1]!,
    knownItemCostCount: 0,
    knownCogsMinor: 0,
  };

  const row = buildCampaignProfitability(raw).rows[0]!;
  assert.equal(row.knownItemCostCount, 2);
  assert.equal(row.totalItemCount, 3);
  assert.equal(row.knownCogsMinor, 12000);
  assert.equal(row.completeCogsOrders, 1);
  assert.equal(row.fullyCostedOrders, 1);
  assert.equal(row.costCoverageComplete, false);
  assert.equal(row.contributionBeforeAdsMinor, null);
  assert.equal(row.netContributionAfterAdsMinor, null);
  assert.equal(row.contributionMarginPercent, null);
  assert.equal(row.profitEfficiency, null);
});

test("unknown fulfillment cost fails closed even when item COGS is complete", () => {
  const raw = baseRaw();
  raw.deliveredOrders[0] = {
    ...raw.deliveredOrders[0]!,
    fulfillmentCostMinor: null,
  };

  const row = buildCampaignProfitability(raw).rows[0]!;
  assert.equal(row.completeCogsOrders, 2);
  assert.equal(row.knownFulfillmentCostOrders, 1);
  assert.equal(row.costCoverageComplete, false);
  assert.equal(row.contributionBeforeAdsMinor, null);
  assert.equal(row.netContributionAfterAdsMinor, null);
});

test("mixed spend currencies keep delivered contribution but suppress after-ad profitability", () => {
  const raw = baseRaw();
  raw.delivery[1] = {
    ...raw.delivery[1]!,
    accountCurrency: "USD",
    spendMinor: 2500,
  };

  const row = buildCampaignProfitability(raw).rows[0]!;
  assert.equal(row.spendMinor, null);
  assert.equal(row.spendCurrency, null);
  assert.equal(row.spendComparable, false);
  assert.deepEqual(row.spendByCurrency, [
    { currency: "BDT", spendMinor: 10000 },
    { currency: "USD", spendMinor: 2500 },
  ]);
  assert.equal(row.contributionBeforeAdsMinor, 23000);
  assert.equal(row.netContributionAfterAdsMinor, null);
  assert.equal(row.contributionMarginPercent, null);
  assert.equal(row.profitEfficiency, null);
  assert.equal(row.profitabilityComplete, false);
});

test("single non-store spend currency also suppresses after-ad profitability without inventing FX", () => {
  const raw = baseRaw();
  raw.delivery = [
    {
      ...raw.delivery[0]!,
      accountCurrency: "USD",
      spendMinor: 900,
    },
  ];

  const row = buildCampaignProfitability(raw).rows[0]!;
  assert.equal(row.spendCurrency, "USD");
  assert.equal(row.spendComparable, false);
  assert.equal(row.contributionBeforeAdsMinor, 23000);
  assert.equal(row.netContributionAfterAdsMinor, null);
  assert.equal(row.profitEfficiency, null);
});

test("campaign spend with no delivered orders correctly reports negative net contribution", () => {
  const raw = baseRaw();
  raw.deliveredOrders = [];

  const row = buildCampaignProfitability(raw).rows[0]!;
  assert.equal(row.deliveredOrders, 0);
  assert.equal(row.deliveredRevenueMinor, 0);
  assert.equal(row.costCoverageComplete, true);
  assert.equal(row.contributionBeforeAdsMinor, 0);
  assert.equal(row.netContributionAfterAdsMinor, -15000);
  assert.equal(row.contributionMarginPercent, null);
  assert.equal(row.profitEfficiency, 0);
});

test("campaign profitability passes the exact marketing range to the repository", async () => {
  let captured:
    | { storeId: string; startAt: Date | null; endAt: Date }
    | undefined;

  const repository: CampaignProfitabilityRepository = {
    async getProfitability(storeId, startAt, endAt) {
      captured = { storeId, startAt, endAt };
      return baseRaw();
    },
  };

  const now = new Date("2026-09-08T12:00:00.000Z");
  const result = await getAdminCampaignProfitability(
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
