import type { AttributionInput } from "./contracts";

export function deriveAttributionSource(
  attribution: AttributionInput,
): string {
  if (attribution.utmSource) return attribution.utmSource;
  if (attribution.fbclid) return "facebook";
  if (attribution.gclid) return "google";
  if (attribution.referrer) return "referral";
  return "direct";
}
