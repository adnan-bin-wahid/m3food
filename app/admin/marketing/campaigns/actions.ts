"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  AdminCampaignError,
  createAdminCampaign,
  updateAdminCampaignStatus,
} from "../../../../src/lib/admin/campaign-admin-service";
import { getCurrentAdmin } from "../../../../src/lib/auth/current-admin";
import { DrizzleAdminCampaignRepository } from "../../../../src/lib/db/admin-campaign-repository";

export interface CampaignActionState {
  ok: boolean;
  message: string;
}

const repository = () => new DrizzleAdminCampaignRepository();

function errorState(error: unknown, fallback: string): CampaignActionState {
  if (error instanceof AdminCampaignError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof ZodError) {
    return {
      ok: false,
      message: error.issues[0]?.message ?? "Check the campaign form.",
    };
  }
  return { ok: false, message: fallback };
}

export async function createCampaignAction(
  _previous: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  try {
    await createAdminCampaign(
      admin,
      {
        name: formData.get("name"),
        campaignKey: formData.get("campaignKey"),
        source: formData.get("source"),
        medium: formData.get("medium"),
        content: formData.get("content"),
        term: formData.get("term"),
        landingUrl: formData.get("landingUrl"),
        notes: formData.get("notes"),
        status: formData.get("status"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Campaign could not be created.");
  }

  revalidatePath("/admin/marketing/campaigns");
  return { ok: true, message: "Campaign created." };
}

export async function updateCampaignStatusAction(
  _previous: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  try {
    await updateAdminCampaignStatus(
      admin,
      {
        campaignId: formData.get("campaignId"),
        expectedRevision: Number(formData.get("expectedRevision")),
        status: formData.get("status"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Campaign status could not be changed.");
  }

  revalidatePath("/admin/marketing/campaigns");
  return { ok: true, message: "Campaign status updated." };
}
