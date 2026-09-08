import { eq, sql } from "drizzle-orm";
import type { PaidAdProvider } from "../marketing/paid-ads";
import type {
  ChannelFinancialOrderRow,
  ChannelFinancialSpendRow,
  ChannelFinancialSummaryRepository,
} from "../admin/channel-financial-summary-repository";
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

function normalizeProviders(value: unknown): PaidAdProvider[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.filter(
        (provider): provider is PaidAdProvider =>
          provider === "META" || provider === "GOOGLE",
      ),
    ),
  ).sort();
}

export class DrizzleAdminChannelFinancialSummaryRepository
  implements ChannelFinancialSummaryRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getSummary(
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

    const orderWindow = timestampWindowSql(startAt, endAt, "o.created_at");
    const metricWindow = metricDateWindowSql(
      startAt,
      endAt,
      "padm.metric_date",
      "paa.timezone",
    );

    const orderRows = (await this.database.execute(sql<{
      orderId: string;
      status: ChannelFinancialOrderRow["status"];
      currency: string;
      revenueMinor: number | string;
      fulfillmentCostMinor: number | string | null;
      itemCount: number | string;
      knownItemCostCount: number | string;
      knownCogsMinor: number | string;
      source: string | null;
      medium: string | null;
      fbclid: string | null;
      gclid: string | null;
      mappedProviders: unknown;
    }>`
      select
        o.id as "orderId",
        o.status,
        o.currency,
        o.total_minor as "revenueMinor",
        o.fulfillment_cost_minor as "fulfillmentCostMinor",
        count(oi.id)::int as "itemCount",
        count(oi.total_cost_minor)::int as "knownItemCostCount",
        coalesce(sum(oi.total_cost_minor), 0)::bigint as "knownCogsMinor",
        oa.source,
        oa.medium,
        oa.fbclid,
        oa.gclid,
        coalesce(
          (
            select array_agg(
              distinct paa.provider::text
              order by paa.provider::text
            )
            from paid_ad_campaign_mappings pacm
            inner join paid_ad_accounts paa
              on paa.id = pacm.account_id
             and paa.store_id = pacm.store_id
            where pacm.store_id = o.store_id
              and pacm.marketing_campaign_id = oa.last_touch_campaign_id
          ),
          array[]::text[]
        ) as "mappedProviders"
      from orders o
      left join order_attributions oa
        on oa.order_id = o.id
       and oa.store_id = o.store_id
      left join order_items oi
        on oi.order_id = o.id
      where o.store_id = ${storeId}
        and o.status in ('DELIVERED', 'CANCELLED', 'RETURNED')
        and ${orderWindow}
      group by
        o.id,
        o.status,
        o.currency,
        o.total_minor,
        o.fulfillment_cost_minor,
        oa.source,
        oa.medium,
        oa.fbclid,
        oa.gclid,
        oa.last_touch_campaign_id
      order by o.created_at asc, o.id asc
    `)) as unknown as Array<{
      orderId: string;
      status: ChannelFinancialOrderRow["status"];
      currency: string;
      revenueMinor: number | string;
      fulfillmentCostMinor: number | string | null;
      itemCount: number | string;
      knownItemCostCount: number | string;
      knownCogsMinor: number | string;
      source: string | null;
      medium: string | null;
      fbclid: string | null;
      gclid: string | null;
      mappedProviders: unknown;
    }>;

    const spendRows = (await this.database.execute(sql<{
      provider: ChannelFinancialSpendRow["provider"];
      accountCurrency: string;
      spendMinor: number | string;
    }>`
      select
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
      left join paid_ad_daily_metrics padm
        on padm.mapping_id = pacm.id
       and padm.store_id = pacm.store_id
      where pacm.store_id = ${storeId}
      group by
        paa.provider,
        paa.currency
      order by
        paa.provider asc,
        paa.currency asc
    `)) as unknown as Array<{
      provider: ChannelFinancialSpendRow["provider"];
      accountCurrency: string;
      spendMinor: number | string;
    }>;

    return {
      storeCurrency: store.currency,
      orders: orderRows.map(
        (row): ChannelFinancialOrderRow => ({
          orderId: row.orderId,
          status: row.status,
          currency: row.currency,
          revenueMinor: nonnegativeNumber(row.revenueMinor),
          fulfillmentCostMinor: nullableNonnegativeNumber(
            row.fulfillmentCostMinor,
          ),
          itemCount: nonnegativeNumber(row.itemCount),
          knownItemCostCount: nonnegativeNumber(row.knownItemCostCount),
          knownCogsMinor: nonnegativeNumber(row.knownCogsMinor),
          source: row.source?.trim() || "direct",
          medium: row.medium,
          fbclid: row.fbclid,
          gclid: row.gclid,
          mappedProviders: normalizeProviders(row.mappedProviders),
        }),
      ),
      spend: spendRows.map(
        (row): ChannelFinancialSpendRow => ({
          provider: row.provider,
          accountCurrency: row.accountCurrency,
          spendMinor: nonnegativeNumber(row.spendMinor),
        }),
      ),
    };
  }
}
