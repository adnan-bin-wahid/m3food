import { and, eq, gte, lte, sql } from "drizzle-orm";
import type {
  MarketingAnalyticsRepository,
  MarketingAnalyticsStore,
  MarketingSourceRow,
  MarketingVisitorRow,
} from "../admin/marketing-analytics-repository";
import { getDatabase, type Database } from "./index";
import {
  commerceEvents,
  orders,
  stores,
} from "./schema";

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function rawRows<T>(value: unknown): T[] {
  return value as T[];
}

function windowSql(startAt: Date | null, endAt: Date, column: string) {
  const startIso = startAt?.toISOString() ?? null;
  const endIso = endAt.toISOString();
  return startIso
    ? sql.raw(`${column} >= '${startIso.replaceAll("'", "''")}'::timestamptz and ${column} <= '${endIso.replaceAll("'", "''")}'::timestamptz`)
    : sql.raw(`${column} <= '${endIso.replaceAll("'", "''")}'::timestamptz`);
}

function mapSource(row: MarketingSourceRow): MarketingSourceRow {
  return {
    ...row,
    visitors: number(row.visitors),
    sessions: number(row.sessions),
    productViews: number(row.productViews),
    addToCarts: number(row.addToCarts),
    checkouts: number(row.checkouts),
    orders: number(row.orders),
    revenueMinor: number(row.revenueMinor),
  };
}

