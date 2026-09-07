export const CURRENT_PRIVACY_POLICY_VERSION = "2026-09-07.2";
export const ANALYTICS_CONSENT_STORAGE_KEY = "commerce_analytics_consent";

export type AnalyticsConsentPreference = "unknown" | "accepted" | "declined";

interface ConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredConsent {
  preference: Exclude<AnalyticsConsentPreference, "unknown">;
  policyVersion: string;
}

export function readAnalyticsConsent(
  storage: ConsentStorage,
): AnalyticsConsentPreference {
  try {
    const raw = storage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (!raw) return "unknown";
    const stored = JSON.parse(raw) as Partial<StoredConsent>;
    if (stored.policyVersion !== CURRENT_PRIVACY_POLICY_VERSION) return "unknown";
    return stored.preference === "accepted" || stored.preference === "declined"
      ? stored.preference
      : "unknown";
  } catch {
    return "unknown";
  }
}

export function writeAnalyticsConsent(
  storage: ConsentStorage,
  preference: AnalyticsConsentPreference,
) {
  try {
    if (preference === "unknown") {
      storage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
      return;
    }
    storage.setItem(
      ANALYTICS_CONSENT_STORAGE_KEY,
      JSON.stringify({
        preference,
        policyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      } satisfies StoredConsent),
    );
  } catch {
    // Storage can be unavailable in privacy modes; the caller keeps memory state.
  }
}
