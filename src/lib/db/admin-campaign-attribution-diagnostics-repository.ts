import { sql } from "drizzle-orm";
import type {
  CampaignAttributionDetailRow,
  CampaignAttributionDiagnosticsRepository,
  CampaignDiagnosticOrderRow,
  UnregisteredCampaignTrafficRow,
} from "../admin/campaign-attribution-diagnostics-repository";
import { getDatabase, type Database } from "./index";

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function windowSql(startAt: Date | null, endAt: Date, column: string) {
  const startIso = startAt?.toISOString() ?? null;
  const endIso = endAt.toISOString();
  return startIso
    ? sql.raw(`${column} >= '${startIso.replaceAll("'", "''")}'::timestamptz and ${column} <= '${endIso.replaceAll("'", "''")}'::timestamptz`)
    : sql.raw(`${column} <= '${endIso.replaceAll("'", "''")}'::timestamptz`);
}

export class DrizzleAdminCampaignAttributionDiagnosticsRepository
  implements CampaignAttributionDiagnosticsRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getUnregisteredCampaignTraffic(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
    limit: number,
  ) {
    const sessionWindow = windowSql(startAt, endAt, "vs.started_at");
    const rows = (await this.database.execute(sql<{
      rawCampaign: string;
      source: string | null;
      medium: string | null;
      sessions: number | string;
      visitors: number | string;
      lastSeenAt: Date;
    }>`
      select
        min(trim(vs.utm_campaign)) as "rawCampaign",
        min(nullif(trim(vs.utm_source), '')) as source,
        min(nullif(trim(vs.utm_medium), '')) as medium,
        count(*)::int as sessions,
        count(distinct vs.visitor_id)::int as visitors,
        max(vs.last_seen_at) as "lastSeenAt"
      from visitor_sessions vs
      where vs.store_id = ${storeId}
        and vs.campaign_id is null
        and nullif(trim(vs.utm_campaign), '') is not null
        and ${sessionWindow}
      group by lower(trim(vs.utm_campaign))
      order by sessions desc, "lastSeenAt" desc
      limit ${Math.max(1, Math.min(100, limit))}
    `)) as unknown as Array<{
      rawCampaign: string;
      source: string | null;
      medium: string | null;
      sessions: number | string;
      visitors: number | string;
      lastSeenAt: Date;
    }>;

    return rows.map((row): UnregisteredCampaignTrafficRow => ({
      rawCampaign: row.rawCampaign,
      source: row.source,
      medium: row.medium,
      sessions: number(row.sessions),
      visitors: number(row.visitors),
      lastSeenAt: new Date(row.lastSeenAt),
    }));
  }

  async getCampaignAttributionDetail(
    storeId: string,
    campaignId: string,
    startAt: Date | null,
    endAt: Date,
    orderLimit: number,
  ) {
    const sessionWindow = windowSql(startAt, endAt, "vs.started_at");
    const orderWindow = windowSql(startAt, endAt, "o.created_at");

    const summaryRows = (await this.database.execute(sql<{
      id: string;
      name: string;
      campaignKey: string;
      source: string;
      medium: string;
      content: string | null;
      term: string | null;
      landingUrl: string | null;
      notes: string | null;
      status: CampaignAttributionDetailRow["campaign"]["status"];
      currency: string;
      timezone: string;
      sessions: number | string;
      visitors: number | string;
      firstTouchOrders: number | string;
      lastTouchOrders: number | string;
      lastTouchRevenueMinor: number | string;
      confirmedReachedOrders: number | string;
      deliveredReachedOrders: number | string;
    }>`
      select
        mc.id,
        mc.name,
        mc.campaign_key as "campaignKey",
        mc.source,
        mc.medium,
        mc.content,
        mc.term,
        mc.landing_url as "landingUrl",
        mc.notes,
        mc.status,
        s.currency,
        s.timezone,
        (
          select count(*)::int
          from visitor_sessions vs
          where vs.store_id = mc.store_id
            and vs.campaign_id = mc.id
            and ${sessionWindow}
        ) as sessions,
        (
          select count(distinct vs.visitor_id)::int
          from visitor_sessions vs
          where vs.store_id = mc.store_id
            and vs.campaign_id = mc.id
            and ${sessionWindow}
        ) as visitors,
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o on o.id = oa.order_id and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.first_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "firstTouchOrders",
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o on o.id = oa.order_id and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "lastTouchOrders",
        (
          select coalesce(sum(o.total_minor), 0)::bigint
          from order_attributions oa
          inner join orders o on o.id = oa.order_id and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "lastTouchRevenueMinor",
        (
          select count(*)::int
          from order_attributions oa
          inner join orders o on o.id = oa.order_id and o.store_id = mc.store_id
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
          select count(*)::int
          from order_attributions oa
          inner join orders o on o.id = oa.order_id and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
            and exists (
              select 1
              from order_status_history osh
              where osh.order_id = o.id
                and osh.to_status = 'DELIVERED'
            )
        ) as "deliveredReachedOrders"
      from marketing_campaigns mc
      inner join stores s on s.id = mc.store_id
      where mc.store_id = ${storeId}
        and mc.id = ${campaignId}
      limit 1
    `)) as unknown as Array<{
      id: string;
      name: string;
      campaignKey: string;
      source: string;
      medium: string;
      content: string | null;
      term: string | null;
      landingUrl: string | null;
      notes: string | null;
      status: CampaignAttributionDetailRow["campaign"]["status"];
      currency: string;
      timezone: string;
      sessions: number | string;
      visitors: number | string;
      firstTouchOrders: number | string;
      lastTouchOrders: number | string;
      lastTouchRevenueMinor: number | string;
      confirmedReachedOrders: number | string;
      deliveredReachedOrders: number | string;
    }>;

    const summary = summaryRows[0];
    if (!summary) return null;

    const orderRows = (await this.database.execute(sql<{
      publicId: string;
      status: CampaignDiagnosticOrderRow["status"];
      totalMinor: number | string;
      currency: string;
      createdAt: Date;
      source: string;
      medium: string | null;
      campaign: string | null;
      firstTouchCampaignId: string | null;
      lastTouchCampaignId: string | null;
      firstTouch: unknown;
      lastTouch: unknown;
    }>`
      select
        o.public_id as "publicId",
        o.status,
        o.total_minor as "totalMinor",
        o.currency,
        o.created_at as "createdAt",
        oa.source,
        oa.medium,
        oa.campaign,
        oa.first_touch_campaign_id as "firstTouchCampaignId",
        oa.last_touch_campaign_id as "lastTouchCampaignId",
        oa.first_touch as "firstTouch",
        oa.last_touch as "lastTouch"
      from order_attributions oa
      inner join orders o
        on o.id = oa.order_id
       and o.store_id = oa.store_id
      where oa.store_id = ${storeId}
        and (
          oa.first_touch_campaign_id = ${campaignId}
          or oa.last_touch_campaign_id = ${campaignId}
        )
        and ${orderWindow}
      order by o.created_at desc, o.id desc
      limit ${Math.max(1, Math.min(100, orderLimit))}
    `)) as unknown as Array<{
      publicId: string;
      status: CampaignDiagnosticOrderRow["status"];
      totalMinor: number | string;
      currency: string;
      createdAt: Date;
      source: string;
      medium: string | null;
      campaign: string | null;
      firstTouchCampaignId: string | null;
      lastTouchCampaignId: string | null;
      firstTouch: unknown;
      lastTouch: unknown;
    }>;

    return {
      campaign: {
        id: summary.id,
        name: summary.name,
        campaignKey: summary.campaignKey,
        source: summary.source,
        medium: summary.medium,
        content: summary.content,
        term: summary.term,
        landingUrl: summary.landingUrl,
        notes: summary.notes,
        status: summary.status,
        currency: summary.currency,
        timezone: summary.timezone,
      },
      metrics: {
        sessions: number(summary.sessions),
        visitors: number(summary.visitors),
        firstTouchOrders: number(summary.firstTouchOrders),
        lastTouchOrders: number(summary.lastTouchOrders),
        lastTouchRevenueMinor: number(summary.lastTouchRevenueMinor),
        confirmedReachedOrders: number(summary.confirmedReachedOrders),
        deliveredReachedOrders: number(summary.deliveredReachedOrders),
      },
      orders: orderRows.map((row): CampaignDiagnosticOrderRow => ({
        publicId: row.publicId,
        status: row.status,
        totalMinor: number(row.totalMinor),
        currency: row.currency,
        createdAt: new Date(row.createdAt),
        source: row.source,
        medium: row.medium,
        campaign: row.campaign,
        firstTouchCampaignId: row.firstTouchCampaignId,
        lastTouchCampaignId: row.lastTouchCampaignId,
        firstTouch: row.firstTouch,
        lastTouch: row.lastTouch,
      })),
    };
  }
}
