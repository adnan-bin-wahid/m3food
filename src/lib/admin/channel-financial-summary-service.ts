import type { PaidAdProvider } from "../marketing/paid-ads";
import type { MarketingRange } from "./marketing-analytics-service";
import { resolveMarketingWindow } from "./marketing-analytics-service";
import type {
  ChannelFinancialOrderRow,
  ChannelFinancialSummaryRaw,
  ChannelFinancialSummaryRepository,
} from "./channel-financial-summary-repository";

export const FINANCIAL_ACQUISITION_CHANNELS = [
  "META",
  "GOOGLE",
  "ORGANIC",
  "OTHER",
] as const;

export type FinancialAcquisitionChannel =
  (typeof FINANCIAL_ACQUISITION_CHANNELS)[number];

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paid_search",
  "paid-search",
  "paid_social",
  "paid-social",
  "display",
]);

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function nonnegativeInteger(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function safeSum(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new Error("Channel financial total exceeded safe integer range.");
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

function orderHasCompleteCogs(order: ChannelFinancialOrderRow) {
  return (
    nonnegativeInteger(order.itemCount) > 0 &&
    nonnegativeInteger(order.knownItemCostCount) ===
      nonnegativeInteger(order.itemCount)
  );
}

function uniqueProviders(providers: PaidAdProvider[]) {
  return Array.from(new Set(providers)).sort();
}

export function classifyFinancialAcquisitionChannel(
  order: Pick<
    ChannelFinancialOrderRow,
    "source" | "medium" | "fbclid" | "gclid" | "mappedProviders"
  >,
): FinancialAcquisitionChannel {
  const source = normalize(order.source);
  const medium = normalize(order.medium);
  const providers = uniqueProviders(order.mappedProviders);

  if (normalize(order.gclid)) return "GOOGLE";
  if (normalize(order.fbclid)) return "META";

  if (
    source === "facebook" ||
    source === "instagram" ||
    source === "meta" ||
    source === "fb" ||
    source.includes("facebook") ||
    source.includes("instagram")
  ) {
    return "META";
  }

  if (
    source === "direct" ||
    source === "organic" ||
    medium === "organic" ||
    medium === "seo"
  ) {
    return "ORGANIC";
  }

  if (
    source === "google" &&
    (PAID_MEDIUMS.has(medium) || providers.includes("GOOGLE"))
  ) {
    return "GOOGLE";
  }

  if (providers.length === 1) {
    return providers[0] === "META" ? "META" : "GOOGLE";
  }

  return "OTHER";
}

function aggregateProviderSpend(
  raw: ChannelFinancialSummaryRaw,
  provider: PaidAdProvider,
) {
  const grouped = new Map<string, number>();

  for (const row of raw.spend.filter((item) => item.provider === provider)) {
    const currency = row.accountCurrency.trim().toUpperCase();
    if (!currency) continue;
    grouped.set(
      currency,
      safeSum([
        grouped.get(currency) ?? 0,
        nonnegativeInteger(row.spendMinor),
      ]),
    );
  }

  const spendByCurrency = Array.from(grouped.entries())
    .map(([currency, spendMinor]) => ({ currency, spendMinor }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  if (spendByCurrency.length === 0) {
    return {
      spendByCurrency,
      spendMinor: 0,
      spendCurrency: raw.storeCurrency,
      spendComparable: true,
    };
  }

  const single =
    spendByCurrency.length === 1 ? spendByCurrency[0]! : null;

  return {
    spendByCurrency,
    spendMinor: single?.spendMinor ?? null,
    spendCurrency: single?.currency ?? null,
    spendComparable:
      single !== null && single.currency === raw.storeCurrency,
  };
}

function zeroSpend(storeCurrency: string) {
  return {
    spendByCurrency: [] as Array<{ currency: string; spendMinor: number }>,
    spendMinor: 0,
    spendCurrency: storeCurrency,
    spendComparable: true,
  };
}

function buildChannelRow(
  raw: ChannelFinancialSummaryRaw,
  channel: FinancialAcquisitionChannel,
  orders: ChannelFinancialOrderRow[],
) {
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const reversed = orders.filter(
    (order) => order.status === "CANCELLED" || order.status === "RETURNED",
  );

  const deliveredRevenueMinor = safeSum(
    delivered.map((order) => nonnegativeInteger(order.revenueMinor)),
  );
  const knownCogsMinor = safeSum(
    delivered.map((order) => nonnegativeInteger(order.knownCogsMinor)),
  );
  const knownDeliveredFulfillmentCostMinor = safeSum(
    delivered
      .filter((order) => order.fulfillmentCostMinor !== null)
      .map((order) => nonnegativeInteger(order.fulfillmentCostMinor)),
  );
  const knownReversedFulfillmentLossMinor = safeSum(
    reversed
      .filter((order) => order.fulfillmentCostMinor !== null)
      .map((order) => nonnegativeInteger(order.fulfillmentCostMinor)),
  );

  const fullyCostedDeliveredOrders = delivered.filter(
    (order) =>
      orderHasCompleteCogs(order) && order.fulfillmentCostMinor !== null,
  ).length;

  const knownFulfillmentReversedOrders = reversed.filter(
    (order) => order.fulfillmentCostMinor !== null,
  ).length;

  const recognizedOrders = delivered.length + reversed.length;
  const recognizedCostOrders =
    fullyCostedDeliveredOrders + knownFulfillmentReversedOrders;
  const costCoverageComplete = recognizedCostOrders === recognizedOrders;

  const realizedCommerceContributionMinor = costCoverageComplete
    ? deliveredRevenueMinor -
      knownCogsMinor -
      knownDeliveredFulfillmentCostMinor -
      knownReversedFulfillmentLossMinor
    : null;

  const spend =
    channel === "META"
      ? aggregateProviderSpend(raw, "META")
      : channel === "GOOGLE"
        ? aggregateProviderSpend(raw, "GOOGLE")
        : zeroSpend(raw.storeCurrency);

  const netContributionAfterAdsMinor =
    realizedCommerceContributionMinor !== null && spend.spendComparable
      ? realizedCommerceContributionMinor - (spend.spendMinor ?? 0)
      : null;

  return {
    channel,
    deliveredOrders: delivered.length,
    reversedOrders: reversed.length,
    recognizedOrders,
    deliveredRevenueMinor,
    knownCogsMinor,
    knownDeliveredFulfillmentCostMinor,
    knownReversedFulfillmentLossMinor,
    fullyCostedDeliveredOrders,
    knownFulfillmentReversedOrders,
    recognizedCostOrders,
    costCoveragePercent: coveragePercent(
      recognizedCostOrders,
      recognizedOrders,
    ),
    costCoverageComplete,
    realizedCommerceContributionMinor,
    spendByCurrency: spend.spendByCurrency,
    spendMinor: spend.spendMinor,
    spendCurrency: spend.spendCurrency,
    spendComparable: spend.spendComparable,
    netContributionAfterAdsMinor,
    contributionMarginPercent:
      netContributionAfterAdsMinor === null
        ? null
        : percent(netContributionAfterAdsMinor, deliveredRevenueMinor),
    profitabilityComplete:
      costCoverageComplete && spend.spendComparable,
  };
}

export function buildChannelFinancialSummary(raw: ChannelFinancialSummaryRaw) {
  const grouped = new Map<
    FinancialAcquisitionChannel,
    ChannelFinancialOrderRow[]
  >();

  for (const channel of FINANCIAL_ACQUISITION_CHANNELS) {
    grouped.set(channel, []);
  }

  for (const order of raw.orders) {
    const channel = classifyFinancialAcquisitionChannel(order);
    grouped.get(channel)!.push(order);
  }

  const rows = FINANCIAL_ACQUISITION_CHANNELS.map((channel) =>
    buildChannelRow(raw, channel, grouped.get(channel) ?? []),
  );

  const recognizedOrders = safeSum(
    rows.map((row) => row.recognizedOrders),
  );

  return {
    storeCurrency: raw.storeCurrency,
    sourceOrderCount: raw.orders.length,
    recognizedOrders,
    orderReconciliationComplete:
      recognizedOrders === raw.orders.length,
    rows,
  };
}

export async function getAdminChannelFinancialSummary(
  storeId: string,
  range: MarketingRange,
  repository: ChannelFinancialSummaryRepository,
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
    ...buildChannelFinancialSummary(raw),
    window,
  };
}
