import type { MarketingRange } from "./marketing-analytics-service";
import { resolveMarketingWindow } from "./marketing-analytics-service";
import type {
  PaidAdsPerformanceRaw,
  PaidAdsPerformanceRepository,
  PaidDeliveryMappingRow,
  PaidFirstPartyOutcomeRow,
} from "./paid-ads-performance-repository";

function nonnegative(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function percent(numerator: number, denominator: number) {
  const value = ratio(numerator, denominator);
  return value === null ? 0 : value * 100;
}

function normalizeOutcome(
  outcome: PaidFirstPartyOutcomeRow | undefined,
  campaign: Pick<PaidDeliveryMappingRow, "marketingCampaignId" | "campaignName" | "campaignKey">,
  storeCurrency: string,
): PaidFirstPartyOutcomeRow {
  return outcome ?? {
    campaignId: campaign.marketingCampaignId,
    campaignName: campaign.campaignName,
    campaignKey: campaign.campaignKey,
    storeCurrency,
    visitors: 0,
    sessions: 0,
    firstTouchOrders: 0,
    placedOrders: 0,
    placedRevenueMinor: 0,
    confirmedReachedOrders: 0,
    confirmedReachedRevenueMinor: 0,
    deliveredReachedOrders: 0,
    deliveredReachedRevenueMinor: 0,
  };
}

export function buildPaidAcquisitionPerformance(raw: PaidAdsPerformanceRaw) {
  const outcomes = new Map(
    raw.outcomes.map((row) => [row.campaignId, row] as const),
  );
  const grouped = new Map<
    string,
    {
      campaign: Pick<
        PaidDeliveryMappingRow,
        "marketingCampaignId" | "campaignName" | "campaignKey"
      >;
      providers: Set<string>;
      mappingIds: Set<string>;
      spendByCurrency: Map<string, number>;
      impressions: number;
      clicks: number;
    }
  >();

  for (const row of raw.delivery) {
    const current = grouped.get(row.marketingCampaignId) ?? {
      campaign: {
        marketingCampaignId: row.marketingCampaignId,
        campaignName: row.campaignName,
        campaignKey: row.campaignKey,
      },
      providers: new Set<string>(),
      mappingIds: new Set<string>(),
      spendByCurrency: new Map<string, number>(),
      impressions: 0,
      clicks: 0,
    };

    current.providers.add(row.provider);
    current.mappingIds.add(row.mappingId);
    current.spendByCurrency.set(
      row.accountCurrency,
      (current.spendByCurrency.get(row.accountCurrency) ?? 0) +
        nonnegative(row.spendMinor),
    );
    current.impressions += nonnegative(row.impressions);
    current.clicks += nonnegative(row.clicks);
    grouped.set(row.marketingCampaignId, current);
  }

  const rows = Array.from(grouped.values()).map((group) => {
    const outcome = normalizeOutcome(
      outcomes.get(group.campaign.marketingCampaignId),
      group.campaign,
      raw.storeCurrency,
    );

    const spendByCurrency = Array.from(group.spendByCurrency.entries())
      .map(([currency, spendMinor]) => ({ currency, spendMinor }))
      .sort((a, b) => a.currency.localeCompare(b.currency));

    const singleSpend =
      spendByCurrency.length === 1 ? spendByCurrency[0] : null;
    const spendMinor = singleSpend?.spendMinor ?? null;
    const spendCurrency = singleSpend?.currency ?? null;
    const revenueComparable =
      singleSpend !== null &&
      singleSpend.currency === outcome.storeCurrency;

    const placedCpaMinor =
      spendMinor !== null && outcome.placedOrders > 0
        ? spendMinor / outcome.placedOrders
        : null;
    const deliveredCpaMinor =
      spendMinor !== null && outcome.deliveredReachedOrders > 0
        ? spendMinor / outcome.deliveredReachedOrders
        : null;

    return {
      campaignId: group.campaign.marketingCampaignId,
      campaignName: group.campaign.campaignName,
      campaignKey: group.campaign.campaignKey,
      providers: Array.from(group.providers).sort(),
      mappingCount: group.mappingIds.size,
      spendByCurrency,
      spendMinor,
      spendCurrency,
      impressions: group.impressions,
      clicks: group.clicks,
      ctrPercent: percent(group.clicks, group.impressions),
      cpcMinor:
        spendMinor !== null && group.clicks > 0
          ? spendMinor / group.clicks
          : null,
      visitors: nonnegative(outcome.visitors),
      sessions: nonnegative(outcome.sessions),
      firstTouchOrders: nonnegative(outcome.firstTouchOrders),
      placedOrders: nonnegative(outcome.placedOrders),
      placedRevenueMinor: nonnegative(outcome.placedRevenueMinor),
      confirmedReachedOrders: nonnegative(outcome.confirmedReachedOrders),
      confirmedReachedRevenueMinor: nonnegative(
        outcome.confirmedReachedRevenueMinor,
      ),
      deliveredReachedOrders: nonnegative(outcome.deliveredReachedOrders),
      deliveredReachedRevenueMinor: nonnegative(
        outcome.deliveredReachedRevenueMinor,
      ),
      sessionToOrderRate: percent(outcome.placedOrders, outcome.sessions),
      placedCpaMinor,
      deliveredCpaMinor,
      placedRoas:
        revenueComparable && spendMinor! > 0
          ? outcome.placedRevenueMinor / spendMinor!
          : null,
      deliveredRoas:
        revenueComparable && spendMinor! > 0
          ? outcome.deliveredReachedRevenueMinor / spendMinor!
          : null,
      storeCurrency: outcome.storeCurrency,
      revenueComparable,
    };
  });

  rows.sort((a, b) => {
    const aSpend = a.spendMinor ?? 0;
    const bSpend = b.spendMinor ?? 0;
    return (
      bSpend - aSpend ||
      b.placedOrders - a.placedOrders ||
      b.clicks - a.clicks ||
      a.campaignName.localeCompare(b.campaignName)
    );
  });

  return {
    storeCurrency: raw.storeCurrency,
    rows,
  };
}

export async function getAdminPaidAcquisitionPerformance(
  storeId: string,
  range: MarketingRange,
  repository: PaidAdsPerformanceRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const raw = await repository.getPerformance(
    storeId,
    window.startAt,
    window.endAt,
  );
  if (!raw) return null;

  return {
    ...buildPaidAcquisitionPerformance(raw),
    window,
  };
}
