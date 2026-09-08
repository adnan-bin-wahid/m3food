import type { PaidAdProvider } from "../marketing/paid-ads";

export interface CampaignProfitabilityDeliveryRow {
  marketingCampaignId: string;
  campaignName: string;
  campaignKey: string;
  mappingId: string;
  provider: PaidAdProvider;
  accountCurrency: string;
  spendMinor: number;
}

export interface CampaignDeliveredOrderRow {
  campaignId: string;
  campaignName: string;
  campaignKey: string;
  orderId: string;
  currency: string;
  revenueMinor: number;
  fulfillmentCostMinor: number | null;
  itemCount: number;
  knownItemCostCount: number;
  knownCogsMinor: number;
}

export interface CampaignProfitabilityRaw {
  storeCurrency: string;
  delivery: CampaignProfitabilityDeliveryRow[];
  deliveredOrders: CampaignDeliveredOrderRow[];
}

export interface CampaignProfitabilityRepository {
  getProfitability(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<CampaignProfitabilityRaw | null>;
}
