"use server";

import { getMarketingPreferenceSecret } from "../../../src/lib/config/server-env";
import { DrizzleMarketingPreferenceRepository } from "../../../src/lib/db/marketing-preference-repository";
import { CURRENT_PRIVACY_POLICY_VERSION } from "../../../src/lib/privacy/consent";
import { updateMarketingPreference } from "../../../src/lib/privacy/preferences";

export interface PreferenceActionState {
  ok: boolean;
  message: string;
}

export async function updateMarketingPreferenceAction(
  _previousState: PreferenceActionState,
  formData: FormData,
): Promise<PreferenceActionState> {
  try {
    const token = formData.get("token");
    const result = await updateMarketingPreference(
      token,
      {
        emailMarketingAllowed: formData.get("emailMarketingAllowed") === "on",
        smsMarketingAllowed: formData.get("smsMarketingAllowed") === "on",
        whatsappMarketingAllowed: formData.get("whatsappMarketingAllowed") === "on",
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      },
      getMarketingPreferenceSecret(),
      new DrizzleMarketingPreferenceRepository(),
    );
    if (!result) return { ok: false, message: "This preference link is invalid or unavailable." };
    return { ok: true, message: "Your marketing preferences have been updated." };
  } catch {
    return { ok: false, message: "Preferences could not be updated. Please try again." };
  }
}
