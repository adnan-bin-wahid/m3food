import assert from "node:assert/strict";
import test from "node:test";
import type {
  ChannelFinancialOrderRow,
  ChannelFinancialSummaryRaw,
  ChannelFinancialSummaryRepository,
} from "./channel-financial-summary-repository";
import {
  buildChannelFinancialSummary,
  classifyFinancialAcquisitionChannel,
  getAdminChannelFinancialSummary,
} from "./channel-financial-summary-service";

function order(
  overrides: Partial<ChannelFinancialOrderRow> = {},
): ChannelFinancialOrderRow {
  return {
    orderId: "11111111-1111-4111-8111-111111111111",
    status: "DELIVERED",
    currency: "BDT",
    revenueMinor: 30000,
    fulfillmentCostMinor: 2000,
    itemCount: 1,
    knownItemCostCount: 1,
    knownCogsMinor: 12000,
    source: "direct",
    medium: null,
    fbclid: null,
    gclid: null,
    mappedProviders: [],
    ...overrides,
  };
}

function baseRaw(): ChannelFinancialSummaryRaw {
  return {
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
      order({
        orderId: "11111111-1111-4111-8111-111111111111",
        source: "facebook",
        fbclid: "fb-1",
        revenueMinor: 30000,
        knownCogsMinor: 12000,
        fulfillmentCostMinor: 2000,
      }),
      order({
        orderId: "22222222-2222-4222-8222-222222222222",
        source: "google",
        medium: "cpc",
        gclid: "g-1",
        revenueMinor: 25000,
        knownCogsMinor: 10000,
        fulfillmentCostMinor: 1500,
      }),
      order({
        orderId: "33333333-3333-4333-8333-333333333333",
        source: "direct",
        revenueMinor: 20000,
        knownCogsMinor: 8000,
        fulfillmentCostMinor: 1000,
      }),
      order({
        orderId: "44444444-4444-4444-8444-444444444444",
        status: "RETURNED",
        source: "facebook",
        fbclid: "fb-2",
        revenueMinor: 15000,
        knownItemCostCount: 0,
        knownCogsMinor: 0,
        fulfillmentCostMinor: 1000,
      }),
      order({
        orderId: "55555555-5555-4555-8555-555555555555",
        source: "newsletter",
        medium: "email",
        revenueMinor: 12000,
        knownCogsMinor: 5000,
        fulfillmentCostMinor: 700,
      }),
    ],
  };
}

test("channel classifier preserves deterministic last-touch acquisition semantics", () => {
  assert.equal(
    classifyFinancialAcquisitionChannel(
      order({ source: "x", gclid: "gclid" }),
    ),
    "GOOGLE",
  );

  assert.equal(
    classifyFinancialAcquisitionChannel(
      order({ source: "x", fbclid: "fbclid" }),
    ),
    "META",
  );

  assert.equal(
    classifyFinancialAcquisitionChannel(
      order({ source: "google", medium: "organic" }),
    ),
    "ORGANIC",
  );

  assert.equal(
    classifyFinancialAcquisitionChannel(
      order({ source: "direct" }),
    ),
    "ORGANIC",
  );

  assert.equal(
    classifyFinancialAcquisitionChannel(
      order({
        source: "unknown",
        mappedProviders: ["GOOGLE"],
      }),
    ),
    "GOOGLE",
  );

  assert.equal(
    classifyFinancialAcquisitionChannel(
      order({
        source: "unknown",
        mappedProviders: ["META", "GOOGLE"],
      }),
    ),
    "OTHER",
  );
});

test("channel summary assigns every recognized order exactly once", () => {
  const summary = buildChannelFinancialSummary(baseRaw());

  assert.equal(summary.sourceOrderCount, 5);
  assert.equal(summary.recognizedOrders, 5);
  assert.equal(summary.orderReconciliationComplete, true);

  assert.deepEqual(
    summary.rows.map((row) => [row.channel, row.recognizedOrders]),
    [
      ["META", 2],
      ["GOOGLE", 1],
      ["ORGANIC", 1],
      ["OTHER", 1],
    ],
  );
});

test("Meta and Google rows deduct only their own comparable provider spend", () => {
  const summary = buildChannelFinancialSummary(baseRaw());
  const meta = summary.rows.find((row) => row.channel === "META")!;
  const google = summary.rows.find((row) => row.channel === "GOOGLE")!;

  assert.equal(meta.deliveredRevenueMinor, 30000);
  assert.equal(meta.knownReversedFulfillmentLossMinor, 1000);
  assert.equal(meta.realizedCommerceContributionMinor, 15000);
  assert.equal(meta.spendMinor, 6000);
  assert.equal(meta.netContributionAfterAdsMinor, 9000);
  assert.equal(meta.contributionMarginPercent, 30);

  assert.equal(google.deliveredRevenueMinor, 25000);
  assert.equal(google.realizedCommerceContributionMinor, 13500);
  assert.equal(google.spendMinor, 4000);
  assert.equal(google.netContributionAfterAdsMinor, 9500);
  assert.equal(google.contributionMarginPercent, 38);
});

