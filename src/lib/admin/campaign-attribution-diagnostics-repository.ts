import type { CampaignStatus } from "../marketing/campaigns";
import type { OrderStatus } from "../commerce/order-repository";

export interface UnregisteredCampaignTrafficRow {
  rawCampaign: string;
  source: string | null;
  medium: string | null;
  sessions: number;
  visitors: number;
  lastSeenAt: Date;
}

export interface CampaignDiagnosticOrderRow {
  publicId: string;
  status: OrderStatus;
  totalMinor: number;
  currency: string;
  createdAt: Date;
  source: string;
  medium: string | null;
  campaign: string | null;
  firstTouchCampaignId: string | null;
  lastTouchCampaignId: string | null;
  firstTouch: unknown;
  lastTouch: unknown;
}

export interface CampaignAttributionDetailRow {
  campaign: {
    id: string;
    name: string;
    campaignKey: string;
    source: string;
    medium: string;
    content: string | null;
    term: string | null;
    landingUrl: string | null;
    notes: string | null;
    status: CampaignStatus;
    currency: string;
    timezone: string;
  };
  metrics: {
    sessions: number;
    visitors: number;
    firstTouchOrders: number;
    lastTouchOrders: number;
    lastTouchRevenueMinor: number;
    confirmedReachedOrders: number;
    deliveredReachedOrders: number;
  };
  orders: CampaignDiagnosticOrderRow[];
}

export interface CampaignAttributionDiagnosticsRepository {
  getUnregisteredCampaignTraffic(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
    limit: number,
  ): Promise<UnregisteredCampaignTrafficRow[]>;

  getCampaignAttributionDetail(
    storeId: string,
    campaignId: string,
    startAt: Date | null,
    endAt: Date,
    orderLimit: number,
  ): Promise<CampaignAttributionDetailRow | null>;
}
