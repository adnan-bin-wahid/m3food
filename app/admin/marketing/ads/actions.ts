"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  AdminPaidAdsError,
  createAdminPaidAdAccount,
  createAdminPaidAdMapping,
  upsertAdminPaidAdDailyMetric,
} from "../../../../src/lib/admin/paid-ads-service";
import {
  PaidAdsSyncError,
  syncAdminPaidAdAccount,
} from "../../../../src/lib/admin/paid-ads-sync-service";
import {
  AdminPaidAdsScheduleError,
  updateAdminPaidAdSchedule,
} from "../../../../src/lib/admin/paid-ads-schedule-service";
import { getCurrentAdmin } from "../../../../src/lib/auth/current-admin";
import { DrizzleAdminPaidAdsSyncRepository } from "../../../../src/lib/db/admin-paid-ads-sync-repository";
import { DrizzleAdminPaidAdsScheduleRepository } from "../../../../src/lib/db/admin-paid-ads-schedule-repository";
import { resolvePaidAdsProviderClient } from "../../../../src/lib/marketing/paid-ads-provider-factory";
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
  if (error instanceof PaidAdsSyncError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof AdminPaidAdsScheduleError) {
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


export async function syncPaidAdsAccountAction(
  _previous: PaidAdsActionState,
  formData: FormData,
): Promise<PaidAdsActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Your admin session has expired.",
    };
  }

  try {
    const result = await syncAdminPaidAdAccount(
      admin,
      {
        accountId: formData.get("accountId"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      },
      new DrizzleAdminPaidAdsSyncRepository(),
      (provider) => resolvePaidAdsProviderClient(provider),
    );

    revalidatePath("/admin/marketing/ads");

    return {
      ok: true,
      message:
        `${result.provider} delivery synced: ${result.rowsWritten} API row${result.rowsWritten === 1 ? "" : "s"} written.`,
    };
  } catch (error) {
    return errorState(error, "Provider delivery sync failed.");
  }
}


export async function updatePaidAdScheduleAction(
  _previous: PaidAdsActionState,
  formData: FormData,
): Promise<PaidAdsActionState> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      ok: false,
      message: "Your admin session has expired.",
    };
  }

  try {
    const result = await updateAdminPaidAdSchedule(
      admin,
      {
        accountId: formData.get("accountId"),
        syncEnabled: formData.get("syncEnabled") === "on",
        syncLookbackDays: formData.get("syncLookbackDays"),
        revision: formData.get("revision"),
      },
      new DrizzleAdminPaidAdsScheduleRepository(),
    );

    revalidatePath("/admin/marketing/ads");

    return {
      ok: true,
      message:
        result.syncEnabled
          ? `Scheduled sync enabled with a ${result.syncLookbackDays}-day lookback.`
          : "Scheduled sync disabled.",
    };
  } catch (error) {
    return errorState(
      error,
      "Paid ads schedule could not be updated.",
    );
  }
}
