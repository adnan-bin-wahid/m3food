import type { CampaignStatus } from "../marketing/campaigns";

export interface AdminCampaign {
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
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminCampaignInput {
  storeId: string;
  name: string;
  campaignKey: string;
  source: string;
  medium: string;
  content: string | null;
  term: string | null;
  landingUrl: string | null;
  notes: string | null;
  status: CampaignStatus;
  createdByAdminUserId: string;
  createdByAdminEmail: string;
}

export type CreateAdminCampaignResult =
  | { kind: "CREATED"; campaign: AdminCampaign }
  | { kind: "DUPLICATE_KEY" };

export type UpdateCampaignStatusResult =
  | { kind: "UPDATED"; campaign: AdminCampaign }
  | { kind: "CONFLICT_OR_NOT_FOUND" };

export interface AdminCampaignRepository {
  listCampaigns(storeId: string): Promise<AdminCampaign[]>;
  createCampaign(
    input: CreateAdminCampaignInput,
  ): Promise<CreateAdminCampaignResult>;
  updateCampaignStatus(input: {
    storeId: string;
    campaignId: string;
    expectedRevision: number;
    status: CampaignStatus;
  }): Promise<UpdateCampaignStatusResult>;
}
