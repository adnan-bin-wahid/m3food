import {
  decimalMajorToMinor,
  parseProviderCount,
  type PaidAdsProviderClient,
  type PaidAdsProviderDailyMetric,
} from "./paid-ads-provider";

export interface MetaPaidAdsProviderConfig {
  accessToken: string;
  apiVersion: string;
}

type FetchLike = typeof fetch;

function asObject(value: unknown) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export class MetaPaidAdsProviderClient
  implements PaidAdsProviderClient
{
  readonly provider = "META" as const;

  constructor(
    private readonly config: MetaPaidAdsProviderConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

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

    const campaignIds = new Set(
      input.mappings.map((mapping) => mapping.externalCampaignId),
    );

    const url = new URL(
      `https://graph.facebook.com/${this.config.apiVersion}/${encodeURIComponent(input.account.externalAccountId)}/insights`,
    );

    url.searchParams.set(
      "fields",
      "campaign_id,campaign_name,spend,impressions,clicks,date_start",
    );
    url.searchParams.set("level", "campaign");
    url.searchParams.set("time_increment", "1");
    url.searchParams.set(
      "time_range",
      JSON.stringify({
        since: input.startDate,
        until: input.endDate,
      }),
    );
    url.searchParams.set("limit", "5000");
    url.searchParams.set(
      "filtering",
      JSON.stringify([
        {
          field: "campaign.id",
          operator: "IN",
          value: Array.from(campaignIds),
        },
      ]),
    );

    const metrics: PaidAdsProviderDailyMetric[] = [];
    let nextUrl: URL | null = url;
    let pages = 0;

    while (nextUrl) {
      pages += 1;
      if (pages > 20) {
        throw new Error("Meta Ads pagination exceeded the safety limit.");
      }

      const response = await this.fetchImpl(nextUrl, {
        method: "GET",
        headers: {
          authorization: `Bearer ${this.config.accessToken}`,
          accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Meta Ads Insights request failed with status ${response.status}.`,
        );
      }

      const body = asObject(await response.json());
      if (!body) {
        throw new Error("Meta Ads Insights returned an invalid payload.");
      }

      const data = Array.isArray(body.data) ? body.data : [];

      for (const item of data) {
        const row = asObject(item);
        if (!row) continue;

        const externalCampaignId = String(
          row.campaign_id ?? "",
        ).trim();

        if (!campaignIds.has(externalCampaignId)) {
          continue;
        }

        const metricDate = String(row.date_start ?? "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) {
          throw new Error("Meta Ads returned an invalid metric date.");
        }

        metrics.push({
          externalCampaignId,
          metricDate,
          spendMinor: decimalMajorToMinor(row.spend ?? "0"),
          impressions: parseProviderCount(
            row.impressions ?? "0",
            "Meta impressions",
          ),
          clicks: parseProviderCount(
            row.clicks ?? "0",
            "Meta clicks",
          ),
        });
      }

      const paging = asObject(body.paging);
      const next =
        paging && typeof paging.next === "string"
          ? paging.next
          : null;

      if (!next) {
        nextUrl = null;
        continue;
      }

      const parsed = new URL(next);
      if (
        parsed.protocol !== "https:" ||
        parsed.hostname !== "graph.facebook.com"
      ) {
        throw new Error("Meta Ads returned an unsafe pagination URL.");
      }

      parsed.searchParams.delete("access_token");
      nextUrl = parsed;
    }

    return metrics;
  }
}
