import assert from "node:assert/strict";
import test from "node:test";
import type { AdminOrderProfitabilitySnapshot } from "./order-profitability-repository";
import type { StoreFinancialSummaryRaw } from "./store-financial-summary-repository";
import type { ChannelFinancialSummaryRaw } from "./channel-financial-summary-repository";
import type { CampaignProfitabilityRaw } from "./campaign-profitability-repository";
import { summarizeOrderProfitability } from "./order-profitability-service";
import { buildStoreFinancialSummary } from "./store-financial-summary-service";
import { buildChannelFinancialSummary } from "./channel-financial-summary-service";
import { buildCampaignProfitability } from "./campaign-profitability-service";
import { buildFinancialIntelligence } from "./financial-intelligence-service";

function orderSnapshot(
  paymentStatus: AdminOrderProfitabilitySnapshot["paymentStatus"],
): AdminOrderProfitabilitySnapshot {
  return {
    orderId: "11111111-1111-4111-8111-111111111111",
    publicId: "ORD-S02-TEST",
    status: "DELIVERED",
    paymentStatus,
    currency: "BDT",
    revenueMinor: 30000,
    fulfillmentCostMinor: 2000,
    fulfillmentCostRevision: 0,
    items: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        productName: "Product",
        sku: "SKU",
        quantity: 1,
        totalCostMinor: 12000,
      },
    ],
  };
}

function storeRaw(
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED",
): StoreFinancialSummaryRaw {
  return {
    storeCurrency: "BDT",
    spend: [],
    orders: [
      {
        orderId: "11111111-1111-4111-8111-111111111111",
        status: "DELIVERED",
        paymentStatus,
        currency: "BDT",
        revenueMinor: 30000,
        fulfillmentCostMinor: 2000,
        itemCount: 1,
        knownItemCostCount: 1,
        knownCogsMinor: 12000,
      },
    ],
  };
}

function channelRaw(): ChannelFinancialSummaryRaw {
  return {
    storeCurrency: "BDT",
    spend: [],
    orders: [
      {
        ...storeRaw("UNPAID").orders[0]!,
        source: "facebook",
        medium: "paid_social",
        fbclid: "fb",
        gclid: null,
        mappedProviders: ["META"],
      },
      {
        ...storeRaw("PAID").orders[0]!,
        orderId: "33333333-3333-4333-8333-333333333333",
        source: "google",
        medium: "cpc",
        fbclid: null,
        gclid: "g",
        mappedProviders: ["GOOGLE"],
      },
    ],
  };
}

function campaignRaw(
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED",
): CampaignProfitabilityRaw {
  return {
    storeCurrency: "BDT",
    delivery: [
      {
        marketingCampaignId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        campaignName: "Paid",
        campaignKey: "paid",
        mappingId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        provider: "META",
        accountCurrency: "BDT",
        spendMinor: 5000,
      },
    ],
    deliveredOrders: [
      {
        campaignId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        campaignName: "Paid",
        campaignKey: "paid",
        orderId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        paymentStatus,
        currency: "BDT",
        revenueMinor: 30000,
        fulfillmentCostMinor: 2000,
        itemCount: 1,
        knownItemCostCount: 1,
        knownCogsMinor: 12000,
      },
    ],
  };
}

test("delivered but unpaid order fails closed", () => {
  const summary = summarizeOrderProfitability(orderSnapshot("UNPAID"));

  assert.equal(summary.recognition, "PROVISIONAL");
  assert.equal(summary.recognizedRevenueMinor, null);
  assert.equal(summary.recognizedContributionMinor, null);
  assert.equal(summary.settlementComplete, false);
});

test("delivered refund recognizes COGS and fulfillment as loss", () => {
  const summary = summarizeOrderProfitability(orderSnapshot("REFUNDED"));

  assert.equal(summary.recognition, "REVERSED");
  assert.equal(summary.recognizedRevenueMinor, 0);
  assert.equal(summary.recognizedContributionMinor, -14000);
  assert.equal(summary.recognizedMarginPercent, null);
  assert.equal(summary.settlementComplete, true);
});

