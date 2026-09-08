import type { MarketingRange } from "./marketing-analytics-service";
import { resolveMarketingWindow } from "./marketing-analytics-service";
import type {
  CampaignDeliveredOrderRow,
  CampaignProfitabilityRaw,
  CampaignProfitabilityRepository,
} from "./campaign-profitability-repository";

function nonnegativeInteger(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function safeSum(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new Error("Campaign profitability total exceeded safe integer range.");
    }
  }
  return total;
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function orderHasCompleteCogs(order: CampaignDeliveredOrderRow) {
  return (
    nonnegativeInteger(order.itemCount) > 0 &&
    nonnegativeInteger(order.knownItemCostCount) ===
      nonnegativeInteger(order.itemCount)
  );
}

export function buildCampaignProfitability(raw: CampaignProfitabilityRaw) {
  const ordersByCampaign = new Map<string, CampaignDeliveredOrderRow[]>();

  for (const order of raw.deliveredOrders) {
    const current = ordersByCampaign.get(order.campaignId) ?? [];
    current.push(order);
    ordersByCampaign.set(order.campaignId, current);
  }

  const grouped = new Map<
    string,
    {
      campaignId: string;
      campaignName: string;
      campaignKey: string;
      providers: Set<string>;
      mappingIds: Set<string>;
      spendByCurrency: Map<string, number>;
    }
  >();

  for (const row of raw.delivery) {
    const current = grouped.get(row.marketingCampaignId) ?? {
      campaignId: row.marketingCampaignId,
      campaignName: row.campaignName,
      campaignKey: row.campaignKey,
      providers: new Set<string>(),
      mappingIds: new Set<string>(),
      spendByCurrency: new Map<string, number>(),
    };

    current.providers.add(row.provider);
    current.mappingIds.add(row.mappingId);
    current.spendByCurrency.set(
      row.accountCurrency,
      (current.spendByCurrency.get(row.accountCurrency) ?? 0) +
        nonnegativeInteger(row.spendMinor),
    );
    grouped.set(row.marketingCampaignId, current);
  }

  const rows = Array.from(grouped.values()).map((group) => {
    const deliveredOrders = ordersByCampaign.get(group.campaignId) ?? [];
    const spendByCurrency = Array.from(group.spendByCurrency.entries())
      .map(([currency, spendMinor]) => ({ currency, spendMinor }))
      .sort((a, b) => a.currency.localeCompare(b.currency));

    const singleSpend =
      spendByCurrency.length === 1 ? spendByCurrency[0] : null;
    const spendMinor = singleSpend?.spendMinor ?? null;
    const spendCurrency = singleSpend?.currency ?? null;
    const spendComparable =
      singleSpend !== null && singleSpend.currency === raw.storeCurrency;

    const deliveredRevenueMinor = safeSum(
      deliveredOrders.map((order) => nonnegativeInteger(order.revenueMinor)),
    );
    const totalItemCount = safeSum(
      deliveredOrders.map((order) => nonnegativeInteger(order.itemCount)),
    );
    const knownItemCostCount = safeSum(
      deliveredOrders.map((order) =>
        nonnegativeInteger(order.knownItemCostCount),
      ),
    );
    const knownCogsMinor = safeSum(
      deliveredOrders.map((order) => nonnegativeInteger(order.knownCogsMinor)),
    );
    const knownFulfillmentCostOrders = deliveredOrders.filter(
      (order) => order.fulfillmentCostMinor !== null,
    ).length;
    const knownFulfillmentCostMinor = safeSum(
      deliveredOrders
        .filter((order) => order.fulfillmentCostMinor !== null)
        .map((order) => nonnegativeInteger(order.fulfillmentCostMinor)),
    );
    const completeCogsOrders = deliveredOrders.filter(
      orderHasCompleteCogs,
    ).length;
    const fullyCostedOrders = deliveredOrders.filter(
      (order) =>
        orderHasCompleteCogs(order) && order.fulfillmentCostMinor !== null,
    ).length;
    const costCoverageComplete =
      fullyCostedOrders === deliveredOrders.length;

    const contributionBeforeAdsMinor = costCoverageComplete
      ? deliveredRevenueMinor - knownCogsMinor - knownFulfillmentCostMinor
      : null;
    const netContributionAfterAdsMinor =
      contributionBeforeAdsMinor !== null && spendComparable
        ? contributionBeforeAdsMinor - spendMinor!
        : null;
    const contributionMarginPercent =
      netContributionAfterAdsMinor === null
        ? null
        : percent(netContributionAfterAdsMinor, deliveredRevenueMinor);
    const profitEfficiency =
      contributionBeforeAdsMinor !== null && spendComparable
        ? ratio(contributionBeforeAdsMinor, spendMinor!)
        : null;

    return {
      campaignId: group.campaignId,
      campaignName: group.campaignName,
      campaignKey: group.campaignKey,
      providers: Array.from(group.providers).sort(),
      mappingCount: group.mappingIds.size,
      spendByCurrency,
      spendMinor,
      spendCurrency,
      spendComparable,
      storeCurrency: raw.storeCurrency,
      deliveredOrders: deliveredOrders.length,
      deliveredRevenueMinor,
      knownCogsMinor,
      knownFulfillmentCostMinor,
      totalItemCount,
      knownItemCostCount,
      completeCogsOrders,
      knownFulfillmentCostOrders,
      fullyCostedOrders,
      costCoverageComplete,
      contributionBeforeAdsMinor,
      netContributionAfterAdsMinor,
      contributionMarginPercent,
      profitEfficiency,
      profitabilityComplete:
        costCoverageComplete && spendComparable,
    };
  });

  rows.sort((a, b) => {
    const aNet = a.netContributionAfterAdsMinor;
    const bNet = b.netContributionAfterAdsMinor;
    if (aNet !== null && bNet !== null && aNet !== bNet) {
      return bNet - aNet;
    }
    if (aNet !== null && bNet === null) return -1;
    if (aNet === null && bNet !== null) return 1;

    const aSpend = a.spendMinor ?? 0;
    const bSpend = b.spendMinor ?? 0;
    return (
      bSpend - aSpend ||
      b.deliveredRevenueMinor - a.deliveredRevenueMinor ||
      a.campaignName.localeCompare(b.campaignName)
    );
  });

  return {
    storeCurrency: raw.storeCurrency,
    rows,
  };
}

export async function getAdminCampaignProfitability(
  storeId: string,
  range: MarketingRange,
  repository: CampaignProfitabilityRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const raw = await repository.getProfitability(
    storeId,
    window.startAt,
    window.endAt,
  );
  if (!raw) return null;

  return {
    ...buildCampaignProfitability(raw),
    window,
  };
}
