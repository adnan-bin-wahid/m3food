import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminPaidAdsRepository,
  AdminPaidAdsWorkspace,
} from "./paid-ads-repository";
import {
  AdminPaidAdsError,
  createAdminPaidAdAccount,
  createAdminPaidAdMapping,
  upsertAdminPaidAdDailyMetric,
} from "./paid-ads-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

const analyst: AdminIdentity = { ...owner, role: "ANALYST" };

function fakeRepository(
  overrides: Partial<AdminPaidAdsRepository> = {},
): AdminPaidAdsRepository {
  const workspace: AdminPaidAdsWorkspace = {
    storeCurrency: "BDT",
    accounts: [],
    campaigns: [],
    mappings: [],
    metrics: [],
  };

  return {
    async getWorkspace() {
      return workspace;
    },
    async createAccount(input) {
      return {
        kind: "CREATED",
        account: {
          id: "33333333-3333-4333-8333-333333333333",
          provider: input.provider,
          externalAccountId: input.externalAccountId,
          name: input.name,
          currency: input.currency,
          timezone: input.timezone,
          isActive: true,
          revision: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    },
    async createMapping(input) {
      return {
        kind: "CREATED",
        mapping: {
          id: "44444444-4444-4444-8444-444444444444",
          accountId: input.accountId,
          provider: "META",
          accountName: "Main Meta",
          accountCurrency: "BDT",
          marketingCampaignId: input.marketingCampaignId,
          marketingCampaignName: "Launch",
          campaignKey: "launch",
          externalCampaignId: input.externalCampaignId,
          externalCampaignName: input.externalCampaignName,
          isActive: true,
          revision: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    },
    async upsertDailyMetric(input) {
      return {
        kind: "UPSERTED",
        metric: {
          id: "55555555-5555-4555-8555-555555555555",
          mappingId: input.mappingId,
          metricDate: input.metricDate,
          provider: "META",
          accountName: "Main Meta",
          currency: "BDT",
          externalCampaignId: "ext-campaign",
          externalCampaignName: "External Launch",
          marketingCampaignName: "Launch",
          campaignKey: "launch",
          spendMinor: input.spendMinor,
          impressions: input.impressions,
          clicks: input.clicks,
          ingestionSource: "MANUAL",
          revision: 0,
          updatedAt: new Date(),
        },
      };
    },
    ...overrides,
  };
}

test("analysts fail before paid ads mutations reach the repository", async () => {
  let called = false;
  const repository = fakeRepository({
    async createAccount() {
      called = true;
      throw new Error("should not run");
    },
  });

  await assert.rejects(
    () =>
      createAdminPaidAdAccount(
        analyst,
        {
          provider: "META",
          externalAccountId: "act_123",
          name: "Main",
          currency: "BDT",
          timezone: "Asia/Dhaka",
        },
        repository,
      ),
    (error: unknown) =>
      error instanceof AdminPaidAdsError && error.code === "FORBIDDEN",
  );
  assert.equal(called, false);
});

test("paid ad account creation is store scoped and normalized", async () => {
  let captured: any = null;
  const repository = fakeRepository({
    async createAccount(input) {
      captured = input;
      return fakeRepository().createAccount(input);
    },
  });

  const result = await createAdminPaidAdAccount(
    owner,
    {
      provider: "GOOGLE",
      externalAccountId: " 123-456 ",
      name: " Search Ads ",
      currency: "usd",
      timezone: "Asia/Dhaka",
    },
    repository,
  );

  assert.equal(captured.storeId, owner.storeId);
  assert.equal(captured.currency, "USD");
  assert.equal(captured.externalAccountId, "123-456");
  assert.equal(result.provider, "GOOGLE");
});

test("duplicate external campaigns fail closed instead of remapping silently", async () => {
  const repository = fakeRepository({
    async createMapping() {
      return { kind: "DUPLICATE_EXTERNAL_CAMPAIGN" };
    },
  });

  await assert.rejects(
    () =>
      createAdminPaidAdMapping(
        owner,
        {
          accountId: "33333333-3333-4333-8333-333333333333",
          marketingCampaignId: "66666666-6666-4666-8666-666666666666",
          externalCampaignId: "campaign-1",
          externalCampaignName: "Campaign 1",
        },
        repository,
      ),
    (error: unknown) =>
      error instanceof AdminPaidAdsError &&
      error.code === "DUPLICATE_EXTERNAL_CAMPAIGN",
  );
});

test("manual daily metric writes carry immutable store and actor scope", async () => {
  let captured: any = null;
  const repository = fakeRepository({
    async upsertDailyMetric(input) {
      captured = input;
      return fakeRepository().upsertDailyMetric(input);
    },
  });

  await upsertAdminPaidAdDailyMetric(
    owner,
    {
      mappingId: "44444444-4444-4444-8444-444444444444",
      metricDate: "2026-09-08",
      spendMinor: "12345",
      impressions: "1000",
      clicks: "25",
    },
    repository,
  );

  assert.equal(captured.storeId, owner.storeId);
  assert.equal(captured.updatedByAdminUserId, owner.id);
  assert.equal(captured.updatedByAdminEmail, owner.email);
  assert.equal(captured.spendMinor, 12345);
  assert.equal(captured.impressions, 1000);
  assert.equal(captured.clicks, 25);
});
