import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type { AdminPaidAdsScheduleRepository } from "./paid-ads-schedule-repository";
import {
  AdminPaidAdsScheduleError,
  updateAdminPaidAdSchedule,
} from "./paid-ads-schedule-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

function repository(
  updateSchedule: AdminPaidAdsScheduleRepository["updateSchedule"],
): AdminPaidAdsScheduleRepository {
  return {
    async getWorkspace() {
      return { accounts: [], runs: [] };
    },
    updateSchedule,
  };
}

test("owner schedule updates are store scoped, bounded, and optimistic", async () => {
  let captured: unknown;

  const result = await updateAdminPaidAdSchedule(
    owner,
    {
      accountId: "33333333-3333-4333-8333-333333333333",
      syncEnabled: true,
      syncLookbackDays: "7",
      revision: "2",
    },
    repository(async (input) => {
      captured = input;
      return true;
    }),
  );

  assert.deepEqual(captured, {
    storeId: owner.storeId,
    accountId: "33333333-3333-4333-8333-333333333333",
    syncEnabled: true,
    syncLookbackDays: 7,
    revision: 2,
  });
  assert.equal(result.syncLookbackDays, 7);
});

test("analysts fail before a schedule mutation reaches the repository", async () => {
  let called = false;

  await assert.rejects(
    () =>
      updateAdminPaidAdSchedule(
        { ...owner, role: "ANALYST" },
        {
          accountId: "33333333-3333-4333-8333-333333333333",
          syncEnabled: true,
          syncLookbackDays: 3,
          revision: 0,
        },
        repository(async () => {
          called = true;
          return true;
        }),
      ),
    (error: unknown) =>
      error instanceof AdminPaidAdsScheduleError &&
      error.code === "FORBIDDEN",
  );

  assert.equal(called, false);
});

test("stale or inactive schedule writes fail closed", async () => {
  await assert.rejects(
    () =>
      updateAdminPaidAdSchedule(
        owner,
        {
          accountId: "33333333-3333-4333-8333-333333333333",
          syncEnabled: false,
          syncLookbackDays: 3,
          revision: 4,
        },
        repository(async () => false),
      ),
    (error: unknown) =>
      error instanceof AdminPaidAdsScheduleError &&
      error.code === "ACCOUNT_NOT_FOUND_OR_STALE",
  );
});

test("schedule lookback is bounded to 1 through 31 days", async () => {
  for (const invalid of [0, 32, -1, 1.5]) {
    await assert.rejects(() =>
      updateAdminPaidAdSchedule(
        owner,
        {
          accountId: "33333333-3333-4333-8333-333333333333",
          syncEnabled: true,
          syncLookbackDays: invalid,
          revision: 0,
        },
        repository(async () => true),
      ),
    );
  }
});
