import { eq, sql } from "drizzle-orm";
import type {
  StoreFinancialOrderRow,
  StoreFinancialSpendRow,
  StoreFinancialSummaryRepository,
} from "../admin/store-financial-summary-repository";
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

export class DrizzleAdminStoreFinancialSummaryRepository
  implements StoreFinancialSummaryRepository
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
      status: StoreFinancialOrderRow["status"];
      currency: string;
      revenueMinor: number | string;
      fulfillmentCostMinor: number | string | null;
      itemCount: number | string;
      knownItemCostCount: number | string;
      knownCogsMinor: number | string;
    }>`
      select
        o.id as "orderId",
        o.status,
        o.currency,
        o.total_minor as "revenueMinor",
        o.fulfillment_cost_minor as "fulfillmentCostMinor",
        count(oi.id)::int as "itemCount",
        count(oi.total_cost_minor)::int as "knownItemCostCount",
        coalesce(sum(oi.total_cost_minor), 0)::bigint as "knownCogsMinor"
      from orders o
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
        o.fulfillment_cost_minor
      order by o.created_at asc, o.id asc
    `)) as unknown as Array<{
      orderId: string;
      status: StoreFinancialOrderRow["status"];
      currency: string;
      revenueMinor: number | string;
      fulfillmentCostMinor: number | string | null;
      itemCount: number | string;
      knownItemCostCount: number | string;
      knownCogsMinor: number | string;
    }>;

    const spendRows = (await this.database.execute(sql<{
      accountId: string;
      provider: StoreFinancialSpendRow["provider"];
      accountCurrency: string;
      spendMinor: number | string;
    }>`
      select
        paa.id as "accountId",
        paa.provider,
        paa.currency as "accountCurrency",
        coalesce(sum(
          case when padm.id is not null and ${metricWindow}
            then padm.spend_minor else 0 end
        ), 0)::bigint as "spendMinor"
      from paid_ad_accounts paa
      inner join paid_ad_campaign_mappings pacm
        on pacm.account_id = paa.id
       and pacm.store_id = paa.store_id
      left join paid_ad_daily_metrics padm
        on padm.mapping_id = pacm.id
       and padm.store_id = paa.store_id
      where paa.store_id = ${storeId}
      group by
        paa.id,
        paa.provider,
        paa.currency
      order by paa.created_at asc, paa.id asc
    `)) as unknown as Array<{
      accountId: string;
      provider: StoreFinancialSpendRow["provider"];
      accountCurrency: string;
      spendMinor: number | string;
    }>;

    return {
      storeCurrency: store.currency,
      orders: orderRows.map(
        (row): StoreFinancialOrderRow => ({
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
        }),
      ),
      spend: spendRows.map(
        (row): StoreFinancialSpendRow => ({
          accountId: row.accountId,
          provider: row.provider,
          accountCurrency: row.accountCurrency,
          spendMinor: nonnegativeNumber(row.spendMinor),
        }),
      ),
    };
  }
}
