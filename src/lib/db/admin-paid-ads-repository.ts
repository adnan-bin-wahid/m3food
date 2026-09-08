import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AdminPaidAdsRepository,
  CreatePaidAdAccountResult,
  CreatePaidAdMappingResult,
  UpsertPaidAdMetricResult,
} from "../admin/paid-ads-repository";
import { getDatabase, type Database } from "./index";
import {
  marketingCampaigns,
  paidAdAccounts,
  paidAdCampaignMappings,
  paidAdDailyMetrics,
  stores,
} from "./schema";

const accountSelection = {
  id: paidAdAccounts.id,
  provider: paidAdAccounts.provider,
  externalAccountId: paidAdAccounts.externalAccountId,
  name: paidAdAccounts.name,
  currency: paidAdAccounts.currency,
  timezone: paidAdAccounts.timezone,
  isActive: paidAdAccounts.isActive,
  revision: paidAdAccounts.revision,
  createdAt: paidAdAccounts.createdAt,
  updatedAt: paidAdAccounts.updatedAt,
};

const mappingSelection = {
  id: paidAdCampaignMappings.id,
  accountId: paidAdCampaignMappings.accountId,
  provider: paidAdAccounts.provider,
  accountName: paidAdAccounts.name,
  accountCurrency: paidAdAccounts.currency,
  marketingCampaignId: paidAdCampaignMappings.marketingCampaignId,
  marketingCampaignName: marketingCampaigns.name,
  campaignKey: marketingCampaigns.campaignKey,
  externalCampaignId: paidAdCampaignMappings.externalCampaignId,
  externalCampaignName: paidAdCampaignMappings.externalCampaignName,
  isActive: paidAdCampaignMappings.isActive,
  revision: paidAdCampaignMappings.revision,
  createdAt: paidAdCampaignMappings.createdAt,
  updatedAt: paidAdCampaignMappings.updatedAt,
};

const metricSelection = {
  id: paidAdDailyMetrics.id,
  mappingId: paidAdDailyMetrics.mappingId,
  metricDate: paidAdDailyMetrics.metricDate,
  provider: paidAdAccounts.provider,
  accountName: paidAdAccounts.name,
  currency: paidAdAccounts.currency,
  externalCampaignId: paidAdCampaignMappings.externalCampaignId,
  externalCampaignName: paidAdCampaignMappings.externalCampaignName,
  marketingCampaignName: marketingCampaigns.name,
  campaignKey: marketingCampaigns.campaignKey,
  spendMinor: paidAdDailyMetrics.spendMinor,
  impressions: paidAdDailyMetrics.impressions,
  clicks: paidAdDailyMetrics.clicks,
  ingestionSource: paidAdDailyMetrics.ingestionSource,
  revision: paidAdDailyMetrics.revision,
  updatedAt: paidAdDailyMetrics.updatedAt,
};

export class DrizzleAdminPaidAdsRepository implements AdminPaidAdsRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async getWorkspace(storeId: string) {
    const [store] = await this.database
      .select({ currency: stores.currency })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    if (!store) return null;

    const [accounts, campaigns, mappings, metrics] = await Promise.all([
      this.database
        .select(accountSelection)
        .from(paidAdAccounts)
        .where(eq(paidAdAccounts.storeId, storeId))
        .orderBy(desc(paidAdAccounts.createdAt)),
      this.database
        .select({
          id: marketingCampaigns.id,
          name: marketingCampaigns.name,
          campaignKey: marketingCampaigns.campaignKey,
          status: marketingCampaigns.status,
        })
        .from(marketingCampaigns)
        .where(eq(marketingCampaigns.storeId, storeId))
        .orderBy(desc(marketingCampaigns.createdAt)),
      this.database
        .select(mappingSelection)
        .from(paidAdCampaignMappings)
        .innerJoin(
          paidAdAccounts,
          eq(paidAdCampaignMappings.accountId, paidAdAccounts.id),
        )
        .leftJoin(
          marketingCampaigns,
          eq(
            paidAdCampaignMappings.marketingCampaignId,
            marketingCampaigns.id,
          ),
        )
        .where(eq(paidAdCampaignMappings.storeId, storeId))
        .orderBy(desc(paidAdCampaignMappings.createdAt)),
      this.database
        .select(metricSelection)
        .from(paidAdDailyMetrics)
        .innerJoin(
          paidAdCampaignMappings,
          eq(paidAdDailyMetrics.mappingId, paidAdCampaignMappings.id),
        )
        .innerJoin(
          paidAdAccounts,
          eq(paidAdCampaignMappings.accountId, paidAdAccounts.id),
        )
        .leftJoin(
          marketingCampaigns,
          eq(
            paidAdCampaignMappings.marketingCampaignId,
            marketingCampaigns.id,
          ),
        )
        .where(eq(paidAdDailyMetrics.storeId, storeId))
        .orderBy(
          desc(paidAdDailyMetrics.metricDate),
          desc(paidAdDailyMetrics.updatedAt),
        )
        .limit(100),
    ]);

