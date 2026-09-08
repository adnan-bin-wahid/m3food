import { eq, sql } from "drizzle-orm";
import type {
  CampaignDeliveredOrderRow,
  CampaignProfitabilityDeliveryRow,
  CampaignProfitabilityRepository,
} from "../admin/campaign-profitability-repository";
import { getDatabase, type Database } from "./index";
import { stores } from "./schema";

function nonnegativeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function nullableNonnegativeNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  return nonnegativeNumber(value);
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

  const startDate = startIso ? providerLocalDate(startIso) : null;
  const endDate = providerLocalDate(endIso);

  return startDate
    ? sql.raw(`${column} >= ${startDate} and ${column} <= ${endDate}`)
    : sql.raw(`${column} <= ${endDate}`);
}

export class DrizzleAdminCampaignProfitabilityRepository
  implements CampaignProfitabilityRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getProfitability(
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
    const orderWindow = timestampWindowSql(startAt, endAt, "o.created_at");

    const deliveryRows = (await this.database.execute(sql<{
      marketingCampaignId: string;
      campaignName: string;
      campaignKey: string;
      mappingId: string;
      provider: CampaignProfitabilityDeliveryRow["provider"];
      accountCurrency: string;
      spendMinor: number | string;
    }>`
      select
        pacm.marketing_campaign_id as "marketingCampaignId",
        mc.name as "campaignName",
        mc.campaign_key as "campaignKey",
        pacm.id as "mappingId",
        paa.provider,
        paa.currency as "accountCurrency",
        coalesce(sum(
          case when padm.id is not null and ${metricWindow}
            then padm.spend_minor else 0 end
        ), 0)::bigint as "spendMinor"
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
        paa.currency
      order by mc.name asc, pacm.created_at asc
    `)) as unknown as Array<{
      marketingCampaignId: string;
      campaignName: string;
      campaignKey: string;
      mappingId: string;
      provider: CampaignProfitabilityDeliveryRow["provider"];
      accountCurrency: string;
      spendMinor: number | string;
    }>;

    const deliveredRows = (await this.database.execute(sql<{
      campaignId: string;
      campaignName: string;
      campaignKey: string;
      orderId: string;
      currency: string;
      revenueMinor: number | string;
      fulfillmentCostMinor: number | string | null;
      itemCount: number | string;
      knownItemCostCount: number | string;
      knownCogsMinor: number | string;
    }>`
      select
        oa.last_touch_campaign_id as "campaignId",
        mc.name as "campaignName",
        mc.campaign_key as "campaignKey",
        o.id as "orderId",
        o.currency,
        o.total_minor as "revenueMinor",
        o.fulfillment_cost_minor as "fulfillmentCostMinor",
        count(oi.id)::int as "itemCount",
        count(oi.total_cost_minor)::int as "knownItemCostCount",
        coalesce(sum(oi.total_cost_minor), 0)::bigint as "knownCogsMinor"
      from order_attributions oa
      inner join orders o
        on o.id = oa.order_id
       and o.store_id = oa.store_id
      inner join marketing_campaigns mc
        on mc.id = oa.last_touch_campaign_id
       and mc.store_id = oa.store_id
      left join order_items oi
        on oi.order_id = o.id
      where oa.store_id = ${storeId}
        and oa.last_touch_campaign_id is not null
        and o.status = 'DELIVERED'
        and ${orderWindow}
        and exists (
          select 1
          from paid_ad_campaign_mappings pacm
          where pacm.store_id = oa.store_id
            and pacm.marketing_campaign_id = oa.last_touch_campaign_id
        )
      group by
        oa.last_touch_campaign_id,
        mc.name,
        mc.campaign_key,
        o.id,
        o.currency,
        o.total_minor,
        o.fulfillment_cost_minor
      order by mc.name asc, o.created_at asc, o.id asc
    `)) as unknown as Array<{
      campaignId: string;
      campaignName: string;
      campaignKey: string;
      orderId: string;
      currency: string;
      revenueMinor: number | string;
      fulfillmentCostMinor: number | string | null;
      itemCount: number | string;
      knownItemCostCount: number | string;
      knownCogsMinor: number | string;
    }>;

    return {
      storeCurrency: store.currency,
      delivery: deliveryRows.map(
        (row): CampaignProfitabilityDeliveryRow => ({
          marketingCampaignId: row.marketingCampaignId,
          campaignName: row.campaignName,
          campaignKey: row.campaignKey,
          mappingId: row.mappingId,
          provider: row.provider,
          accountCurrency: row.accountCurrency,
          spendMinor: nonnegativeNumber(row.spendMinor),
        }),
      ),
      deliveredOrders: deliveredRows.map(
        (row): CampaignDeliveredOrderRow => ({
          campaignId: row.campaignId,
          campaignName: row.campaignName,
          campaignKey: row.campaignKey,
          orderId: row.orderId,
          currency: row.currency,
          revenueMinor: nonnegativeNumber(row.revenueMinor),
          fulfillmentCostMinor: nullableNonnegativeNumber(
            row.fulfillmentCostMinor,
          ),
          itemCount: nonnegativeNumber(row.itemCount),
          knownItemCostCount: nonnegativeNumber(row.knownItemCostCount),
          knownCogsMinor: nonnegativeNumber(row.knownCogsMinor),
        }),
      ),
    };
  }
}
