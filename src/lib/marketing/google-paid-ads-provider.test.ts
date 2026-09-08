import assert from "node:assert/strict";
import test from "node:test";
import { GooglePaidAdsProviderClient } from "./google-paid-ads-provider";

test("Google sync exchanges the refresh token and queries only delivery metrics for mapped campaigns", async () => {
  const requests: Array<{
    url: string;
    init?: RequestInit;
  }> = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });

    if (String(input) === "https://oauth2.googleapis.com/token") {
      return new Response(
        JSON.stringify({ access_token: "oauth-access" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify([
        {
          results: [
            {
              campaign: {
                id: "123456789",
                name: "Launch",
              },
              segments: {
                date: "2026-09-08",
              },
              metrics: {
                costMicros: "1250000000",
                impressions: "10000",
                clicks: "250",
              },
            },
          ],
        },
      ]),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const client = new GooglePaidAdsProviderClient(
    {
      developerToken: "developer",
      clientId: "client",
      clientSecret: "secret",
      refreshToken: "refresh",
      apiVersion: "v99",
      loginCustomerId: "111-222-3333",
    },
    fetchImpl,
  );

  const rows = await client.fetchDailyMetrics({
    account: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      provider: "GOOGLE",
      externalAccountId: "123-456-7890",
      name: "Google",
      currency: "BDT",
      timezone: "Asia/Dhaka",
    },
    mappings: [
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        externalCampaignId: "123456789",
        externalCampaignName: "Launch",
      },
    ],
    startDate: "2026-09-08",
    endDate: "2026-09-08",
  });

  assert.equal(requests.length, 2);

  const adsRequest = requests[1]!;
  assert.match(
    adsRequest.url,
    /googleads\.googleapis\.com\/v99\/customers\/1234567890/,
  );

  const headers = adsRequest.init?.headers as Record<
    string,
    string
  >;

  assert.equal(headers.authorization, "Bearer oauth-access");
  assert.equal(headers["developer-token"], "developer");
  assert.equal(headers["login-customer-id"], "1112223333");

  const body = JSON.parse(String(adsRequest.init?.body));
  assert.match(body.query, /metrics\.cost_micros/);
  assert.match(body.query, /metrics\.impressions/);
  assert.match(body.query, /metrics\.clicks/);
  assert.doesNotMatch(body.query, /conversions/i);

  assert.deepEqual(rows, [
    {
      externalCampaignId: "123456789",
      metricDate: "2026-09-08",
      spendMinor: 125000,
      impressions: 10000,
      clicks: 250,
    },
  ]);
});
