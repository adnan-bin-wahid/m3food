import { eq, sql } from "drizzle-orm";
import type {
  RetargetingAudienceRow,
  RetargetingAudienceSnapshot,
  RetargetingRepository,
} from "../admin/retargeting-repository";
import { getDatabase, type Database } from "./index";
import { stores } from "./schema";

type TargetEventName = "ADD_TO_CART" | "BEGIN_CHECKOUT" | "VIEW_CONTENT";

interface AudienceRow {
  visitorId: string;
  visitorKey: string;
  sessionId: string;
  sessionKey: string;
  source: string | null;
  campaign: string | null;
  productName: string | null;
  sku: string | null;
  valueMinor: number | string | null;
  lastActionAt: Date | string;
  lastSeenAt: Date | string;
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toNumber(value: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function mapRow(row: AudienceRow): RetargetingAudienceRow {
  return {
    visitorId: row.visitorId,
    visitorKey: row.visitorKey,
    sessionId: row.sessionId,
    sessionKey: row.sessionKey,
    source: row.source?.trim() || "direct",
    campaign: row.campaign,
    productName: row.productName,
    sku: row.sku,
    valueMinor: toNumber(row.valueMinor),
    lastActionAt: toDate(row.lastActionAt),
    lastSeenAt: toDate(row.lastSeenAt),
  };
}

export class DrizzleAdminRetargetingRepository implements RetargetingRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async getAudience(
    storeId: string,
    eventName: TargetEventName,
    startAt: Date,
    cutoffAt: Date,
    limit: number,
  ): Promise<RetargetingAudienceSnapshot | null> {
    const storeRows = await this.database
      .select({
        name: stores.name,
        slug: stores.slug,
        currency: stores.currency,
        timezone: stores.timezone,
        metaPixelId: stores.metaPixelId,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    const store = storeRows[0];
    if (!store) return null;

    const startAtIso = startAt.toISOString();
    const cutoffAtIso = cutoffAt.toISOString();

    const rows = await this.database.execute(
      sql<AudienceRow>`
        with latest_target as (
          select distinct on (ce.visitor_id)
            ce.visitor_id,
            ce.session_id,
            ce.product_id,
            ce.variant_id,
            ce.value_minor,
            ce.occurred_at as target_at
          from commerce_events ce
          where ce.store_id = ${storeId}
            and ce.event_name = ${eventName}
            and ce.occurred_at >= ${startAtIso}
            and ce.occurred_at <= ${cutoffAtIso}
            and ce.visitor_id is not null
            and ce.session_id is not null
          order by ce.visitor_id, ce.occurred_at desc, ce.id desc
        )
        select
          lt.visitor_id as "visitorId",
          v.visitor_key as "visitorKey",
          lt.session_id as "sessionId",
          vs.session_key as "sessionKey",
          case
            when nullif(vs.fbclid, '') is not null then 'meta'
            when nullif(trim(vs.utm_source), '') is not null then lower(trim(vs.utm_source))
            else 'direct'
          end as source,
          nullif(trim(vs.utm_campaign), '') as campaign,
          p.name as "productName",
          pv.sku as sku,
          coalesce(lt.value_minor, 0) as "valueMinor",
          lt.target_at as "lastActionAt",
          vs.last_seen_at as "lastSeenAt"
        from latest_target lt
        inner join visitors v
          on v.id = lt.visitor_id and v.store_id = ${storeId}
        inner join visitor_sessions vs
          on vs.id = lt.session_id and vs.store_id = ${storeId}
        left join products p
          on p.id = lt.product_id and p.store_id = ${storeId}
        left join product_variants pv
          on pv.id = lt.variant_id and pv.store_id = ${storeId}
        where vs.last_seen_at <= ${cutoffAtIso}
          and not exists (
            select 1
            from commerce_events purchase
            where purchase.store_id = ${storeId}
              and purchase.visitor_id = lt.visitor_id
              and purchase.event_name = 'PURCHASE'
              and purchase.occurred_at >= lt.target_at
          )
        order by lt.target_at desc, lt.visitor_id
        limit ${limit}
      `,
    );

    return {
      store,
      rows: rows.map((row: unknown) => mapRow(row as AudienceRow)),
    };
  }
}
