import assert from "node:assert/strict";
import test from "node:test";
import type { StoreFinancialSummaryRaw } from "./store-financial-summary-repository";
import type { ChannelFinancialSummaryRaw } from "./channel-financial-summary-repository";
import {
  buildStoreFinancialSummary,
} from "./store-financial-summary-service";
import {
  buildChannelFinancialSummary,
} from "./channel-financial-summary-service";
import {
  buildFinancialIntelligence,
  FinancialIntelligenceError,
  getAdminFinancialIntelligence,
} from "./financial-intelligence-service";

function raws() {
  const store: StoreFinancialSummaryRaw = {
    storeCurrency: "BDT",
    spend: [
      {
        accountId: "11111111-1111-4111-8111-111111111111",
        provider: "META",
        accountCurrency: "BDT",
        spendMinor: 6000,
      },
      {
        accountId: "22222222-2222-4222-8222-222222222222",
        provider: "GOOGLE",
        accountCurrency: "BDT",
        spendMinor: 4000,
      },
    ],
    orders: [
      {
        orderId: "33333333-3333-4333-8333-333333333333",
        status: "DELIVERED",
        paymentStatus: "PAID",
        currency: "BDT",
        revenueMinor: 30000,
        fulfillmentCostMinor: 2000,
        itemCount: 1,
        knownItemCostCount: 1,
        knownCogsMinor: 12000,
      },
      {
        orderId: "44444444-4444-4444-8444-444444444444",
        status: "DELIVERED",
        paymentStatus: "PAID",
        currency: "BDT",
        revenueMinor: 25000,
        fulfillmentCostMinor: 1500,
        itemCount: 1,
        knownItemCostCount: 1,
        knownCogsMinor: 10000,
      },
      {
        orderId: "55555555-5555-4555-8555-555555555555",
        status: "RETURNED",
        paymentStatus: "REFUNDED",
        currency: "BDT",
        revenueMinor: 15000,
        fulfillmentCostMinor: 1000,
        itemCount: 1,
        knownItemCostCount: 0,
        knownCogsMinor: 0,
      },
    ],
  };

  const channels: ChannelFinancialSummaryRaw = {
    storeCurrency: "BDT",
    spend: [
      {
        provider: "META",
        accountCurrency: "BDT",
        spendMinor: 6000,
      },
      {
        provider: "GOOGLE",
        accountCurrency: "BDT",
        spendMinor: 4000,
      },
    ],
    orders: [
      {
        ...store.orders[0]!,
        source: "facebook",
        medium: "paid_social",
        fbclid: "fb-1",
        gclid: null,
        mappedProviders: ["META"],
      },
      {
        ...store.orders[1]!,
        source: "google",
        medium: "cpc",
        fbclid: null,
        gclid: "g-1",
        mappedProviders: ["GOOGLE"],
      },
      {
        ...store.orders[2]!,
        source: "facebook",
        medium: "paid_social",
        fbclid: "fb-2",
        gclid: null,
        mappedProviders: ["META"],
      },
    ],
  };

  return { store, channels };
}

test("financial intelligence reconciles store totals with channel totals", () => {
  const raw = raws();
  const intelligence = buildFinancialIntelligence(
    buildStoreFinancialSummary(raw.store),
    buildChannelFinancialSummary(raw.channels),
  );

  assert.equal(intelligence.financialIntegrityComplete, true);
  assert.equal(intelligence.decisionReady, true);
  assert.deepEqual(intelligence.warnings, []);
  assert.equal(
    intelligence.store.realizedCommerceContributionMinor,
    28500,
  );
  assert.equal(
    intelligence.store.netContributionAfterAdsMinor,
    18500,
  );
});

test("financial intelligence fails closed when channel revenue no longer reconciles", () => {
  const raw = raws();
  raw.channels.orders[1] = {
    ...raw.channels.orders[1]!,
    revenueMinor: 24000,
  };

  assert.throws(
    () =>
      buildFinancialIntelligence(
        buildStoreFinancialSummary(raw.store),
        buildChannelFinancialSummary(raw.channels),
      ),
    FinancialIntelligenceError,
  );
});

test("financial intelligence fails closed when provider spend totals do not reconcile", () => {
  const raw = raws();
  raw.channels.spend[0] = {
    ...raw.channels.spend[0]!,
    spendMinor: 5000,
  };

  assert.throws(
    () =>
      buildFinancialIntelligence(
        buildStoreFinancialSummary(raw.store),
        buildChannelFinancialSummary(raw.channels),
      ),
    /paid-spend currency totals do not match/,
  );
});

test("decision readiness exposes cost and currency warnings without inventing profitability", () => {
  const raw = raws();

  raw.store.orders[0] = {
    ...raw.store.orders[0]!,
    knownItemCostCount: 0,
    knownCogsMinor: 0,
  };
  raw.channels.orders[0] = {
    ...raw.channels.orders[0]!,
    knownItemCostCount: 0,
    knownCogsMinor: 0,
  };

  raw.store.spend[1] = {
    ...raw.store.spend[1]!,
    accountCurrency: "USD",
    spendMinor: 300,
  };
  raw.channels.spend[1] = {
    ...raw.channels.spend[1]!,
    accountCurrency: "USD",
    spendMinor: 300,
  };

  const intelligence = buildFinancialIntelligence(
    buildStoreFinancialSummary(raw.store),
    buildChannelFinancialSummary(raw.channels),
  );

  assert.equal(intelligence.decisionReady, false);
  assert.equal(
    intelligence.store.realizedCommerceContributionMinor,
    null,
  );
  assert.equal(
    intelligence.store.netContributionAfterAdsMinor,
    null,
  );
  assert.deepEqual(
    intelligence.warnings.map((warning) => warning.code),
    ["COST_COVERAGE_INCOMPLETE", "SPEND_NOT_COMPARABLE"],
  );
});

test("admin financial intelligence passes one exact time window to both repositories", async () => {
  const raw = raws();

  const storeCalls: Array<{
    storeId: string;
    startAt: Date | null;
    endAt: Date;
  }> = [];
  const channelCalls: Array<{
    storeId: string;
    startAt: Date | null;
    endAt: Date;
  }> = [];

  const now = new Date("2026-09-08T12:00:00.000Z");

  const result = await getAdminFinancialIntelligence(
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "30d",
    {
      async getSummary(storeId, startAt, endAt) {
        storeCalls.push({ storeId, startAt, endAt });
        return raw.store;
      },
    },
    {
      async getSummary(storeId, startAt, endAt) {
        channelCalls.push({ storeId, startAt, endAt });
        return raw.channels;
      },
    },
    now,
  );

  assert.ok(result);
  assert.equal(storeCalls.length, 1);
  assert.equal(channelCalls.length, 1);
  assert.equal(
    storeCalls[0]?.startAt?.toISOString(),
    "2026-08-09T12:00:00.000Z",
  );
  assert.equal(
    channelCalls[0]?.startAt?.toISOString(),
    storeCalls[0]?.startAt?.toISOString(),
  );
  assert.equal(
    channelCalls[0]?.endAt.toISOString(),
    storeCalls[0]?.endAt.toISOString(),
  );
  assert.equal(result.window.endAt.toISOString(), now.toISOString());
});
