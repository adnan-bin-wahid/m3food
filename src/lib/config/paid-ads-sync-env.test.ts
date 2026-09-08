import assert from "node:assert/strict";
import test from "node:test";
import {
  getPaidAdsProviderReadiness,
  paidAdsSyncEnvironmentSchema,
} from "./paid-ads-sync-env";

test("paid ads provider credentials are optional when no provider sync is configured", () => {
  const result = paidAdsSyncEnvironmentSchema.safeParse({});
  assert.equal(result.success, true);

  assert.deepEqual(getPaidAdsProviderReadiness({}), {
    META: false,
    GOOGLE: false,
  });
});

test("Meta paid ads credentials must be configured as a complete pair", () => {
  const partial = paidAdsSyncEnvironmentSchema.safeParse({
    META_ADS_ACCESS_TOKEN: "secret",
  });
  assert.equal(partial.success, false);

  const complete = paidAdsSyncEnvironmentSchema.safeParse({
    META_ADS_ACCESS_TOKEN: "secret",
    META_ADS_API_VERSION: "v99.0",
  });
  assert.equal(complete.success, true);
});

test("Google Ads sync requires the complete OAuth and developer-token set", () => {
  const partial = paidAdsSyncEnvironmentSchema.safeParse({
    GOOGLE_ADS_DEVELOPER_TOKEN: "developer",
    GOOGLE_ADS_CLIENT_ID: "client",
  });
  assert.equal(partial.success, false);

  const complete = paidAdsSyncEnvironmentSchema.safeParse({
    GOOGLE_ADS_DEVELOPER_TOKEN: "developer",
    GOOGLE_ADS_CLIENT_ID: "client",
    GOOGLE_ADS_CLIENT_SECRET: "secret",
    GOOGLE_ADS_REFRESH_TOKEN: "refresh",
    GOOGLE_ADS_API_VERSION: "v99",
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: "123-456-7890",
  });
  assert.equal(complete.success, true);

  assert.deepEqual(
    getPaidAdsProviderReadiness({
      GOOGLE_ADS_DEVELOPER_TOKEN: "developer",
      GOOGLE_ADS_CLIENT_ID: "client",
      GOOGLE_ADS_CLIENT_SECRET: "secret",
      GOOGLE_ADS_REFRESH_TOKEN: "refresh",
      GOOGLE_ADS_API_VERSION: "v99",
    }),
    { META: false, GOOGLE: true },
  );
});
