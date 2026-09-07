"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  AdminPaidAdsError,
  createAdminPaidAdAccount,
  createAdminPaidAdMapping,
  upsertAdminPaidAdDailyMetric,
} from "../../../../src/lib/admin/paid-ads-service";
import { getCurrentAdmin } from "../../../../src/lib/auth/current-admin";
import { DrizzleAdminPaidAdsRepository } from "../../../../src/lib/db/admin-paid-ads-repository";

export interface PaidAdsActionState {
  ok: boolean;
  message: string;
}

const repository = () => new DrizzleAdminPaidAdsRepository();

function errorState(error: unknown, fallback: string): PaidAdsActionState {
  if (error instanceof AdminPaidAdsError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof ZodError) {
    return {
      ok: false,
      message: error.issues[0]?.message ?? "Check the paid ads form.",
    };
  }
  return { ok: false, message: fallback };
}

export async function createPaidAdAccountAction(
  _previous: PaidAdsActionState,
  formData: FormData,
): Promise<PaidAdsActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  try {
    await createAdminPaidAdAccount(
      admin,
      {
        provider: formData.get("provider"),
        externalAccountId: formData.get("externalAccountId"),
        name: formData.get("name"),
        currency: formData.get("currency"),
        timezone: formData.get("timezone"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Ad account could not be registered.");
  }

  revalidatePath("/admin/marketing/ads");
  return { ok: true, message: "Ad account registered." };
}

export async function createPaidAdMappingAction(
  _previous: PaidAdsActionState,
  formData: FormData,
): Promise<PaidAdsActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  try {
    await createAdminPaidAdMapping(
      admin,
      {
        accountId: formData.get("accountId"),
        marketingCampaignId: formData.get("marketingCampaignId"),
        externalCampaignId: formData.get("externalCampaignId"),
        externalCampaignName: formData.get("externalCampaignName"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Ad campaign mapping could not be created.");
  }

  revalidatePath("/admin/marketing/ads");
  return { ok: true, message: "External campaign mapped." };
}

export async function upsertPaidAdMetricAction(
  _previous: PaidAdsActionState,
  formData: FormData,
): Promise<PaidAdsActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  try {
    await upsertAdminPaidAdDailyMetric(
      admin,
      {
        mappingId: formData.get("mappingId"),
        metricDate: formData.get("metricDate"),
        spendMinor: formData.get("spendMinor"),
        impressions: formData.get("impressions"),
        clicks: formData.get("clicks"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Daily ad metrics could not be saved.");
  }

  revalidatePath("/admin/marketing/ads");
  return { ok: true, message: "Daily delivery metrics saved." };
}
