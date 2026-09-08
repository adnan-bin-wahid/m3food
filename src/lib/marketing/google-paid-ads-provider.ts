import {
  microsToMinor,
  parseProviderCount,
  type PaidAdsProviderClient,
  type PaidAdsProviderDailyMetric,
} from "./paid-ads-provider";

export interface GooglePaidAdsProviderConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiVersion: string;
  loginCustomerId?: string;
}

type FetchLike = typeof fetch;

function asObject(value: unknown) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export class GooglePaidAdsProviderClient
  implements PaidAdsProviderClient
{
  readonly provider = "GOOGLE" as const;

  constructor(
    private readonly config: GooglePaidAdsProviderConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  private async getAccessToken() {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: "refresh_token",
    });

    const response = await this.fetchImpl(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
        body,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Google OAuth refresh failed with status ${response.status}.`,
      );
    }

    const payload = asObject(await response.json());
    const accessToken =
      payload && typeof payload.access_token === "string"
        ? payload.access_token.trim()
        : "";

    if (!accessToken) {
      throw new Error("Google OAuth refresh returned no access token.");
    }

    return accessToken;
  }

  async fetchDailyMetrics(input: {
    account: Parameters<
      PaidAdsProviderClient["fetchDailyMetrics"]
    >[0]["account"];
    mappings: Parameters<
      PaidAdsProviderClient["fetchDailyMetrics"]
    >[0]["mappings"];
    startDate: string;
    endDate: string;
  }): Promise<PaidAdsProviderDailyMetric[]> {
    if (!input.mappings.length) return [];

    const campaignIds = input.mappings.map(
      (mapping) => mapping.externalCampaignId,
    );

    if (campaignIds.some((id) => !/^\d+$/.test(id))) {
      throw new Error(
        "Google Ads external campaign IDs must be numeric.",
      );
    }

    const customerId = input.account.externalAccountId.replace(
      /-/g,
      "",
    );

    if (!/^\d{10}$/.test(customerId)) {
      throw new Error(
        "Google Ads account external ID must be a 10-digit customer ID.",
      );
    }

    const accessToken = await this.getAccessToken();

    const query = [
      "SELECT",
      "campaign.id,",
      "campaign.name,",
      "segments.date,",
      "metrics.cost_micros,",
      "metrics.impressions,",
      "metrics.clicks",
      "FROM campaign",
      `WHERE segments.date BETWEEN '${input.startDate}' AND '${input.endDate}'`,
      `AND campaign.id IN (${campaignIds.join(",")})`,
    ].join(" ");

    const headers: Record<string, string> = {
      authorization: `Bearer ${accessToken}`,
      "developer-token": this.config.developerToken,
      "content-type": "application/json",
      accept: "application/json",
    };

    if (this.config.loginCustomerId) {
      headers["login-customer-id"] =
        this.config.loginCustomerId.replace(/-/g, "");
    }

    const response = await this.fetchImpl(
      `https://googleads.googleapis.com/${this.config.apiVersion}/customers/${customerId}/googleAds:searchStream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Google Ads query failed with status ${response.status}.`,
      );
    }

    const payload = await response.json();
    const chunks = Array.isArray(payload) ? payload : [];
    const allowedCampaignIds = new Set(campaignIds);
    const metrics: PaidAdsProviderDailyMetric[] = [];

    for (const chunkValue of chunks) {
      const chunk = asObject(chunkValue);
      const results =
        chunk && Array.isArray(chunk.results)
          ? chunk.results
          : [];

      for (const resultValue of results) {
        const result = asObject(resultValue);
        const campaign = result
          ? asObject(result.campaign)
          : null;
        const segments = result
          ? asObject(result.segments)
          : null;
        const providerMetrics = result
          ? asObject(result.metrics)
          : null;

        const externalCampaignId = String(
          campaign?.id ?? "",
        ).trim();

        if (!allowedCampaignIds.has(externalCampaignId)) {
          continue;
        }

        const metricDate = String(
          segments?.date ?? "",
        ).trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) {
          throw new Error("Google Ads returned an invalid metric date.");
        }

        metrics.push({
          externalCampaignId,
          metricDate,
          spendMinor: microsToMinor(
            providerMetrics?.costMicros ?? "0",
          ),
          impressions: parseProviderCount(
            providerMetrics?.impressions ?? "0",
            "Google impressions",
          ),
          clicks: parseProviderCount(
            providerMetrics?.clicks ?? "0",
            "Google clicks",
          ),
        });
      }
    }

    return metrics;
  }
}
