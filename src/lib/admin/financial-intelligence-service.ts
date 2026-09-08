import type { MarketingRange } from "./marketing-analytics-service";
import type { StoreFinancialSummaryRepository } from "./store-financial-summary-repository";
import type { ChannelFinancialSummaryRepository } from "./channel-financial-summary-repository";
import {
  buildStoreFinancialSummary,
  getAdminStoreFinancialSummary,
} from "./store-financial-summary-service";
import {
  buildChannelFinancialSummary,
  getAdminChannelFinancialSummary,
} from "./channel-financial-summary-service";

type StoreFinancialSummary = ReturnType<typeof buildStoreFinancialSummary>;
type ChannelFinancialSummary = ReturnType<typeof buildChannelFinancialSummary>;

export class FinancialIntelligenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialIntelligenceError";
  }
}

function safeSum(values: number[]) {
  let total = 0;

  for (const value of values) {
    total += value;

    if (!Number.isSafeInteger(total)) {
      throw new FinancialIntelligenceError(
        "Financial reconciliation exceeded safe integer range.",
      );
    }
  }

  return total;
}

function currencyTotals(
  rows: Array<{ currency: string; spendMinor: number }>,
) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const currency = row.currency.trim().toUpperCase();
    if (!currency) continue;

    totals.set(
      currency,
      safeSum([totals.get(currency) ?? 0, row.spendMinor]),
    );
  }

  return Array.from(totals.entries())
    .map(([currency, spendMinor]) => ({ currency, spendMinor }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

function assertEqual(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new FinancialIntelligenceError(
      `${label} reconciliation failed: ${actual} != ${expected}.`,
    );
  }
}

function assertNullableEqual(
  label: string,
  actual: number | null,
  expected: number | null,
) {
  if (actual !== expected) {
    throw new FinancialIntelligenceError(
      `${label} reconciliation failed.`,
    );
  }
}

function sameCurrencyTotals(
  left: Array<{ currency: string; spendMinor: number }>,
  right: Array<{ currency: string; spendMinor: number }>,
) {
  const normalizedLeft = currencyTotals(left);
  const normalizedRight = currencyTotals(right);

  if (normalizedLeft.length !== normalizedRight.length) return false;

  return normalizedLeft.every(
    (row, index) =>
      row.currency === normalizedRight[index]?.currency &&
      row.spendMinor === normalizedRight[index]?.spendMinor,
  );
}

export function buildFinancialIntelligence(
  store: StoreFinancialSummary,
  channels: ChannelFinancialSummary,
) {
  if (store.storeCurrency !== channels.storeCurrency) {
    throw new FinancialIntelligenceError(
      "Store and channel financial currencies do not match.",
    );
  }

  if (!channels.orderReconciliationComplete) {
    throw new FinancialIntelligenceError(
      "Channel order reconciliation is incomplete.",
    );
  }

  const channelDeliveredOrders = safeSum(
    channels.rows.map((row) => row.deliveredOrders),
  );
  const channelSettledDeliveredOrders = safeSum(
    channels.rows.map((row) => row.settledDeliveredOrders),
  );
  const channelRefundedDeliveredOrders = safeSum(
    channels.rows.map((row) => row.refundedDeliveredOrders),
  );
  const channelReversedOrders = safeSum(
    channels.rows.map((row) => row.reversedOrders),
  );
  const channelUnsettledOrders = safeSum(
    channels.rows.map((row) => row.unsettledOrders),
  );
  const channelSettlementResolvedOrders = safeSum(
    channels.rows.map((row) => row.settlementResolvedOrders),
  );
  const channelRevenueMinor = safeSum(
    channels.rows.map((row) => row.deliveredRevenueMinor),
  );
  const channelKnownCogsMinor = safeSum(
    channels.rows.map((row) => row.knownCogsMinor),
  );
  const channelKnownDeliveredFulfillmentMinor = safeSum(
    channels.rows.map((row) => row.knownDeliveredFulfillmentCostMinor),
  );
  const channelKnownReversedLossMinor = safeSum(
    channels.rows.map((row) => row.knownReversedFulfillmentLossMinor),
  );
  const channelRecognizedCostOrders = safeSum(
    channels.rows.map((row) => row.recognizedCostOrders),
  );

  assertEqual(
    "Financial orders",
    channels.recognizedOrders,
    store.financialOrderCount,
  );
  assertEqual(
    "Delivered orders",
    channelDeliveredOrders,
    store.deliveredOrders,
  );
  assertEqual(
    "Settled delivered orders",
    channelSettledDeliveredOrders,
    store.settledDeliveredOrders,
  );
  assertEqual(
    "Refunded delivered orders",
    channelRefundedDeliveredOrders,
    store.refundedDeliveredOrders,
  );
  assertEqual(
    "Reversed orders",
    channelReversedOrders,
    store.reversedOrders,
  );
  assertEqual(
    "Unsettled orders",
    channelUnsettledOrders,
    store.unsettledOrders,
  );
  assertEqual(
    "Settlement resolved orders",
    channelSettlementResolvedOrders,
    store.settlementResolvedOrderCount,
  );
  assertEqual(
    "Settled delivered revenue",
    channelRevenueMinor,
    store.deliveredRevenueMinor,
  );
  assertEqual(
    "Known COGS",
    channelKnownCogsMinor,
    store.deliveredKnownCogsMinor,
  );
  assertEqual(
    "Known delivered fulfillment cost",
    channelKnownDeliveredFulfillmentMinor,
    store.deliveredKnownFulfillmentCostMinor,
  );
  assertEqual(
    "Known reversed fulfillment loss",
    channelKnownReversedLossMinor,
    store.reversedKnownFulfillmentLossMinor,
  );
  assertEqual(
    "Recognized cost orders",
    channelRecognizedCostOrders,
    store.recognizedCostOrderCount,
  );

  const channelSettlementCoverageComplete = channels.rows.every(
    (row) => row.settlementCoverageComplete,
  );

  if (
    channelSettlementCoverageComplete !==
    store.settlementCoverageComplete
  ) {
    throw new FinancialIntelligenceError(
      "Store and channel settlement coverage completeness do not match.",
    );
  }

  const channelCostCoverageComplete = channels.rows.every(
    (row) => row.costCoverageComplete,
  );

  if (
    channelCostCoverageComplete !== store.commerceCostCoverageComplete
  ) {
    throw new FinancialIntelligenceError(
      "Store and channel cost coverage completeness do not match.",
    );
  }

  const paidSpendByCurrency = channels.rows.flatMap((row) =>
    row.channel === "META" || row.channel === "GOOGLE"
      ? row.spendByCurrency
      : [],
  );

  if (!sameCurrencyTotals(store.spendByCurrency, paidSpendByCurrency)) {
    throw new FinancialIntelligenceError(
      "Store and channel paid-spend currency totals do not match.",
    );
  }

  const channelSpendComparable = channels.rows.every(
    (row) => row.spendComparable,
  );

  if (channelSpendComparable !== store.spendComparable) {
    throw new FinancialIntelligenceError(
      "Store and channel spend comparability do not match.",
    );
  }

  const channelCommerceContributionMinor =
    channelSettlementCoverageComplete && channelCostCoverageComplete
      ? safeSum(
          channels.rows.map(
            (row) => row.realizedCommerceContributionMinor ?? 0,
          ),
        )
      : null;

  assertNullableEqual(
    "Commerce contribution",
    channelCommerceContributionMinor,
    store.realizedCommerceContributionMinor,
  );

  const channelNetContributionMinor =
    channelSettlementCoverageComplete &&
    channelCostCoverageComplete &&
    channelSpendComparable
      ? safeSum(
          channels.rows.map(
            (row) => row.netContributionAfterAdsMinor ?? 0,
          ),
        )
      : null;

  assertNullableEqual(
    "Net contribution",
    channelNetContributionMinor,
    store.netContributionAfterAdsMinor,
  );

  const warnings: Array<{
    code:
      | "PAYMENT_SETTLEMENT_INCOMPLETE"
      | "COST_COVERAGE_INCOMPLETE"
      | "SPEND_NOT_COMPARABLE";
    message: string;
  }> = [];

  if (!store.settlementCoverageComplete) {
    warnings.push({
      code: "PAYMENT_SETTLEMENT_INCOMPLETE",
      message:
        "Profitability is incomplete because one or more delivered/cancelled/returned orders still have unresolved payment settlement.",
    });
  }

  if (!store.commerceCostCoverageComplete) {
    warnings.push({
      code: "COST_COVERAGE_INCOMPLETE",
      message:
        "Profitability is incomplete because one or more settlement-resolved orders are missing required cost data.",
    });
  }

  if (!store.spendComparable) {
    warnings.push({
      code: "SPEND_NOT_COMPARABLE",
      message:
        "After-ad profitability is suppressed because mapped paid spend is not fully comparable to the store currency.",
    });
  }

  return {
    store,
    channels,
    financialIntegrityComplete: true,
    decisionReady: store.profitabilityComplete,
    warnings,
  };
}

function sameWindow(
  left: {
    range: string;
    startAt: Date | null;
    endAt: Date;
  },
  right: {
    range: string;
    startAt: Date | null;
    endAt: Date;
  },
) {
  return (
    left.range === right.range &&
    left.startAt?.toISOString() === right.startAt?.toISOString() &&
    left.endAt.toISOString() === right.endAt.toISOString()
  );
}

export async function getAdminFinancialIntelligence(
  storeId: string,
  range: MarketingRange,
  storeRepository: StoreFinancialSummaryRepository,
  channelRepository: ChannelFinancialSummaryRepository,
  now = new Date(),
) {
  const store = await getAdminStoreFinancialSummary(
    storeId,
    range,
    storeRepository,
    now,
  );

  const channels = await getAdminChannelFinancialSummary(
    storeId,
    range,
    channelRepository,
    now,
  );

  if (!store || !channels) return null;

  if (!sameWindow(store.window, channels.window)) {
    throw new FinancialIntelligenceError(
      "Store and channel financial windows do not match.",
    );
  }

  return {
    ...buildFinancialIntelligence(store, channels),
    window: store.window,
  };
}
