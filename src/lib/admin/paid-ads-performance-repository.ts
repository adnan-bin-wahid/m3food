import type { PaidAdProvider } from "../marketing/paid-ads";

export interface PaidDeliveryMappingRow {
  marketingCampaignId: string;
  campaignName: string;
  campaignKey: string;
  mappingId: string;
  provider: PaidAdProvider;
  accountName: string;
  accountCurrency: string;
  externalCampaignId: string;
  externalCampaignName: string;
  spendMinor: number;
  impressions: number;
  clicks: number;
}

export interface PaidFirstPartyOutcomeRow {
  campaignId: string;
  campaignName: string;
  campaignKey: string;
  storeCurrency: string;
  visitors: number;
  sessions: number;
  firstTouchOrders: number;
  placedOrders: number;
  placedRevenueMinor: number;
  confirmedReachedOrders: number;
  confirmedReachedRevenueMinor: number;
  deliveredReachedOrders: number;
  deliveredReachedRevenueMinor: number;
}

export interface PaidAdsPerformanceRaw {
  storeCurrency: string;
  delivery: PaidDeliveryMappingRow[];
  outcomes: PaidFirstPartyOutcomeRow[];
}

export interface PaidAdsPerformanceRepository {
  getPerformance(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<PaidAdsPerformanceRaw | null>;
}
