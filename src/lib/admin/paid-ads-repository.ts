import type {
  PaidAdAccountCreateInput,
  PaidAdCampaignMappingCreateInput,
  PaidAdDailyMetricUpsertInput,
  PaidAdProvider,
} from "../marketing/paid-ads";

export interface AdminPaidAdAccount {
  id: string;
  provider: PaidAdProvider;
  externalAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPaidAdCampaignOption {
  id: string;
  name: string;
  campaignKey: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
}

export interface AdminPaidAdMapping {
  id: string;
  accountId: string;
  provider: PaidAdProvider;
  accountName: string;
  accountCurrency: string;
  marketingCampaignId: string | null;
  marketingCampaignName: string | null;
  campaignKey: string | null;
  externalCampaignId: string;
  externalCampaignName: string;
  isActive: boolean;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPaidAdMetric {
  id: string;
  mappingId: string;
  metricDate: string;
  provider: PaidAdProvider;
  accountName: string;
  currency: string;
  externalCampaignId: string;
  externalCampaignName: string;
  marketingCampaignName: string | null;
  campaignKey: string | null;
  spendMinor: number;
  impressions: number;
  clicks: number;
  ingestionSource: "MANUAL" | "API";
  revision: number;
  updatedAt: Date;
}

export interface AdminPaidAdsWorkspace {
  storeCurrency: string;
  accounts: AdminPaidAdAccount[];
  campaigns: AdminPaidAdCampaignOption[];
  mappings: AdminPaidAdMapping[];
  metrics: AdminPaidAdMetric[];
}

export type CreatePaidAdAccountResult =
  | { kind: "CREATED"; account: AdminPaidAdAccount }
  | { kind: "DUPLICATE_ACCOUNT" };

export type CreatePaidAdMappingResult =
  | { kind: "CREATED"; mapping: AdminPaidAdMapping }
  | { kind: "DUPLICATE_EXTERNAL_CAMPAIGN" }
  | { kind: "ACCOUNT_OR_CAMPAIGN_NOT_FOUND" };

export type UpsertPaidAdMetricResult =
  | { kind: "UPSERTED"; metric: AdminPaidAdMetric }
  | { kind: "MAPPING_NOT_FOUND" };

export interface AdminPaidAdsRepository {
  getWorkspace(storeId: string): Promise<AdminPaidAdsWorkspace | null>;
  createAccount(
    input: PaidAdAccountCreateInput & {
      storeId: string;
      createdByAdminUserId: string;
      createdByAdminEmail: string;
    },
  ): Promise<CreatePaidAdAccountResult>;
  createMapping(
    input: PaidAdCampaignMappingCreateInput & {
      storeId: string;
      createdByAdminUserId: string;
      createdByAdminEmail: string;
    },
  ): Promise<CreatePaidAdMappingResult>;
  upsertDailyMetric(
    input: PaidAdDailyMetricUpsertInput & {
      storeId: string;
      updatedByAdminUserId: string;
      updatedByAdminEmail: string;
    },
  ): Promise<UpsertPaidAdMetricResult>;
}
