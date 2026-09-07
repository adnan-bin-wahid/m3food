import { sql } from "drizzle-orm";
import type {
  CampaignPerformanceRepository,
  CampaignPerformanceRow,
} from "../admin/campaign-performance-repository";
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

export class DrizzleAdminCampaignPerformanceRepository
  implements CampaignPerformanceRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getCampaignPerformance(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ) {
    const sessionWindow = windowSql(startAt, endAt, "vs.started_at");
    const orderWindow = windowSql(startAt, endAt, "o.created_at");

    const rows = (await this.database.execute(sql<{
      campaignId: string;
      name: string;
      campaignKey: string;
      status: CampaignPerformanceRow["status"];
      currency: string;
      visitors: number | string;
      sessions: number | string;
      firstTouchOrders: number | string;
      lastTouchOrders: number | string;
      placedRevenueMinor: number | string;
    }>`
      select
        mc.id as "campaignId",
        mc.name,
        mc.campaign_key as "campaignKey",
        mc.status,
        s.currency,
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
        ) as "lastTouchOrders",
        (
          select coalesce(sum(o.total_minor), 0)::bigint
          from order_attributions oa
          inner join orders o
            on o.id = oa.order_id
           and o.store_id = mc.store_id
          where oa.store_id = mc.store_id
            and oa.last_touch_campaign_id = mc.id
            and ${orderWindow}
        ) as "placedRevenueMinor"
      from marketing_campaigns mc
      inner join stores s on s.id = mc.store_id
      where mc.store_id = ${storeId}
      order by
        "lastTouchOrders" desc,
        sessions desc,
        mc.created_at desc
    `)) as unknown as Array<{
      campaignId: string;
      name: string;
      campaignKey: string;
      status: CampaignPerformanceRow["status"];
      currency: string;
      visitors: number | string;
      sessions: number | string;
      firstTouchOrders: number | string;
      lastTouchOrders: number | string;
      placedRevenueMinor: number | string;
    }>;

    return rows.map((row) => ({
      campaignId: row.campaignId,
      name: row.name,
      campaignKey: row.campaignKey,
      status: row.status,
      currency: row.currency,
      visitors: number(row.visitors),
      sessions: number(row.sessions),
      firstTouchOrders: number(row.firstTouchOrders),
      lastTouchOrders: number(row.lastTouchOrders),
      placedRevenueMinor: number(row.placedRevenueMinor),
    }));
  }
}
