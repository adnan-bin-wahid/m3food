"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "../../../src/lib/auth/current-admin";
import {
  AdminSettingsError,
  storeSettingsInputSchema,
  updateStoreSettings,
} from "../../../src/lib/admin/settings-service";
import { DrizzleAdminSettingsRepository } from "../../../src/lib/db/admin-settings-repository";

export interface StoreSettingsActionState {
  ok: boolean;
  message: string;
}

export async function saveSettingsAction(
  _previousState: StoreSettingsActionState,
  formData: FormData,
): Promise<StoreSettingsActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  const parsed = storeSettingsInputSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
    metaPixelId: formData.get("metaPixelId"),
    ga4MeasurementId: formData.get("ga4MeasurementId"),
    gtmContainerId: formData.get("gtmContainerId"),
    revision: Number(formData.get("revision")),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the store name, timezone, Meta Pixel ID, GA4 Measurement ID, and GTM Container ID.",
    };
  }

  try {
    await updateStoreSettings(
      admin,
      parsed.data,
      new DrizzleAdminSettingsRepository(),
    );
  } catch (error) {
    if (error instanceof AdminSettingsError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Store settings could not be saved." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/api/v1/stores/${admin.storeSlug}/catalog`);
  return { ok: true, message: "Store settings saved." };
}
