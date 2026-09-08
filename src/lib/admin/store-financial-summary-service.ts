import type { MarketingRange } from "./marketing-analytics-service";
import { classifyFinancialPaymentRecognition } from "./payment-recognition";
import { resolveMarketingWindow } from "./marketing-analytics-service";
import type {
  StoreFinancialOrderRow,
  StoreFinancialSummaryRaw,
  StoreFinancialSummaryRepository,
} from "./store-financial-summary-repository";

function nonnegativeInteger(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function safeSum(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new Error("Store financial total exceeded safe integer range.");
    }
  }
  return total;
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

function coveragePercent(covered: number, total: number) {
  if (total <= 0) return 100;
  return Math.round((covered / total) * 10_000) / 100;
}

function orderHasCompleteCogs(order: StoreFinancialOrderRow) {
  return (
    nonnegativeInteger(order.itemCount) > 0 &&
    nonnegativeInteger(order.knownItemCostCount) ===
      nonnegativeInteger(order.itemCount)
  );
}

function aggregateSpend(raw: StoreFinancialSummaryRaw) {
  const spendByCurrency = new Map<string, number>();

  for (const row of raw.spend) {
    const currency = row.accountCurrency.trim().toUpperCase();
    if (!currency) continue;
    spendByCurrency.set(
      currency,
      safeSum([
        spendByCurrency.get(currency) ?? 0,
        nonnegativeInteger(row.spendMinor),
      ]),
    );
  }

  const rows = Array.from(spendByCurrency.entries())
    .map(([currency, spendMinor]) => ({ currency, spendMinor }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  if (rows.length === 0) {
    return {
      spendByCurrency: [] as Array<{ currency: string; spendMinor: number }>,
      spendMinor: 0,
      spendCurrency: raw.storeCurrency,
      spendComparable: true,
      hasPaidAccounts: false,
    };
  }

  const single = rows.length === 1 ? rows[0]! : null;
  return {
    spendByCurrency: rows,
    spendMinor: single?.spendMinor ?? null,
    spendCurrency: single?.currency ?? null,
    spendComparable:
      single !== null && single.currency === raw.storeCurrency,
    hasPaidAccounts: true,
  };
}

export function buildStoreFinancialSummary(raw: StoreFinancialSummaryRaw) {
  const delivered = raw.orders.filter((order) => order.status === "DELIVERED");
  const reversed = raw.orders.filter(
    (order) => order.status === "CANCELLED" || order.status === "RETURNED",
  );

  const classified = raw.orders.map((order) => ({
    order,
    recognition: classifyFinancialPaymentRecognition(
      order.status,
      order.paymentStatus,
    ),
  }));

  const paidDelivered = classified
    .filter((row) => row.recognition === "PAID_DELIVERED")
    .map((row) => row.order);
  const refundedDelivered = classified
    .filter((row) => row.recognition === "REFUNDED_DELIVERED")
    .map((row) => row.order);
  const resolvedReversed = classified
    .filter((row) => row.recognition === "REVERSED_RESOLVED")
    .map((row) => row.order);
  const unsettled = classified
    .filter((row) => row.recognition === "UNSETTLED")
    .map((row) => row.order);

  const recognizedDelivered = [...paidDelivered, ...refundedDelivered];
  const financiallyResolved = [...recognizedDelivered, ...resolvedReversed];

  const deliveredRevenueMinor = safeSum(
    paidDelivered.map((order) => nonnegativeInteger(order.revenueMinor)),
  );
  const deliveredKnownCogsMinor = safeSum(
    recognizedDelivered.map((order) => nonnegativeInteger(order.knownCogsMinor)),
  );
  const deliveredKnownFulfillmentCostMinor = safeSum(
    recognizedDelivered
      .filter((order) => order.fulfillmentCostMinor !== null)
      .map((order) => nonnegativeInteger(order.fulfillmentCostMinor)),
  );
  const reversedKnownFulfillmentLossMinor = safeSum(
    resolvedReversed
      .filter((order) => order.fulfillmentCostMinor !== null)
      .map((order) => nonnegativeInteger(order.fulfillmentCostMinor)),
  );

  const totalDeliveredItemCount = safeSum(
    recognizedDelivered.map((order) => nonnegativeInteger(order.itemCount)),
  );
  const knownDeliveredItemCostCount = safeSum(
    recognizedDelivered.map((order) =>
      nonnegativeInteger(order.knownItemCostCount),
    ),
  );

  const completeCogsDeliveredOrders = recognizedDelivered.filter(
    orderHasCompleteCogs,
  ).length;
  const knownFulfillmentDeliveredOrders = recognizedDelivered.filter(
    (order) => order.fulfillmentCostMinor !== null,
  ).length;
  const fullyCostedDeliveredOrders = recognizedDelivered.filter(
    (order) =>
      orderHasCompleteCogs(order) && order.fulfillmentCostMinor !== null,
  ).length;
  const knownFulfillmentReversedOrders = resolvedReversed.filter(
    (order) => order.fulfillmentCostMinor !== null,
  ).length;

  const deliveredCostCoverageComplete =
    fullyCostedDeliveredOrders === recognizedDelivered.length;
  const reversedCostCoverageComplete =
    knownFulfillmentReversedOrders === resolvedReversed.length;
  const commerceCostCoverageComplete =
    deliveredCostCoverageComplete && reversedCostCoverageComplete;

  const financialOrderCount = raw.orders.length;
  const settlementResolvedOrderCount = financiallyResolved.length;
  const recognitionOrderCount = financiallyResolved.length;
  const recognizedCostOrderCount =
    fullyCostedDeliveredOrders + knownFulfillmentReversedOrders;

  const settlementCoverageComplete = unsettled.length === 0;

  const realizedCommerceContributionMinor =
    settlementCoverageComplete && commerceCostCoverageComplete
      ? deliveredRevenueMinor -
        deliveredKnownCogsMinor -
        deliveredKnownFulfillmentCostMinor -
        reversedKnownFulfillmentLossMinor
      : null;

  const spend = aggregateSpend(raw);
  const netContributionAfterAdsMinor =
    realizedCommerceContributionMinor !== null && spend.spendComparable
      ? realizedCommerceContributionMinor - (spend.spendMinor ?? 0)
      : null;

  return {
    storeCurrency: raw.storeCurrency,
    financialOrderCount,
    deliveredOrders: delivered.length,
    settledDeliveredOrders: paidDelivered.length,
    refundedDeliveredOrders: refundedDelivered.length,
    reversedOrders: reversed.length,
    cancelledOrders: reversed.filter((order) => order.status === "CANCELLED")
      .length,
    returnedOrders: reversed.filter((order) => order.status === "RETURNED")
      .length,
    unsettledOrders: unsettled.length,
    unsettledDeliveredOrders: unsettled.filter(
      (order) => order.status === "DELIVERED",
    ).length,
    unsettledReversedOrders: unsettled.filter(
      (order) => order.status === "CANCELLED" || order.status === "RETURNED",
    ).length,
    settlementResolvedOrderCount,
    settlementCoveragePercent: coveragePercent(
      settlementResolvedOrderCount,
      financialOrderCount,
    ),
    settlementCoverageComplete,
    deliveredRevenueMinor,
    deliveredKnownCogsMinor,
    deliveredKnownFulfillmentCostMinor,
    reversedKnownFulfillmentLossMinor,
    totalDeliveredItemCount,
    knownDeliveredItemCostCount,
    completeCogsDeliveredOrders,
    knownFulfillmentDeliveredOrders,
    fullyCostedDeliveredOrders,
    knownFulfillmentReversedOrders,
    deliveredCostCoverageComplete,
    reversedCostCoverageComplete,
    commerceCostCoverageComplete,
    recognitionOrderCount,
    recognizedCostOrderCount,
    costCoveragePercent: coveragePercent(
      recognizedCostOrderCount,
      recognitionOrderCount,
    ),
    realizedCommerceContributionMinor,
    spendByCurrency: spend.spendByCurrency,
    spendMinor: spend.spendMinor,
    spendCurrency: spend.spendCurrency,
    spendComparable: spend.spendComparable,
    hasPaidAccounts: spend.hasPaidAccounts,
    netContributionAfterAdsMinor,
    contributionMarginPercent:
      netContributionAfterAdsMinor === null
        ? null
        : percent(netContributionAfterAdsMinor, deliveredRevenueMinor),
    profitabilityComplete:
      settlementCoverageComplete &&
      commerceCostCoverageComplete &&
      spend.spendComparable,
  };
}

export async function getAdminStoreFinancialSummary(
  storeId: string,
  range: MarketingRange,
  repository: StoreFinancialSummaryRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const raw = await repository.getSummary(
    storeId,
    window.startAt,
    window.endAt,
  );
  if (!raw) return null;

  return {
    ...buildStoreFinancialSummary(raw),
    window,
  };
}
