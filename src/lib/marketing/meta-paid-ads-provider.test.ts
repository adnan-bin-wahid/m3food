import assert from "node:assert/strict";
import test from "node:test";
import { MetaPaidAdsProviderClient } from "./meta-paid-ads-provider";

test("Meta sync requests campaign-level daily delivery and maps spend without importing conversions", async () => {
  let requestedUrl = "";
  let authorization = "";

  const fetchImpl: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = String(
      (init?.headers as Record<string, string>)?.authorization ?? "",
    );

    return new Response(
      JSON.stringify({
        data: [
          {
            campaign_id: "123",
            campaign_name: "Launch",
            spend: "1250.00",
            impressions: "10000",
            clicks: "250",
            date_start: "2026-09-08",
          },
        ],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const client = new MetaPaidAdsProviderClient(
    {
      accessToken: "server-secret",
      apiVersion: "v99.0",
    },
    fetchImpl,
  );

  const rows = await client.fetchDailyMetrics({
    account: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      provider: "META",
      externalAccountId: "act_123",
      name: "Meta",
      currency: "BDT",
      timezone: "Asia/Dhaka",
    },
    mappings: [
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        externalCampaignId: "123",
        externalCampaignName: "Launch",
      },
    ],
    startDate: "2026-09-08",
    endDate: "2026-09-08",
  });

  assert.equal(authorization, "Bearer server-secret");
  assert.match(requestedUrl, /level=campaign/);
  assert.match(requestedUrl, /time_increment=1/);
  assert.doesNotMatch(requestedUrl, /conversions/i);
  assert.deepEqual(rows, [
    {
      externalCampaignId: "123",
      metricDate: "2026-09-08",
      spendMinor: 125000,
      impressions: 10000,
      clicks: 250,
    },
  ]);
});
