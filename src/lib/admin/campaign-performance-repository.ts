import type { CampaignStatus } from "../marketing/campaigns";

export interface CampaignPerformanceRow {
  campaignId: string;
  name: string;
  campaignKey: string;
  status: CampaignStatus;
  currency: string;
  visitors: number;
  sessions: number;
  firstTouchOrders: number;
  lastTouchOrders: number;
  placedRevenueMinor: number;
}

export interface CampaignPerformanceRepository {
  getCampaignPerformance(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<CampaignPerformanceRow[]>;
}
