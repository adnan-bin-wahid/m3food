import assert from "node:assert/strict";
import test from "node:test";
import type {
  StoreFinancialSummaryRaw,
  StoreFinancialSummaryRepository,
} from "./store-financial-summary-repository";
import {
  buildStoreFinancialSummary,
  getAdminStoreFinancialSummary,
} from "./store-financial-summary-service";

function baseRaw(): StoreFinancialSummaryRaw {
  return {
    storeCurrency: "BDT",
    spend: [
      {
        accountId: "11111111-1111-4111-8111-111111111111",
        provider: "META",
        accountCurrency: "BDT",
        spendMinor: 10000,
      },
      {
        accountId: "22222222-2222-4222-8222-222222222222",
        provider: "GOOGLE",
        accountCurrency: "BDT",
        spendMinor: 5000,
      },
    ],
    orders: [
      {
        orderId: "33333333-3333-4333-8333-333333333333",
        status: "DELIVERED",
        paymentStatus: "PAID",
        currency: "BDT",
        revenueMinor: 50000,
        fulfillmentCostMinor: 4000,
        itemCount: 2,
        knownItemCostCount: 2,
        knownCogsMinor: 20000,
      },
      {
        orderId: "44444444-4444-4444-8444-444444444444",
        status: "DELIVERED",
        paymentStatus: "PAID",
        currency: "BDT",
        revenueMinor: 25000,
        fulfillmentCostMinor: 2000,
        itemCount: 1,
        knownItemCostCount: 1,
        knownCogsMinor: 10000,
      },
      {
        orderId: "55555555-5555-4555-8555-555555555555",
        status: "RETURNED",
        paymentStatus: "REFUNDED",
        currency: "BDT",
        revenueMinor: 30000,
        fulfillmentCostMinor: 3000,
        itemCount: 1,
        knownItemCostCount: 0,
        knownCogsMinor: 0,
      },
      {
        orderId: "66666666-6666-4666-8666-666666666666",
        status: "CANCELLED",
        paymentStatus: "UNPAID",
        currency: "BDT",
        revenueMinor: 20000,
        fulfillmentCostMinor: 1000,
        itemCount: 1,
        knownItemCostCount: 0,
        knownCogsMinor: 0,
      },
    ],
  };
}

test("store summary recognizes delivered contribution, reversed operational loss, and comparable ad spend", () => {
  const summary = buildStoreFinancialSummary(baseRaw());

  assert.equal(summary.deliveredOrders, 2);
  assert.equal(summary.reversedOrders, 2);
  assert.equal(summary.deliveredRevenueMinor, 75000);
  assert.equal(summary.deliveredKnownCogsMinor, 30000);
  assert.equal(summary.deliveredKnownFulfillmentCostMinor, 6000);
  assert.equal(summary.reversedKnownFulfillmentLossMinor, 4000);
  assert.equal(summary.realizedCommerceContributionMinor, 35000);
  assert.equal(summary.spendMinor, 15000);
  assert.equal(summary.netContributionAfterAdsMinor, 20000);
  assert.equal(summary.contributionMarginPercent, 26.67);
  assert.equal(summary.costCoveragePercent, 100);
  assert.equal(summary.commerceCostCoverageComplete, true);
  assert.equal(summary.spendComparable, true);
  assert.equal(summary.profitabilityComplete, true);
});

test("unknown delivered item COGS fails closed instead of becoming zero", () => {
  const raw = baseRaw();
  raw.orders[1] = {
    ...raw.orders[1]!,
    knownItemCostCount: 0,
    knownCogsMinor: 0,
  };

  const summary = buildStoreFinancialSummary(raw);
  assert.equal(summary.completeCogsDeliveredOrders, 1);
  assert.equal(summary.fullyCostedDeliveredOrders, 1);
  assert.equal(summary.commerceCostCoverageComplete, false);
  assert.equal(summary.costCoveragePercent, 75);
  assert.equal(summary.realizedCommerceContributionMinor, null);
  assert.equal(summary.netContributionAfterAdsMinor, null);
  assert.equal(summary.contributionMarginPercent, null);
});