test("cancelled paid order stays unresolved until refund reconciliation", () => {
  const summary = summarizeOrderProfitability({
    ...orderSnapshot("PAID"),
    status: "CANCELLED",
  });

  assert.equal(summary.recognition, "PROVISIONAL");
  assert.equal(summary.recognizedContributionMinor, null);
  assert.equal(summary.settlementComplete, false);
});

test("store settlement coverage fails closed", () => {
  const summary = buildStoreFinancialSummary(storeRaw("PENDING"));

  assert.equal(summary.unsettledOrders, 1);
  assert.equal(summary.settlementCoveragePercent, 0);
  assert.equal(summary.settlementCoverageComplete, false);
  assert.equal(summary.realizedCommerceContributionMinor, null);
  assert.equal(summary.profitabilityComplete, false);
});

test("store paid delivery realizes first-party revenue", () => {
  const summary = buildStoreFinancialSummary(storeRaw("PAID"));

  assert.equal(summary.settledDeliveredOrders, 1);
  assert.equal(summary.deliveredRevenueMinor, 30000);
  assert.equal(summary.realizedCommerceContributionMinor, 16000);
  assert.equal(summary.profitabilityComplete, true);
});

test("store refunded delivery keeps cost loss with zero revenue", () => {
  const summary = buildStoreFinancialSummary(storeRaw("REFUNDED"));

  assert.equal(summary.refundedDeliveredOrders, 1);
  assert.equal(summary.deliveredRevenueMinor, 0);
  assert.equal(summary.deliveredKnownCogsMinor, 12000);
  assert.equal(summary.deliveredKnownFulfillmentCostMinor, 2000);
  assert.equal(summary.realizedCommerceContributionMinor, -14000);
});

test("only the affected channel is blocked by unsettled payment", () => {
  const summary = buildChannelFinancialSummary(channelRaw());
  const meta = summary.rows.find((row) => row.channel === "META")!;
  const google = summary.rows.find((row) => row.channel === "GOOGLE")!;

  assert.equal(meta.settlementCoverageComplete, false);
  assert.equal(meta.realizedCommerceContributionMinor, null);
  assert.equal(google.settlementCoverageComplete, true);
  assert.equal(google.realizedCommerceContributionMinor, 16000);
});

test("campaign unsettled delivery suppresses profitability", () => {
  const row = buildCampaignProfitability(campaignRaw("FAILED")).rows[0]!;

  assert.equal(row.unsettledDeliveredOrders, 1);
  assert.equal(row.settlementCoverageComplete, false);
  assert.equal(row.contributionBeforeAdsMinor, null);
  assert.equal(row.netContributionAfterAdsMinor, null);
});

test("campaign refund keeps cost loss with zero revenue", () => {
  const row = buildCampaignProfitability(campaignRaw("REFUNDED")).rows[0]!;

  assert.equal(row.refundedDeliveredOrders, 1);
  assert.equal(row.deliveredRevenueMinor, 0);
  assert.equal(row.contributionBeforeAdsMinor, -14000);
  assert.equal(row.netContributionAfterAdsMinor, -19000);
});

test("financial intelligence exposes payment settlement warning", () => {
  const store = storeRaw("UNPAID");
  const channels: ChannelFinancialSummaryRaw = {
    storeCurrency: "BDT",
    spend: [],
    orders: [
      {
        ...store.orders[0]!,
        source: "direct",
        medium: null,
        fbclid: null,
        gclid: null,
        mappedProviders: [],
      },
    ],
  };

  const intelligence = buildFinancialIntelligence(
    buildStoreFinancialSummary(store),
    buildChannelFinancialSummary(channels),
  );

  assert.equal(intelligence.decisionReady, false);
  assert.deepEqual(
    intelligence.warnings.map((warning) => warning.code),
    ["PAYMENT_SETTLEMENT_INCOMPLETE"],
  );
});
