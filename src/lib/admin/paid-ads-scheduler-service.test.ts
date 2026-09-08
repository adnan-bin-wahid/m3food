import assert from "node:assert/strict";
import test from "node:test";
import type {
  ClaimScheduledSyncRunResult,
  PaidAdsSchedulerRepository,
  ScheduledPaidAdAccount,
} from "./paid-ads-scheduler-repository";
import {
  resolveScheduledPaidAdsWindow,
  runScheduledPaidAdsSync,
} from "./paid-ads-scheduler-service";

const account: ScheduledPaidAdAccount = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  provider: "META",
  externalAccountId: "act_123",
  name: "Meta Main",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  syncLookbackDays: 3,
};

test("scheduled windows end on the previous provider-local calendar date", () => {
  const window = resolveScheduledPaidAdsWindow(
    account,
    new Date("2026-09-08T20:30:00Z"),
  );

  assert.deepEqual(window, {
    localToday: "2026-09-09",
    startDate: "2026-09-06",
    endDate: "2026-09-08",
    scheduleKey:
      "daily:11111111-1111-4111-8111-111111111111:2026-09-09",
  });
});

test("daily scheduler claims once, records success, and uses a system actor without provider conversions", async () => {
  const calls: string[] = [];

  const repository: PaidAdsSchedulerRepository = {
    async listScheduledAccounts() {
      return [account];
    },
    async claimScheduledRun(): Promise<ClaimScheduledSyncRunResult> {
      calls.push("claim");
      return {
        kind: "CLAIMED",
        runId: "33333333-3333-4333-8333-333333333333",
      };
    },
    async completeScheduledRunSuccess(input) {
      calls.push(`success:${input.rowsWritten}`);
    },
    async completeScheduledRunFailure() {
      calls.push("failure");
    },
  };

  const result = await runScheduledPaidAdsSync(
    repository,
    async (admin, input) => {
      assert.equal(admin.role, "OWNER");
      assert.equal(admin.storeId, account.storeId);
      assert.equal(
        admin.email,
        "paid-ads-scheduler@system.internal",
      );
      assert.equal(input.startDate, "2026-09-05");
      assert.equal(input.endDate, "2026-09-07");

      return {
        provider: "META",
        accountId: account.id,
        accountName: account.name,
        startDate: input.startDate,
        endDate: input.endDate,
        rowsFetched: 3,
        rowsWritten: 3,
        skippedUnmapped: 0,
      };
    },
    new Date("2026-09-08T00:05:00Z"),
  );

  assert.deepEqual(calls, ["claim", "success:3"]);
  assert.deepEqual(result, {
    accountsConsidered: 1,
    claimed: 1,
    succeeded: 1,
    failed: 0,
    duplicateSkipped: 0,
    rowsWritten: 3,
  });
});

test("duplicate schedule keys skip work and provider failures become run-health evidence", async () => {
  const second = {
    ...account,
    id: "44444444-4444-4444-8444-444444444444",
    provider: "GOOGLE" as const,
  };

  const completed: string[] = [];

  const repository: PaidAdsSchedulerRepository = {
    async listScheduledAccounts() {
      return [account, second];
    },
    async claimScheduledRun(input) {
      if (input.accountId === account.id) {
        return { kind: "DUPLICATE" };
      }
      return {
        kind: "CLAIMED",
        runId: "55555555-5555-4555-8555-555555555555",
      };
    },
    async completeScheduledRunSuccess() {
      completed.push("success");
    },
    async completeScheduledRunFailure(input) {
      completed.push(
        `failure:${input.errorCode}:${input.errorMessage}`,
      );
    },
  };

  const result = await runScheduledPaidAdsSync(
    repository,
    async () => {
      const error = new Error(
        "GOOGLE Ads API credentials are not configured on the server.",
      ) as Error & { code: string };
      error.code = "PROVIDER_NOT_CONFIGURED";
      throw error;
    },
    new Date("2026-09-08T00:05:00Z"),
  );

  assert.equal(result.duplicateSkipped, 1);
  assert.equal(result.failed, 1);
  assert.equal(result.claimed, 1);
  assert.match(
    completed[0] ?? "",
    /PROVIDER_NOT_CONFIGURED/,
  );
});