test("unknown delivered fulfillment cost fails closed", () => {
  const raw = baseRaw();
  raw.orders[0] = {
    ...raw.orders[0]!,
    fulfillmentCostMinor: null,
  };

  const summary = buildStoreFinancialSummary(raw);
  assert.equal(summary.knownFulfillmentDeliveredOrders, 1);
  assert.equal(summary.fullyCostedDeliveredOrders, 1);
  assert.equal(summary.commerceCostCoverageComplete, false);
  assert.equal(summary.realizedCommerceContributionMinor, null);
});

test("unknown cancelled or returned fulfillment loss also fails closed", () => {
  const raw = baseRaw();
  raw.orders[2] = {
    ...raw.orders[2]!,
    fulfillmentCostMinor: null,
  };

  const summary = buildStoreFinancialSummary(raw);
  assert.equal(summary.knownFulfillmentReversedOrders, 1);
  assert.equal(summary.reversedCostCoverageComplete, false);
  assert.equal(summary.commerceCostCoverageComplete, false);
  assert.equal(summary.realizedCommerceContributionMinor, null);
  assert.equal(summary.netContributionAfterAdsMinor, null);
});

test("mixed ad spend currencies preserve commerce contribution but suppress after-ad profitability", () => {
  const raw = baseRaw();
  raw.spend[1] = {
    ...raw.spend[1]!,
    accountCurrency: "USD",
    spendMinor: 1200,
  };

  const summary = buildStoreFinancialSummary(raw);
  assert.deepEqual(summary.spendByCurrency, [
    { currency: "BDT", spendMinor: 10000 },
    { currency: "USD", spendMinor: 1200 },
  ]);
  assert.equal(summary.spendMinor, null);
  assert.equal(summary.spendCurrency, null);
  assert.equal(summary.spendComparable, false);
  assert.equal(summary.realizedCommerceContributionMinor, 35000);
  assert.equal(summary.netContributionAfterAdsMinor, null);
  assert.equal(summary.profitabilityComplete, false);
});

test("single non-store ad currency suppresses after-ad profitability without inventing FX", () => {
  const raw = baseRaw();
  raw.spend = [
    {
      ...raw.spend[0]!,
      accountCurrency: "USD",
      spendMinor: 900,
    },
  ];

  const summary = buildStoreFinancialSummary(raw);
  assert.equal(summary.spendMinor, 900);
  assert.equal(summary.spendCurrency, "USD");
  assert.equal(summary.spendComparable, false);
  assert.equal(summary.realizedCommerceContributionMinor, 35000);
  assert.equal(summary.netContributionAfterAdsMinor, null);
});

test("store with no paid accounts treats ad spend as comparable zero", () => {
  const raw = baseRaw();
  raw.spend = [];

  const summary = buildStoreFinancialSummary(raw);
  assert.deepEqual(summary.spendByCurrency, []);
  assert.equal(summary.hasPaidAccounts, false);
  assert.equal(summary.spendMinor, 0);
  assert.equal(summary.spendCurrency, "BDT");
  assert.equal(summary.spendComparable, true);
  assert.equal(summary.realizedCommerceContributionMinor, 35000);
  assert.equal(summary.netContributionAfterAdsMinor, 35000);
  assert.equal(summary.profitabilityComplete, true);
});

test("paid spend with no recognized commerce correctly reports a negative net contribution", () => {
  const raw = baseRaw();
  raw.orders = [];

  const summary = buildStoreFinancialSummary(raw);
  assert.equal(summary.deliveredRevenueMinor, 0);
  assert.equal(summary.costCoveragePercent, 100);
  assert.equal(summary.realizedCommerceContributionMinor, 0);
  assert.equal(summary.netContributionAfterAdsMinor, -15000);
  assert.equal(summary.contributionMarginPercent, null);
  assert.equal(summary.profitabilityComplete, true);
});

test("store financial summary passes the exact marketing range to the repository", async () => {
  let captured:
    | { storeId: string; startAt: Date | null; endAt: Date }
    | undefined;

  const repository: StoreFinancialSummaryRepository = {
    async getSummary(storeId, startAt, endAt) {
      captured = { storeId, startAt, endAt };
      return baseRaw();
    },
  };

  const now = new Date("2026-09-08T12:00:00.000Z");
  const result = await getAdminStoreFinancialSummary(
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
