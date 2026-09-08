import { and, eq, sql } from "drizzle-orm";
import type { AdminPaidAdsSyncRepository } from "../admin/paid-ads-sync-repository";
import { getDatabase, type Database } from "./index";
import {
  paidAdAccounts,
  paidAdCampaignMappings,
  paidAdDailyMetrics,
} from "./schema";

export class DrizzleAdminPaidAdsSyncRepository
  implements AdminPaidAdsSyncRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getSyncContext(storeId: string, accountId: string) {
    const [account] = await this.database
      .select({
        id: paidAdAccounts.id,
        provider: paidAdAccounts.provider,
        externalAccountId: paidAdAccounts.externalAccountId,
        name: paidAdAccounts.name,
        currency: paidAdAccounts.currency,
        timezone: paidAdAccounts.timezone,
        isActive: paidAdAccounts.isActive,
      })
      .from(paidAdAccounts)
      .where(
        and(
          eq(paidAdAccounts.id, accountId),
          eq(paidAdAccounts.storeId, storeId),
        ),
      )
      .limit(1);

    if (!account) return null;

    const mappings = await this.database
      .select({
        id: paidAdCampaignMappings.id,
        marketingCampaignId:
          paidAdCampaignMappings.marketingCampaignId,
        externalCampaignId:
          paidAdCampaignMappings.externalCampaignId,
        externalCampaignName:
          paidAdCampaignMappings.externalCampaignName,
        isActive: paidAdCampaignMappings.isActive,
      })
      .from(paidAdCampaignMappings)
      .where(
        and(
          eq(paidAdCampaignMappings.storeId, storeId),
          eq(paidAdCampaignMappings.accountId, accountId),
        ),
      );

    return { account, mappings };
  }

  async upsertApiDailyMetric(
    input: Parameters<
      AdminPaidAdsSyncRepository["upsertApiDailyMetric"]
    >[0],
  ) {
    await this.database
      .insert(paidAdDailyMetrics)
      .values({
        storeId: input.storeId,
        mappingId: input.mappingId,
        metricDate: input.metricDate,
        spendMinor: input.spendMinor,
        impressions: input.impressions,
        clicks: input.clicks,
        ingestionSource: "API",
        updatedByAdminUserId: input.updatedByAdminUserId,
        updatedByAdminEmail: input.updatedByAdminEmail,
      })
      .onConflictDoUpdate({
        target: [
          paidAdDailyMetrics.storeId,
          paidAdDailyMetrics.mappingId,
          paidAdDailyMetrics.metricDate,
        ],
        set: {
          spendMinor: input.spendMinor,
          impressions: input.impressions,
          clicks: input.clicks,
          ingestionSource: "API",
          revision: sql`${paidAdDailyMetrics.revision} + 1`,
          updatedByAdminUserId: input.updatedByAdminUserId,
          updatedByAdminEmail: input.updatedByAdminEmail,
          updatedAt: new Date(),
        },
      });
  }
}