export class DrizzleAdminMarketingAnalyticsRepository implements MarketingAnalyticsRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  private async getStore(storeId: string): Promise<MarketingAnalyticsStore | null> {
    const [store] = await this.database
      .select({ name: stores.name, slug: stores.slug, currency: stores.currency, timezone: stores.timezone })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.status, "ACTIVE")))
      .limit(1);
    return store ?? null;
  }

  async getSources(storeId: string, startAt: Date | null, endAt: Date) {
    const store = await this.getStore(storeId);
    if (!store) return null;
    const sessionWindow = windowSql(startAt, endAt, "vs.started_at");
    const eventWindow = windowSql(startAt, endAt, "ce.occurred_at");
    const orderWindow = windowSql(startAt, endAt, "o.created_at");

    const rows = rawRows<MarketingSourceRow>(await this.database.execute(sql<MarketingSourceRow>`
      with session_base as (
        select
          vs.id as session_id,
          vs.visitor_id,
          case
            when nullif(vs.fbclid, '') is not null then 'meta'
            when nullif(trim(vs.utm_source), '') is not null then lower(trim(vs.utm_source))
            else 'direct'
          end as source,
          nullif(trim(vs.utm_medium), '') as medium
        from visitor_sessions vs
        where vs.store_id = ${storeId} and ${sessionWindow}
      ),
      event_stats as (
        select
          ce.session_id,
          count(*) filter (where ce.event_name = 'VIEW_CONTENT')::int as product_views,
          count(*) filter (where ce.event_name = 'ADD_TO_CART')::int as add_to_carts,
          count(*) filter (where ce.event_name = 'BEGIN_CHECKOUT')::int as checkouts
        from commerce_events ce
        where ce.store_id = ${storeId} and ${eventWindow}
        group by ce.session_id
      ),
      order_stats as (
        select
          o.session_id,
          count(*)::int as orders,
          coalesce(sum(o.total_minor) filter (where o.status not in ('CANCELLED','RETURNED')), 0)::bigint as revenue_minor
        from orders o
        where o.store_id = ${storeId} and o.session_id is not null and ${orderWindow}
        group by o.session_id
      )
      select
        sb.source,
        min(sb.medium) as medium,
        count(distinct sb.visitor_id)::int as visitors,
        count(*)::int as sessions,
        coalesce(sum(es.product_views), 0)::int as "productViews",
        coalesce(sum(es.add_to_carts), 0)::int as "addToCarts",
        coalesce(sum(es.checkouts), 0)::int as checkouts,
        coalesce(sum(os.orders), 0)::int as orders,
        coalesce(sum(os.revenue_minor), 0)::bigint as "revenueMinor"
      from session_base sb
      left join event_stats es on es.session_id = sb.session_id
      left join order_stats os on os.session_id = sb.session_id
      group by sb.source
      order by orders desc, visitors desc, sb.source asc
    `));

    return { store, rows: rows.map(mapSource) };
  }

  async getOverview(storeId: string, startAt: Date | null, endAt: Date) {
    const store = await this.getStore(storeId);
    if (!store) return null;
    const eventConditions = [eq(commerceEvents.storeId, storeId), lte(commerceEvents.occurredAt, endAt)];
    const orderConditions = [eq(orders.storeId, storeId), lte(orders.createdAt, endAt)];
    if (startAt) {
      eventConditions.push(gte(commerceEvents.occurredAt, startAt));
      orderConditions.push(gte(orders.createdAt, startAt));
    }

    const [eventRows, orderRows, statusRows, sourceResult] = await Promise.all([
      this.database
        .select({
          visitors: sql<number>`count(distinct ${commerceEvents.visitorId})::int`,
          pageViews: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'PAGE_VIEW')::int`,
          productViews: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'VIEW_CONTENT')::int`,
          addToCarts: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'ADD_TO_CART')::int`,
          checkouts: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'BEGIN_CHECKOUT')::int`,
          purchases: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'PURCHASE')::int`,
        })
        .from(commerceEvents)
        .where(and(...eventConditions)),
      this.database
        .select({
          orders: sql<number>`count(*)::int`,
          grossRevenueMinor: sql<number | string>`coalesce(sum(${orders.totalMinor}) filter (where ${orders.status} not in ('CANCELLED','RETURNED')), 0)`,
          deliveredOrders: sql<number>`count(*) filter (where ${orders.status} = 'DELIVERED')::int`,
          deliveredRevenueMinor: sql<number | string>`coalesce(sum(${orders.totalMinor}) filter (where ${orders.status} = 'DELIVERED'), 0)`,
        })
        .from(orders)
        .where(and(...orderConditions)),
      this.database
        .select({
          status: orders.status,
          orders: sql<number>`count(*)::int`,
          totalMinor: sql<number | string>`coalesce(sum(${orders.totalMinor}), 0)`,
        })
        .from(orders)
        .where(and(...orderConditions))
        .groupBy(orders.status),
      this.getSources(storeId, startAt, endAt),
    ]);

    const cutoffAt = new Date(endAt.getTime() - 30 * 60 * 1000);
    const startIso = startAt?.toISOString() ?? null;
    const cutoffIso = cutoffAt.toISOString();
    const recoverableRows = await this.database.execute(sql<{ count: number | string }>`
      select count(*)::int as count
      from checkout_intents ci
      where ci.store_id = ${storeId}
        and ci.last_activity_at <= ${cutoffIso}
        ${startIso ? sql`and ci.last_activity_at >= ${startIso}` : sql``}
        and (
          (ci.email_marketing_allowed = true and nullif(ci.email, '') is not null)
          or (ci.sms_marketing_allowed = true and nullif(ci.phone, '') is not null)
          or (ci.whatsapp_marketing_allowed = true and nullif(ci.phone, '') is not null)
        )
        and not exists (
          select 1 from orders o
          where o.store_id = ${storeId}
            and o.session_id = ci.session_id
        )
    `);

    const events = eventRows[0] ?? { visitors: 0, pageViews: 0, productViews: 0, addToCarts: 0, checkouts: 0, purchases: 0 };
    const orderSummary = orderRows[0] ?? { orders: 0, grossRevenueMinor: 0, deliveredOrders: 0, deliveredRevenueMinor: 0 };
    return {
      store,
      events: {
        visitors: number(events.visitors),
        pageViews: number(events.pageViews),
        productViews: number(events.productViews),
        addToCarts: number(events.addToCarts),
        checkouts: number(events.checkouts),
        purchases: number(events.purchases),
      },
      orders: {
        orders: number(orderSummary.orders),
        grossRevenueMinor: number(orderSummary.grossRevenueMinor),
        deliveredOrders: number(orderSummary.deliveredOrders),
        deliveredRevenueMinor: number(orderSummary.deliveredRevenueMinor),
      },
      statuses: statusRows.map((row) => ({ status: row.status, orders: number(row.orders), totalMinor: number(row.totalMinor) })),
      sources: sourceResult?.rows ?? [],
      recoverableCheckoutContacts: number(recoverableRows[0]?.count),
    };
  }

  async getVisitors(storeId: string, startAt: Date | null, endAt: Date, limit: number) {
    const store = await this.getStore(storeId);
    if (!store) return null;
    const sessionWindow = windowSql(startAt, endAt, "vs.started_at");
    const eventWindow = windowSql(startAt, endAt, "ce.occurred_at");
    const orderWindow = windowSql(startAt, endAt, "o.created_at");
    const rows = rawRows<MarketingVisitorRow>(await this.database.execute(sql<MarketingVisitorRow>`
      with event_stats as (
        select ce.session_id,
          count(*) filter (where ce.event_name = 'PAGE_VIEW')::int as page_views,
          count(*) filter (where ce.event_name = 'VIEW_CONTENT')::int as product_views,
          count(*) filter (where ce.event_name = 'ADD_TO_CART')::int as add_to_carts,
          count(*) filter (where ce.event_name = 'BEGIN_CHECKOUT')::int as checkouts,
          count(*) filter (where ce.event_name = 'PURCHASE')::int as purchases
        from commerce_events ce
        where ce.store_id = ${storeId} and ${eventWindow}
        group by ce.session_id
      ),
      order_stats as (
        select o.session_id,
          count(*)::int as orders,
          coalesce(sum(o.total_minor) filter (where o.status not in ('CANCELLED','RETURNED')), 0)::bigint as revenue_minor
        from orders o
        where o.store_id = ${storeId} and o.session_id is not null and ${orderWindow}
        group by o.session_id
      )
      select
        v.visitor_key as "visitorKey",
        vs.session_key as "sessionKey",
        case
          when nullif(vs.fbclid, '') is not null then 'meta'
          when nullif(trim(vs.utm_source), '') is not null then lower(trim(vs.utm_source))
          else 'direct'
        end as source,
        nullif(trim(vs.utm_campaign), '') as campaign,
        v.first_seen_at as "firstSeenAt",
        vs.last_seen_at as "lastSeenAt",
        coalesce(es.page_views, 0)::int as "pageViews",
        coalesce(es.product_views, 0)::int as "productViews",
        coalesce(es.add_to_carts, 0)::int as "addToCarts",
        coalesce(es.checkouts, 0)::int as checkouts,
        coalesce(es.purchases, 0)::int as purchases,
        coalesce(os.orders, 0)::int as orders,
        coalesce(os.revenue_minor, 0)::bigint as "revenueMinor"
      from visitor_sessions vs
      inner join visitors v on v.id = vs.visitor_id and v.store_id = ${storeId}
      left join event_stats es on es.session_id = vs.id
      left join order_stats os on os.session_id = vs.id
      where vs.store_id = ${storeId} and ${sessionWindow}
      order by vs.last_seen_at desc, vs.id desc
      limit ${Math.max(1, Math.min(250, limit))}
    `));
    return {
      store,
      rows: rows.map((row) => ({
        ...row,
        pageViews: number(row.pageViews),
        productViews: number(row.productViews),
        addToCarts: number(row.addToCarts),
        checkouts: number(row.checkouts),
        purchases: number(row.purchases),
        orders: number(row.orders),
        revenueMinor: number(row.revenueMinor),
      })),
    };
  }
}