    return {
      storeCurrency: store.currency,
      accounts,
      campaigns,
      mappings,
      metrics,
    };
  }

  async createAccount(
    input: Parameters<AdminPaidAdsRepository["createAccount"]>[0],
  ): Promise<CreatePaidAdAccountResult> {
    const rows = await this.database
      .insert(paidAdAccounts)
      .values({
        storeId: input.storeId,
        provider: input.provider,
        externalAccountId: input.externalAccountId,
        name: input.name,
        currency: input.currency,
        timezone: input.timezone,
        createdByAdminUserId: input.createdByAdminUserId,
        createdByAdminEmail: input.createdByAdminEmail,
      })
      .onConflictDoNothing({
        target: [
          paidAdAccounts.storeId,
          paidAdAccounts.provider,
          paidAdAccounts.externalAccountId,
        ],
      })
      .returning(accountSelection);

    const account = rows[0];
    return account
      ? { kind: "CREATED", account }
      : { kind: "DUPLICATE_ACCOUNT" };
  }

  async createMapping(
    input: Parameters<AdminPaidAdsRepository["createMapping"]>[0],
  ): Promise<CreatePaidAdMappingResult> {
    const [[account], [campaign]] = await Promise.all([
      this.database
        .select({ id: paidAdAccounts.id })
        .from(paidAdAccounts)
        .where(
          and(
            eq(paidAdAccounts.id, input.accountId),
            eq(paidAdAccounts.storeId, input.storeId),
          ),
        )
        .limit(1),
      this.database
        .select({ id: marketingCampaigns.id })
        .from(marketingCampaigns)
        .where(
          and(
            eq(marketingCampaigns.id, input.marketingCampaignId),
            eq(marketingCampaigns.storeId, input.storeId),
          ),
        )
        .limit(1),
    ]);

    if (!account || !campaign) {
      return { kind: "ACCOUNT_OR_CAMPAIGN_NOT_FOUND" };
    }

    const rows = await this.database
      .insert(paidAdCampaignMappings)
      .values({
        storeId: input.storeId,
        accountId: input.accountId,
        marketingCampaignId: input.marketingCampaignId,
        externalCampaignId: input.externalCampaignId,
        externalCampaignName: input.externalCampaignName,
        createdByAdminUserId: input.createdByAdminUserId,
        createdByAdminEmail: input.createdByAdminEmail,
      })
      .onConflictDoNothing({
        target: [
          paidAdCampaignMappings.accountId,
          paidAdCampaignMappings.externalCampaignId,
        ],
      })
      .returning({ id: paidAdCampaignMappings.id });

    if (!rows[0]) return { kind: "DUPLICATE_EXTERNAL_CAMPAIGN" };

    const [mapping] = await this.database
      .select(mappingSelection)
      .from(paidAdCampaignMappings)
      .innerJoin(
        paidAdAccounts,
        eq(paidAdCampaignMappings.accountId, paidAdAccounts.id),
      )
      .leftJoin(
        marketingCampaigns,
        eq(paidAdCampaignMappings.marketingCampaignId, marketingCampaigns.id),
      )
      .where(
        and(
          eq(paidAdCampaignMappings.id, rows[0].id),
          eq(paidAdCampaignMappings.storeId, input.storeId),
        ),
      )
      .limit(1);

    if (!mapping) return { kind: "ACCOUNT_OR_CAMPAIGN_NOT_FOUND" };
    return { kind: "CREATED", mapping };
  }

  async upsertDailyMetric(
    input: Parameters<AdminPaidAdsRepository["upsertDailyMetric"]>[0],
  ): Promise<UpsertPaidAdMetricResult> {
    const [mapping] = await this.database
      .select({ id: paidAdCampaignMappings.id })
      .from(paidAdCampaignMappings)
      .where(
        and(
          eq(paidAdCampaignMappings.id, input.mappingId),
          eq(paidAdCampaignMappings.storeId, input.storeId),
        ),
      )
      .limit(1);

    if (!mapping) return { kind: "MAPPING_NOT_FOUND" };

    const rows = await this.database
      .insert(paidAdDailyMetrics)
      .values({
        storeId: input.storeId,
        mappingId: input.mappingId,
        metricDate: input.metricDate,
        spendMinor: input.spendMinor,
        impressions: input.impressions,
        clicks: input.clicks,
        ingestionSource: "MANUAL",
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
          ingestionSource: "MANUAL",
          revision: sql`${paidAdDailyMetrics.revision} + 1`,
          updatedByAdminUserId: input.updatedByAdminUserId,
          updatedByAdminEmail: input.updatedByAdminEmail,
          updatedAt: new Date(),
        },
      })
      .returning({ id: paidAdDailyMetrics.id });

    const [metric] = await this.database
      .select(metricSelection)
      .from(paidAdDailyMetrics)
      .innerJoin(
        paidAdCampaignMappings,
        eq(paidAdDailyMetrics.mappingId, paidAdCampaignMappings.id),
      )
      .innerJoin(
        paidAdAccounts,
        eq(paidAdCampaignMappings.accountId, paidAdAccounts.id),
      )
      .leftJoin(
        marketingCampaigns,
        eq(paidAdCampaignMappings.marketingCampaignId, marketingCampaigns.id),
      )
      .where(
        and(
          eq(paidAdDailyMetrics.id, rows[0]!.id),
          eq(paidAdDailyMetrics.storeId, input.storeId),
        ),
      )
      .limit(1);

    if (!metric) return { kind: "MAPPING_NOT_FOUND" };
    return { kind: "UPSERTED", metric };
  }
}
