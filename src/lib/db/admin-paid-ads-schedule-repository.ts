import { and, desc, eq, sql } from "drizzle-orm";
import type { AdminPaidAdsScheduleRepository } from "../admin/paid-ads-schedule-repository";
import { getDatabase, type Database } from "./index";
import {
  paidAdAccounts,
  paidAdSyncRuns,
} from "./schema";

export class DrizzleAdminPaidAdsScheduleRepository
  implements AdminPaidAdsScheduleRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getWorkspace(storeId: string) {
    const [accounts, runRows] = await Promise.all([
      this.database
        .select({
          id: paidAdAccounts.id,
          provider: paidAdAccounts.provider,
          externalAccountId: paidAdAccounts.externalAccountId,
          name: paidAdAccounts.name,
          timezone: paidAdAccounts.timezone,
          isActive: paidAdAccounts.isActive,
          syncEnabled: paidAdAccounts.syncEnabled,
          syncLookbackDays: paidAdAccounts.syncLookbackDays,
          revision: paidAdAccounts.revision,
        })
        .from(paidAdAccounts)
        .where(eq(paidAdAccounts.storeId, storeId))
        .orderBy(desc(paidAdAccounts.createdAt)),
      this.database
        .select({
          id: paidAdSyncRuns.id,
          accountId: paidAdSyncRuns.accountId,
          accountName: paidAdAccounts.name,
          provider: paidAdSyncRuns.provider,
          startDate: paidAdSyncRuns.startDate,
          endDate: paidAdSyncRuns.endDate,
          status: paidAdSyncRuns.status,
          rowsFetched: paidAdSyncRuns.rowsFetched,
          rowsWritten: paidAdSyncRuns.rowsWritten,
          skippedUnmapped: paidAdSyncRuns.skippedUnmapped,
          errorCode: paidAdSyncRuns.errorCode,
          errorMessage: paidAdSyncRuns.errorMessage,
          startedAt: paidAdSyncRuns.startedAt,
          completedAt: paidAdSyncRuns.completedAt,
        })
        .from(paidAdSyncRuns)
        .innerJoin(
          paidAdAccounts,
          eq(paidAdSyncRuns.accountId, paidAdAccounts.id),
        )
        .where(eq(paidAdSyncRuns.storeId, storeId))
        .orderBy(desc(paidAdSyncRuns.startedAt))
        .limit(100),
    ]);

    return {
      accounts,
      runs: runRows,
    };
  }

  async updateSchedule(
    input: Parameters<
      AdminPaidAdsScheduleRepository["updateSchedule"]
    >[0],
  ) {
    const rows = await this.database
      .update(paidAdAccounts)
      .set({
        syncEnabled: input.syncEnabled,
        syncLookbackDays: input.syncLookbackDays,
        revision: sql`${paidAdAccounts.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paidAdAccounts.id, input.accountId),
          eq(paidAdAccounts.storeId, input.storeId),
          eq(paidAdAccounts.isActive, true),
          eq(paidAdAccounts.revision, input.revision),
        ),
      )
      .returning({ id: paidAdAccounts.id });

    return rows.length === 1;
  }
}
