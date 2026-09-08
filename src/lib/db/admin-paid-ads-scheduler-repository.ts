import { and, eq, sql } from "drizzle-orm";
import type {
  ClaimScheduledSyncRunResult,
  PaidAdsSchedulerRepository,
} from "../admin/paid-ads-scheduler-repository";
import { getDatabase, type Database } from "./index";
import {
  paidAdAccounts,
  paidAdSyncRuns,
  stores,
} from "./schema";

export class DrizzlePaidAdsSchedulerRepository
  implements PaidAdsSchedulerRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async listScheduledAccounts() {
    return this.database
      .select({
        id: paidAdAccounts.id,
        storeId: paidAdAccounts.storeId,
        storeSlug: stores.slug,
        provider: paidAdAccounts.provider,
        externalAccountId: paidAdAccounts.externalAccountId,
        name: paidAdAccounts.name,
        currency: paidAdAccounts.currency,
        timezone: paidAdAccounts.timezone,
        syncLookbackDays: paidAdAccounts.syncLookbackDays,
      })
      .from(paidAdAccounts)
      .innerJoin(stores, eq(stores.id, paidAdAccounts.storeId))
      .where(
        and(
          eq(paidAdAccounts.isActive, true),
          eq(paidAdAccounts.syncEnabled, true),
        ),
      );
  }

  async claimScheduledRun(
    input: Parameters<
      PaidAdsSchedulerRepository["claimScheduledRun"]
    >[0],
  ): Promise<ClaimScheduledSyncRunResult> {
    const rows = await this.database
      .insert(paidAdSyncRuns)
      .values({
        storeId: input.storeId,
        accountId: input.accountId,
        provider: input.provider,
        scheduleKey: input.scheduleKey,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "RUNNING",
      })
      .onConflictDoNothing({
        target: paidAdSyncRuns.scheduleKey,
      })
      .returning({ id: paidAdSyncRuns.id });

    return rows[0]
      ? { kind: "CLAIMED", runId: rows[0].id }
      : { kind: "DUPLICATE" };
  }

  async completeScheduledRunSuccess(
    input: Parameters<
      PaidAdsSchedulerRepository["completeScheduledRunSuccess"]
    >[0],
  ) {
    await this.database
      .update(paidAdSyncRuns)
      .set({
        status: "SUCCEEDED",
        rowsFetched: input.rowsFetched,
        rowsWritten: input.rowsWritten,
        skippedUnmapped: input.skippedUnmapped,
        errorCode: null,
        errorMessage: null,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(paidAdSyncRuns.id, input.runId),
          eq(paidAdSyncRuns.status, "RUNNING"),
        ),
      );
  }

  async completeScheduledRunFailure(
    input: Parameters<
      PaidAdsSchedulerRepository["completeScheduledRunFailure"]
    >[0],
  ) {
    await this.database
      .update(paidAdSyncRuns)
      .set({
        status: "FAILED",
        errorCode: input.errorCode.slice(0, 64),
        errorMessage: input.errorMessage.slice(0, 1000),
        completedAt: new Date(),
      })
      .where(
        and(
          eq(paidAdSyncRuns.id, input.runId),
          eq(paidAdSyncRuns.status, "RUNNING"),
        ),
      );
  }
}
