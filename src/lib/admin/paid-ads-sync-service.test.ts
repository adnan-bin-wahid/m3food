import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type { PaidAdsProviderClient } from "../marketing/paid-ads-provider";
import type { AdminPaidAdsSyncRepository } from "./paid-ads-sync-repository";
import {
  PaidAdsSyncError,
  syncAdminPaidAdAccount,
} from "./paid-ads-sync-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

function repository(
  writes: Array<Record<string, unknown>>,
): AdminPaidAdsSyncRepository {
  return {
    async getSyncContext() {
      return {
        account: {
          id: "33333333-3333-4333-8333-333333333333",
          provider: "META",
          externalAccountId: "act_123",
          name: "Meta Main",
          currency: "BDT",
          timezone: "Asia/Dhaka",
          isActive: true,
        },
        mappings: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            marketingCampaignId:
              "55555555-5555-4555-8555-555555555555",
            externalCampaignId: "123",
            externalCampaignName: "Launch",
            isActive: true,
          },
        ],
      };
    },

    async upsertApiDailyMetric(input) {
      writes.push(input);
    },
  };
}

test("analysts fail before provider sync reaches repository or provider", async () => {
  let repositoryCalled = false;
  let providerCalled = false;

  const repo: AdminPaidAdsSyncRepository = {
    async getSyncContext() {
      repositoryCalled = true;
      return null;
    },
    async upsertApiDailyMetric() {},
  };

  const analyst = {
    ...owner,
    role: "ANALYST" as const,
  };

  await assert.rejects(
    () =>
      syncAdminPaidAdAccount(
        analyst,
        {
          accountId:
            "33333333-3333-4333-8333-333333333333",
          startDate: "2026-09-01",
          endDate: "2026-09-07",
        },
        repo,
        () => {
          providerCalled = true;
          return null;
        },
      ),
    (error: unknown) =>
      error instanceof PaidAdsSyncError &&
      error.code === "FORBIDDEN",
  );

  assert.equal(repositoryCalled, false);
  assert.equal(providerCalled, false);
});

test("provider sync writes API delivery only for active canonical mappings with actor scope", async () => {
  const writes: Array<Record<string, unknown>> = [];

  const provider: PaidAdsProviderClient = {
    provider: "META",
    async fetchDailyMetrics() {
      return [
        {
          externalCampaignId: "123",
          metricDate: "2026-09-07",
          spendMinor: 125000,
          impressions: 10000,
          clicks: 250,
        },
      ];
    },
  };

  const result = await syncAdminPaidAdAccount(
    owner,
    {
      accountId: "33333333-3333-4333-8333-333333333333",
      startDate: "2026-09-01",
      endDate: "2026-09-07",
    },
    repository(writes),
    () => provider,
  );

  assert.equal(result.rowsWritten, 1);
  assert.equal(result.provider, "META");
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], {
    storeId: owner.storeId,
    mappingId: "44444444-4444-4444-8444-444444444444",
    metricDate: "2026-09-07",
    spendMinor: 125000,
    impressions: 10000,
    clicks: 250,
    updatedByAdminUserId: owner.id,
    updatedByAdminEmail: owner.email,
  });
});

test("provider credentials must resolve before sync and sync windows are capped at 31 days", async () => {
  await assert.rejects(
    () =>
      syncAdminPaidAdAccount(
        owner,
        {
          accountId:
            "33333333-3333-4333-8333-333333333333",
          startDate: "2026-09-01",
          endDate: "2026-09-07",
        },
        repository([]),
        () => null,
      ),
    (error: unknown) =>
      error instanceof PaidAdsSyncError &&
      error.code === "PROVIDER_NOT_CONFIGURED",
  );

  await assert.rejects(() =>
    syncAdminPaidAdAccount(
      owner,
      {
        accountId:
          "33333333-3333-4333-8333-333333333333",
        startDate: "2026-08-01",
        endDate: "2026-09-07",
      },
      repository([]),
      () => null,
    ),
  );
});

test("duplicate provider campaign/day rows fail closed instead of double-writing", async () => {
  const provider: PaidAdsProviderClient = {
    provider: "META",
    async fetchDailyMetrics() {
      return [
        {
          externalCampaignId: "123",
          metricDate: "2026-09-07",
          spendMinor: 100,
          impressions: 10,
          clicks: 1,
        },
        {
          externalCampaignId: "123",
          metricDate: "2026-09-07",
          spendMinor: 100,
          impressions: 10,
          clicks: 1,
        },
      ];
    },
  };

  await assert.rejects(
    () =>
      syncAdminPaidAdAccount(
        owner,
        {
          accountId:
            "33333333-3333-4333-8333-333333333333",
          startDate: "2026-09-07",
          endDate: "2026-09-07",
        },
        repository([]),
        () => provider,
      ),
    (error: unknown) =>
      error instanceof PaidAdsSyncError &&
      error.code === "PROVIDER_RESPONSE_INVALID",
  );
});
