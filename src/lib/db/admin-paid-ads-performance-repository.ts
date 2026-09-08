import { eq, sql } from "drizzle-orm";
import type {
  PaidAdsPerformanceRepository,
  PaidDeliveryMappingRow,
  PaidFirstPartyOutcomeRow,
} from "../admin/paid-ads-performance-repository";
import { getDatabase, type Database } from "./index";
import { stores } from "./schema";

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function timestampWindowSql(
  startAt: Date | null,
  endAt: Date,
  column: string,
) {
  const startIso = startAt?.toISOString() ?? null;
  const endIso = endAt.toISOString();
  return startIso
    ? sql.raw(
        `${column} >= '${startIso.replaceAll("'", "''")}'::timestamptz and ${column} <= '${endIso.replaceAll("'", "''")}'::timestamptz`,
      )
    : sql.raw(
        `${column} <= '${endIso.replaceAll("'", "''")}'::timestamptz`,
      );
}

function metricDateWindowSql(
  startAt: Date | null,
  endAt: Date,
  column: string,
  timezoneColumn: string,
) {
  const startIso = startAt?.toISOString() ?? null;
  const endIso = endAt.toISOString();

  const providerLocalDate = (iso: string) =>
    `(timezone(${timezoneColumn}, '${iso.replaceAll("'", "''")}'::timestamptz))::date`;

  const startDate = startIso
    ? providerLocalDate(startIso)
    : null;
  const endDate = providerLocalDate(endIso);

  return startDate
    ? sql.raw(
        `${column} >= ${startDate} and ${column} <= ${endDate}`,
      )
    : sql.raw(
        `${column} <= ${endDate}`,
      );
}

