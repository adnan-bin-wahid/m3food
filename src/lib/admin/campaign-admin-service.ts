import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import {
  campaignCreateSchema,
  campaignStatusSchema,
  type CampaignCreateInput,
} from "../marketing/campaigns";
import type {
  AdminCampaignRepository,
  CreateAdminCampaignResult,
} from "./campaign-admin-repository";

export class AdminCampaignError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "DUPLICATE_KEY"
      | "CONFLICT_OR_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "AdminCampaignError";
  }
}

export function canManageCampaigns(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}

export async function getAdminCampaigns(
  admin: AdminIdentity,
  repository: AdminCampaignRepository,
) {
  return repository.listCampaigns(admin.storeId);
}

export async function createAdminCampaign(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCampaignRepository,
) {
  if (!canManageCampaigns(admin.role)) {
    throw new AdminCampaignError(
      "FORBIDDEN",
      "Your role cannot create marketing campaigns.",
    );
  }

  const input: CampaignCreateInput = campaignCreateSchema.parse(rawInput);
  const result: CreateAdminCampaignResult = await repository.createCampaign({
    storeId: admin.storeId,
    ...input,
    createdByAdminUserId: admin.id,
    createdByAdminEmail: admin.email,
  });

  if (result.kind === "DUPLICATE_KEY") {
    throw new AdminCampaignError(
      "DUPLICATE_KEY",
      "That campaign key already exists for this store.",
    );
  }

  return result.campaign;
}

const statusUpdateSchema = z.object({
  campaignId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  status: campaignStatusSchema,
});

export async function updateAdminCampaignStatus(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCampaignRepository,
) {
  if (!canManageCampaigns(admin.role)) {
    throw new AdminCampaignError(
      "FORBIDDEN",
      "Your role cannot change campaign status.",
    );
  }

  const input = statusUpdateSchema.parse(rawInput);
  const result = await repository.updateCampaignStatus({
    storeId: admin.storeId,
    ...input,
  });

  if (result.kind === "CONFLICT_OR_NOT_FOUND") {
    throw new AdminCampaignError(
      "CONFLICT_OR_NOT_FOUND",
      "The campaign changed or is no longer available. Refresh and try again.",
    );
  }

  return result.campaign;
}
