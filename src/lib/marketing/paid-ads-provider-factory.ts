import {
  getPaidAdsSyncEnvironment,
  getPaidAdsProviderReadiness,
} from "../config/paid-ads-sync-env";
import type { PaidAdProvider } from "./paid-ads";
import { GooglePaidAdsProviderClient } from "./google-paid-ads-provider";
import { MetaPaidAdsProviderClient } from "./meta-paid-ads-provider";
import type { PaidAdsProviderClient } from "./paid-ads-provider";

export { getPaidAdsProviderReadiness };

export function resolvePaidAdsProviderClient(
  provider: PaidAdProvider,
  environment: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): PaidAdsProviderClient | null {
  const config = getPaidAdsSyncEnvironment(environment);

  if (provider === "META") {
    if (
      !config.META_ADS_ACCESS_TOKEN ||
      !config.META_ADS_API_VERSION
    ) {
      return null;
    }

    return new MetaPaidAdsProviderClient(
      {
        accessToken: config.META_ADS_ACCESS_TOKEN,
        apiVersion: config.META_ADS_API_VERSION,
      },
      fetchImpl,
    );
  }

  if (
    !config.GOOGLE_ADS_DEVELOPER_TOKEN ||
    !config.GOOGLE_ADS_CLIENT_ID ||
    !config.GOOGLE_ADS_CLIENT_SECRET ||
    !config.GOOGLE_ADS_REFRESH_TOKEN ||
    !config.GOOGLE_ADS_API_VERSION
  ) {
    return null;
  }

  return new GooglePaidAdsProviderClient(
    {
      developerToken: config.GOOGLE_ADS_DEVELOPER_TOKEN,
      clientId: config.GOOGLE_ADS_CLIENT_ID,
      clientSecret: config.GOOGLE_ADS_CLIENT_SECRET,
      refreshToken: config.GOOGLE_ADS_REFRESH_TOKEN,
      apiVersion: config.GOOGLE_ADS_API_VERSION,
      loginCustomerId: config.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    },
    fetchImpl,
  );
}
