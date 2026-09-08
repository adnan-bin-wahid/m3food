import type { PaidAdProvider } from "../marketing/paid-ads";

export interface PaidAdsSyncAccount {
  id: string;
  provider: PaidAdProvider;
  externalAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  isActive: boolean;
}

export interface PaidAdsSyncMapping {
  id: string;
  marketingCampaignId: string | null;
  externalCampaignId: string;
  externalCampaignName: string;
  isActive: boolean;
}

export interface PaidAdsSyncContext {
  account: PaidAdsSyncAccount;
  mappings: PaidAdsSyncMapping[];
}

export interface AdminPaidAdsSyncRepository {
  getSyncContext(
    storeId: string,
    accountId: string,
  ): Promise<PaidAdsSyncContext | null>;

  upsertApiDailyMetric(input: {
    storeId: string;
    mappingId: string;
    metricDate: string;
    spendMinor: number;
    impressions: number;
    clicks: number;
    updatedByAdminUserId: string;
    updatedByAdminEmail: string;
  }): Promise<void>;
}