test("Organic and Other channels use comparable zero ad spend", () => {
  const summary = buildChannelFinancialSummary(baseRaw());
  const organic = summary.rows.find((row) => row.channel === "ORGANIC")!;
  const other = summary.rows.find((row) => row.channel === "OTHER")!;

  assert.equal(organic.spendMinor, 0);
  assert.equal(organic.spendCurrency, "BDT");
  assert.equal(organic.spendComparable, true);
  assert.equal(organic.realizedCommerceContributionMinor, 11000);
  assert.equal(organic.netContributionAfterAdsMinor, 11000);

  assert.equal(other.spendMinor, 0);
  assert.equal(other.realizedCommerceContributionMinor, 6300);
  assert.equal(other.netContributionAfterAdsMinor, 6300);
});

test("unknown costs fail closed only for the affected acquisition channel", () => {
  const raw = baseRaw();
  raw.orders[0] = {
    ...raw.orders[0]!,
    knownItemCostCount: 0,
    knownCogsMinor: 0,
  };

  const summary = buildChannelFinancialSummary(raw);
  const meta = summary.rows.find((row) => row.channel === "META")!;
  const google = summary.rows.find((row) => row.channel === "GOOGLE")!;

  assert.equal(meta.costCoverageComplete, false);
  assert.equal(meta.realizedCommerceContributionMinor, null);
  assert.equal(meta.netContributionAfterAdsMinor, null);

  assert.equal(google.costCoverageComplete, true);
  assert.equal(google.realizedCommerceContributionMinor, 13500);
  assert.equal(google.netContributionAfterAdsMinor, 9500);
});

test("unknown reversed fulfillment loss fails closed for that channel", () => {
  const raw = baseRaw();
  raw.orders[3] = {
    ...raw.orders[3]!,
    fulfillmentCostMinor: null,
  };

  const meta = buildChannelFinancialSummary(raw).rows.find(
    (row) => row.channel === "META",
  )!;

  assert.equal(meta.knownFulfillmentReversedOrders, 0);
  assert.equal(meta.costCoverageComplete, false);
  assert.equal(meta.realizedCommerceContributionMinor, null);
  assert.equal(meta.netContributionAfterAdsMinor, null);
});

test("mixed Meta spend currencies suppress only Meta after-ad profitability", () => {
  const raw = baseRaw();
  raw.spend.push({
    provider: "META",
    accountCurrency: "USD",
    spendMinor: 500,
  });

  const summary = buildChannelFinancialSummary(raw);
  const meta = summary.rows.find((row) => row.channel === "META")!;
  const google = summary.rows.find((row) => row.channel === "GOOGLE")!;

  assert.deepEqual(meta.spendByCurrency, [
    { currency: "BDT", spendMinor: 6000 },
    { currency: "USD", spendMinor: 500 },
  ]);

  assert.equal(meta.spendComparable, false);
  assert.equal(meta.realizedCommerceContributionMinor, 15000);
  assert.equal(meta.netContributionAfterAdsMinor, null);
  assert.equal(meta.profitabilityComplete, false);

  assert.equal(google.spendComparable, true);
  assert.equal(google.netContributionAfterAdsMinor, 9500);
});

test("single non-store provider currency suppresses only that provider channel", () => {
  const raw = baseRaw();
  raw.spend = [
    {
      provider: "META",
      accountCurrency: "USD",
      spendMinor: 800,
    },
    {
      provider: "GOOGLE",
      accountCurrency: "BDT",
      spendMinor: 4000,
    },
  ];

  const summary = buildChannelFinancialSummary(raw);
  const meta = summary.rows.find((row) => row.channel === "META")!;
  const google = summary.rows.find((row) => row.channel === "GOOGLE")!;

  assert.equal(meta.spendComparable, false);
  assert.equal(meta.netContributionAfterAdsMinor, null);
  assert.equal(google.spendComparable, true);
  assert.equal(google.netContributionAfterAdsMinor, 9500);
});

test("paid provider spend with no channel orders reports a negative net contribution", () => {
  const raw = baseRaw();
  raw.orders = raw.orders.filter(
    (row) =>
      classifyFinancialAcquisitionChannel(row) !== "GOOGLE",
  );

  const google = buildChannelFinancialSummary(raw).rows.find(
    (row) => row.channel === "GOOGLE",
  )!;

  assert.equal(google.recognizedOrders, 0);
  assert.equal(google.costCoverageComplete, true);
  assert.equal(google.realizedCommerceContributionMinor, 0);
  assert.equal(google.spendMinor, 4000);
  assert.equal(google.netContributionAfterAdsMinor, -4000);
  assert.equal(google.contributionMarginPercent, null);
});

test("channel financial summary passes the exact marketing range to the repository", async () => {
  let captured:
    | { storeId: string; startAt: Date | null; endAt: Date }
    | undefined;

  const repository: ChannelFinancialSummaryRepository = {
    async getSummary(storeId, startAt, endAt) {
      captured = { storeId, startAt, endAt };
      return baseRaw();
    },
  };

  const now = new Date("2026-09-08T12:00:00.000Z");
  const result = await getAdminChannelFinancialSummary(
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
