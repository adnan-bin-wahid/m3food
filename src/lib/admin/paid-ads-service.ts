import type { AdminIdentity } from "../auth/admin-repository";
import {
  paidAdAccountCreateSchema,
  paidAdCampaignMappingCreateSchema,
  paidAdDailyMetricUpsertSchema,
} from "../marketing/paid-ads";
import type { AdminPaidAdsRepository } from "./paid-ads-repository";

export class AdminPaidAdsError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "DUPLICATE_ACCOUNT"
      | "DUPLICATE_EXTERNAL_CAMPAIGN"
      | "ACCOUNT_OR_CAMPAIGN_NOT_FOUND"
      | "MAPPING_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "AdminPaidAdsError";
  }
}

export function canManagePaidAds(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}

export async function getAdminPaidAdsWorkspace(
  admin: AdminIdentity,
  repository: AdminPaidAdsRepository,
) {
  return repository.getWorkspace(admin.storeId);
}

export async function createAdminPaidAdAccount(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminPaidAdsRepository,
) {
  if (!canManagePaidAds(admin.role)) {
    throw new AdminPaidAdsError(
      "FORBIDDEN",
      "Your role cannot manage paid ad accounts.",
    );
  }

  const input = paidAdAccountCreateSchema.parse(rawInput);
  const result = await repository.createAccount({
    storeId: admin.storeId,
    ...input,
    createdByAdminUserId: admin.id,
    createdByAdminEmail: admin.email,
  });

  if (result.kind === "DUPLICATE_ACCOUNT") {
    throw new AdminPaidAdsError(
      "DUPLICATE_ACCOUNT",
      "That provider account is already registered for this store.",
    );
  }

  return result.account;
}

export async function createAdminPaidAdMapping(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminPaidAdsRepository,
) {
  if (!canManagePaidAds(admin.role)) {
    throw new AdminPaidAdsError(
      "FORBIDDEN",
      "Your role cannot map paid ad campaigns.",
    );
  }

  const input = paidAdCampaignMappingCreateSchema.parse(rawInput);
  const result = await repository.createMapping({
    storeId: admin.storeId,
    ...input,
    createdByAdminUserId: admin.id,
    createdByAdminEmail: admin.email,
  });

  if (result.kind === "DUPLICATE_EXTERNAL_CAMPAIGN") {
    throw new AdminPaidAdsError(
      "DUPLICATE_EXTERNAL_CAMPAIGN",
      "That external campaign is already mapped for this ad account.",
    );
  }
  if (result.kind === "ACCOUNT_OR_CAMPAIGN_NOT_FOUND") {
    throw new AdminPaidAdsError(
      "ACCOUNT_OR_CAMPAIGN_NOT_FOUND",
      "The ad account or Campaign Registry record is unavailable for this store.",
    );
  }

  return result.mapping;
}

export async function upsertAdminPaidAdDailyMetric(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminPaidAdsRepository,
) {
  if (!canManagePaidAds(admin.role)) {
    throw new AdminPaidAdsError(
      "FORBIDDEN",
      "Your role cannot write paid ad delivery metrics.",
    );
  }

  const input = paidAdDailyMetricUpsertSchema.parse(rawInput);
  const result = await repository.upsertDailyMetric({
    storeId: admin.storeId,
    ...input,
    updatedByAdminUserId: admin.id,
    updatedByAdminEmail: admin.email,
  });

  if (result.kind === "MAPPING_NOT_FOUND") {
    throw new AdminPaidAdsError(
      "MAPPING_NOT_FOUND",
      "That paid ad campaign mapping is unavailable for this store.",
    );
  }

  return result.metric;
}