export class DrizzleAdminPaidAdsPerformanceRepository
  implements PaidAdsPerformanceRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getPerformance(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ) {
    const [store] = await this.database
      .select({ currency: stores.currency })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    if (!store) return null;

    const metricWindow = metricDateWindowSql(
      startAt,
      endAt,
      "padm.metric_date",
      "paa.timezone",
    );
    const sessionWindow = timestampWindowSql(
      startAt,
      endAt,
      "vs.started_at",
    );
    const orderWindow = timestampWindowSql(
      startAt,
      endAt,
      "o.created_at",
    );

    const deliveryRows = (await this.database.execute(sql<{
      marketingCampaignId: string;
      campaignName: string;
      campaignKey: string;
      mappingId: string;
      provider: PaidDeliveryMappingRow["provider"];
      accountName: string;
      accountCurrency: string;
      externalCampaignId: string;
      externalCampaignName: string;
      spendMinor: number | string;
      impressions: number | string;
      clicks: number | string;
    }>`
      select
        pacm.marketing_campaign_id as "marketingCampaignId",
        mc.name as "campaignName",
        mc.campaign_key as "campaignKey",
        pacm.id as "mappingId",
        paa.provider,
        paa.name as "accountName",
        paa.currency as "accountCurrency",
        pacm.external_campaign_id as "externalCampaignId",
        pacm.external_campaign_name as "externalCampaignName",
        coalesce(sum(
          case when padm.id is not null and ${metricWindow}
            then padm.spend_minor else 0 end
        ), 0)::bigint as "spendMinor",
        coalesce(sum(
          case when padm.id is not null and ${metricWindow}
            then padm.impressions else 0 end
        ), 0)::bigint as impressions,
        coalesce(sum(
          case when padm.id is not null and ${metricWindow}
            then padm.clicks else 0 end
        ), 0)::bigint as clicks
      from paid_ad_campaign_mappings pacm
      inner join paid_ad_accounts paa
        on paa.id = pacm.account_id
       and paa.store_id = pacm.store_id
      inner join marketing_campaigns mc
        on mc.id = pacm.marketing_campaign_id
       and mc.store_id = pacm.store_id
      left join paid_ad_daily_metrics padm
        on padm.mapping_id = pacm.id
       and padm.store_id = pacm.store_id
      where pacm.store_id = ${storeId}
      group by
        pacm.marketing_campaign_id,
        mc.name,
        mc.campaign_key,
        pacm.id,
        paa.provider,
        paa.name,
        paa.currency,
        pacm.external_campaign_id,
        pacm.external_campaign_name
      order by mc.name asc, pacm.created_at asc
    `)) as unknown as Array<{
      marketingCampaignId: string;
      campaignName: string;
      campaignKey: string;
      mappingId: string;
      provider: PaidDeliveryMappingRow["provider"];
      accountName: string;
      accountCurrency: string;
      externalCampaignId: string;
      externalCampaignName: string;
      spendMinor: number | string;
      impressions: number | string;
      clicks: number | string;
    }>;

    const outcomeRows = (await this.database.execute(sql<{
      campaignId: string;
      campaignName: string;
      campaignKey: string;
      visitors: number | string;
      sessions: number | string;
      firstTouchOrders: number | string;
      placedOrders: number | string;
      placedRevenueMinor: number | string;
      confirmedReachedOrders: number | string;
      confirmedReachedRevenueMinor: number | string;
      deliveredReachedOrders: number | string;
      deliveredReachedRevenueMinor: number | string;
    }>`
      select
        mc.id as "campaignId",
        mc.name as "campaignName",
        mc.campaign_key as "campaignKey",
        (
          select count(distinct vs.visitor_id)::int
          from visitor_sessions vs
          where vs.store_id = mc.store_id
            and vs.campaign_id = mc.id
            and ${sessionWindow}
        ) as visitors,
        (
          select count(*)::int
          from visitor_sessions vs
          where vs.store_id = mc.store_id
            and vs.campaign_id = mc.id
            and ${sessionWindow}
        ) as sessions,
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.first_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "firstTouchOrders",
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "placedOrders",
        (
          select coalesce(sum(o.total_minor), 0)::bigint
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "placedRevenueMinor",
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
            and exists (
              select 1
              from order_status_history osh
              where osh.order_id = o.id
                and osh.to_status = 'CONFIRMED'
            )
        ) as "confirmedReachedOrders",
        (
          select coalesce(sum(o.total_minor), 0)::bigint
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
            and exists (
              select 1
              from order_status_history osh
              where osh.order_id = o.id
                and osh.to_status = 'CONFIRMED'
            )
        ) as "confirmedReachedRevenueMinor",
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
            and exists (
              select 1
              from order_status_history osh
              where osh.order_id = o.id
                and osh.to_status = 'DELIVERED'
            )
        ) as "deliveredReachedOrders",
        (
          select coalesce(sum(o.total_minor), 0)::bigint
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
            and exists (
              select 1
              from order_status_history osh
              where osh.order_id = o.id
                and osh.to_status = 'DELIVERED'
            )
        ) as "deliveredReachedRevenueMinor"
      from marketing_campaigns mc
      where mc.store_id = ${storeId}
        and exists (
          select 1
          from paid_ad_campaign_mappings pacm
          where pacm.store_id = mc.store_id
            and pacm.marketing_campaign_id = mc.id
        )
      order by mc.created_at desc
    `)) as unknown as Array<{
      campaignId: string;
      campaignName: string;
      campaignKey: string;
      visitors: number | string;
      sessions: number | string;
      firstTouchOrders: number | string;
      placedOrders: number | string;
      placedRevenueMinor: number | string;
      confirmedReachedOrders: number | string;
      confirmedReachedRevenueMinor: number | string;
      deliveredReachedOrders: number | string;
      deliveredReachedRevenueMinor: number | string;
    }>;

    return {
      storeCurrency: store.currency,
      delivery: deliveryRows.map(
        (row): PaidDeliveryMappingRow => ({
          marketingCampaignId: row.marketingCampaignId,
          campaignName: row.campaignName,
          campaignKey: row.campaignKey,
          mappingId: row.mappingId,
          provider: row.provider,
          accountName: row.accountName,
          accountCurrency: row.accountCurrency,
          externalCampaignId: row.externalCampaignId,
          externalCampaignName: row.externalCampaignName,
          spendMinor: number(row.spendMinor),
          impressions: number(row.impressions),
          clicks: number(row.clicks),
        }),
      ),
      outcomes: outcomeRows.map(
        (row): PaidFirstPartyOutcomeRow => ({
          campaignId: row.campaignId,
          campaignName: row.campaignName,
          campaignKey: row.campaignKey,
          storeCurrency: store.currency,
          visitors: number(row.visitors),
          sessions: number(row.sessions),
          firstTouchOrders: number(row.firstTouchOrders),
          placedOrders: number(row.placedOrders),
          placedRevenueMinor: number(row.placedRevenueMinor),
          confirmedReachedOrders: number(row.confirmedReachedOrders),
          confirmedReachedRevenueMinor: number(
            row.confirmedReachedRevenueMinor,
          ),
          deliveredReachedOrders: number(row.deliveredReachedOrders),
          deliveredReachedRevenueMinor: number(
            row.deliveredReachedRevenueMinor,
          ),
        }),
      ),
    };
  }
}
