import { and, eq, sql } from "drizzle-orm";
import type {
  CtaPerformanceRow,
  ScrollDepthRow,
  SectionPerformanceRow,
  VisitorIntelligenceRepository,
  VisitorIntelligenceStore,
  VisitorTimelineEvent,
} from "../admin/visitor-intelligence-repository";
import { getDatabase, type Database } from "./index";
import { stores, visitorSessions, visitors } from "./schema";

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

function interactionLabel(eventName: string, elementLabel: string | null, elementKey: string | null, sectionKey: string | null, scrollDepth: number | null) {
  if (eventName === "SESSION_START") return "Session started";
  if (eventName === "SECTION_VIEW") return `Viewed section: ${sectionKey ?? "unknown"}`;
  if (eventName === "CTA_VIEW") return `CTA viewed: ${elementLabel || elementKey || "CTA"}`;
  if (eventName === "CTA_CLICK") return `CTA clicked: ${elementLabel || elementKey || "CTA"}`;
  if (eventName === "WHATSAPP_CLICK") return `WhatsApp clicked: ${elementLabel || elementKey || "CTA"}`;
  if (eventName === "MESSENGER_CLICK") return `Messenger clicked: ${elementLabel || elementKey || "CTA"}`;
  if (eventName === "SCROLL_DEPTH") return `Scrolled to ${scrollDepth ?? 0}%`;
  return eventName;
}

function commerceLabel(eventName: string) {
  const labels: Record<string, string> = {
    PAGE_VIEW: "Page viewed",
    VIEW_CONTENT: "Product viewed",
    ADD_TO_CART: "Added to cart",
    BEGIN_CHECKOUT: "Checkout started",
    PURCHASE: "Purchase completed",
  };
  return labels[eventName] ?? eventName;
}

export class DrizzleAdminVisitorIntelligenceRepository implements VisitorIntelligenceRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  private async getStore(storeId: string): Promise<VisitorIntelligenceStore | null> {
    const [store] = await this.database
      .select({
        name: stores.name,
        slug: stores.slug,
        currency: stores.currency,
        timezone: stores.timezone,
        clarityProjectId: stores.clarityProjectId,
      })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.status, "ACTIVE")))
      .limit(1);
    return store ?? null;
  }

  async getOverview(storeId: string, startAt: Date | null, endAt: Date) {
    const store = await this.getStore(storeId);
    if (!store) return null;
    const interactionWindow = windowSql(startAt, endAt, "vie.occurred_at");
    const orderWindow = windowSql(startAt, endAt, "o.created_at");

    const ctas = rawRows<CtaPerformanceRow>(await this.database.execute(sql<CtaPerformanceRow>`
      with cta_stats as (
        select
          vie.element_key,
          max(vie.element_label) filter (where nullif(trim(vie.element_label), '') is not null) as element_label,
          max(vie.section_key) filter (where nullif(trim(vie.section_key), '') is not null) as section_key,
          count(distinct vie.session_id) filter (where vie.event_name = 'CTA_VIEW')::int as unique_views,
          count(distinct vie.session_id) filter (where vie.event_name in ('CTA_CLICK','WHATSAPP_CLICK','MESSENGER_CLICK'))::int as unique_clicks,
          count(*) filter (where vie.event_name in ('CTA_CLICK','WHATSAPP_CLICK','MESSENGER_CLICK'))::int as clicks
        from visitor_interaction_events vie
        where vie.store_id = ${storeId}
          and vie.element_key is not null
          and vie.event_name in ('CTA_VIEW','CTA_CLICK','WHATSAPP_CLICK','MESSENGER_CLICK')
          and ${interactionWindow}
        group by vie.element_key
      ),
      attributed_orders as (
        select
          click.element_key,
          count(*)::int as orders,
          coalesce(sum(o.total_minor), 0)::bigint as revenue_minor
        from orders o
        inner join lateral (
          select vie.element_key
          from visitor_interaction_events vie
          where vie.store_id = ${storeId}
            and vie.session_id = o.session_id
            and vie.event_name in ('CTA_CLICK','WHATSAPP_CLICK','MESSENGER_CLICK')
            and vie.element_key is not null
            and vie.occurred_at <= o.created_at
          order by vie.occurred_at desc, vie.id desc
          limit 1
        ) click on true
        where o.store_id = ${storeId}
          and o.session_id is not null
          and o.status not in ('CANCELLED','RETURNED')
          and ${orderWindow}
        group by click.element_key
      )
      select
        cs.element_key as "elementKey",
        cs.element_label as "elementLabel",
        cs.section_key as "sectionKey",
        cs.unique_views as "uniqueViews",
        cs.unique_clicks as "uniqueClicks",
        cs.clicks,
        coalesce(ao.orders, 0)::int as orders,
        coalesce(ao.revenue_minor, 0)::bigint as "revenueMinor"
      from cta_stats cs
      left join attributed_orders ao on ao.element_key = cs.element_key
      order by cs.unique_clicks desc, cs.unique_views desc, cs.element_key asc
      limit 100
    `));

    const sections = rawRows<SectionPerformanceRow>(await this.database.execute(sql<SectionPerformanceRow>`
      select
        vie.section_key as "sectionKey",
        count(distinct vie.visitor_id)::int as "uniqueVisitors",
        count(distinct vie.session_id)::int as "uniqueSessions"
      from visitor_interaction_events vie
      where vie.store_id = ${storeId}
        and vie.event_name = 'SECTION_VIEW'
        and vie.section_key is not null
        and ${interactionWindow}
      group by vie.section_key
      order by "uniqueSessions" desc, vie.section_key asc
      limit 100
    `));

    const scrollDepths = rawRows<ScrollDepthRow>(await this.database.execute(sql<ScrollDepthRow>`
      select
        vie.scroll_depth as "scrollDepth",
        count(distinct vie.session_id)::int as "uniqueSessions"
      from visitor_interaction_events vie
      where vie.store_id = ${storeId}
        and vie.event_name = 'SCROLL_DEPTH'
        and vie.scroll_depth is not null
        and ${interactionWindow}
      group by vie.scroll_depth
      order by vie.scroll_depth asc
    `));

    const totals = rawRows<{ count: number | string }>(await this.database.execute(sql`
      select count(*)::int as count
      from visitor_interaction_events vie
      where vie.store_id = ${storeId} and ${interactionWindow}
    `));

    return {
      store,
      interactionEvents: number(totals[0]?.count),
      ctas: ctas.map((row) => ({
        ...row,
        uniqueViews: number(row.uniqueViews),
        uniqueClicks: number(row.uniqueClicks),
        clicks: number(row.clicks),
        orders: number(row.orders),
        revenueMinor: number(row.revenueMinor),
      })),
      sections: sections.map((row) => ({
        ...row,
        uniqueVisitors: number(row.uniqueVisitors),
        uniqueSessions: number(row.uniqueSessions),
      })),
      scrollDepths: scrollDepths.map((row) => ({
        scrollDepth: number(row.scrollDepth),
        uniqueSessions: number(row.uniqueSessions),
      })),
    };
  }

  async getSessionJourney(storeId: string, sessionKey: string) {
    const store = await this.getStore(storeId);
    if (!store) return null;
    const [session] = await this.database
      .select({
        sessionId: visitorSessions.id,
        sessionKey: visitorSessions.sessionKey,
        visitorKey: visitors.visitorKey,
        utmSource: visitorSessions.utmSource,
        utmMedium: visitorSessions.utmMedium,
        utmCampaign: visitorSessions.utmCampaign,
        fbclid: visitorSessions.fbclid,
        landingPage: visitorSessions.landingPage,
        referrer: visitorSessions.referrer,
        startedAt: visitorSessions.startedAt,
        lastSeenAt: visitorSessions.lastSeenAt,
      })
      .from(visitorSessions)
      .innerJoin(visitors, and(eq(visitors.id, visitorSessions.visitorId), eq(visitors.storeId, storeId)))
      .where(and(eq(visitorSessions.storeId, storeId), eq(visitorSessions.sessionKey, sessionKey)))
      .limit(1);
    if (!session) return null;

    type RawTimeline = {
      id: string;
      kind: "INTERACTION" | "COMMERCE" | "ORDER" | "ORDER_STATUS";
      eventName: string;
      occurredAt: Date;
      pageUrl: string | null;
      sectionKey: string | null;
      elementKey: string | null;
      elementLabel: string | null;
      targetUrl: string | null;
      scrollDepth: number | null;
      valueMinor: number | null;
      currency: string | null;
      metadata: Record<string, unknown>;
    };

    const raw = rawRows<RawTimeline>(await this.database.execute(sql<RawTimeline>`
      select
        vie.id::text as id,
        'INTERACTION'::text as kind,
        vie.event_name::text as "eventName",
        vie.occurred_at as "occurredAt",
        vie.page_url as "pageUrl",
        vie.section_key as "sectionKey",
        vie.element_key as "elementKey",
        vie.element_label as "elementLabel",
        vie.target_url as "targetUrl",
        vie.scroll_depth as "scrollDepth",
        null::int as "valueMinor",
        null::text as currency,
        vie.payload as metadata
      from visitor_interaction_events vie
      where vie.store_id = ${storeId} and vie.session_id = ${session.sessionId}

      union all

      select
        ce.id::text,
        'COMMERCE'::text,
        ce.event_name::text,
        ce.occurred_at,
        ce.page_url,
        null::text,
        null::text,
        null::text,
        null::text,
        null::int,
        ce.value_minor,
        ce.currency,
        ce.payload
      from commerce_events ce
      where ce.store_id = ${storeId} and ce.session_id = ${session.sessionId}

      union all

      select
        o.id::text,
        'ORDER'::text,
        'ORDER_CREATED'::text,
        o.created_at,
        null::text,
        null::text,
        null::text,
        null::text,
        null::text,
        null::int,
        o.total_minor,
        o.currency,
        jsonb_build_object('publicId', o.public_id, 'status', o.status)
      from orders o
      where o.store_id = ${storeId} and o.session_id = ${session.sessionId}

      union all

      select
        osh.id::text,
        'ORDER_STATUS'::text,
        ('ORDER_' || osh.to_status::text)::text,
        osh.created_at,
        null::text,
        null::text,
        null::text,
        null::text,
        null::text,
        null::int,
        o.total_minor,
        o.currency,
        jsonb_build_object('publicId', o.public_id, 'fromStatus', osh.from_status, 'toStatus', osh.to_status)
      from order_status_history osh
      inner join orders o on o.id = osh.order_id and o.store_id = ${storeId}
      where o.session_id = ${session.sessionId}

      order by "occurredAt" asc, id asc
    `));

    const sessionStart: VisitorTimelineEvent[] = raw.some((row) => row.kind === "INTERACTION" && row.eventName === "SESSION_START")
      ? []
      : [{
          id: `session:${session.sessionId}`,
          kind: "SESSION",
          eventName: "SESSION_START",
          label: "Session started",
          occurredAt: session.startedAt,
          pageUrl: session.landingPage,
          sectionKey: null,
          elementKey: null,
          elementLabel: null,
          targetUrl: null,
          scrollDepth: null,
          valueMinor: null,
          currency: null,
          metadata: {},
        }];

    const timeline: VisitorTimelineEvent[] = [
      ...sessionStart,
      ...raw.map((row) => ({
        ...row,
        kind: row.kind,
        label: row.kind === "INTERACTION"
          ? interactionLabel(row.eventName, row.elementLabel, row.elementKey, row.sectionKey, row.scrollDepth)
          : row.kind === "COMMERCE"
            ? commerceLabel(row.eventName)
            : row.kind === "ORDER"
              ? `Order created: ${String(row.metadata?.publicId ?? "")}`
              : `Order status: ${String(row.metadata?.toStatus ?? row.eventName.replace("ORDER_", ""))}`,
        metadata: row.metadata ?? {},
      })),
    ].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

    const source = session.fbclid
      ? "meta"
      : session.utmSource?.trim().toLowerCase() || "direct";
    return {
      store,
      visitorKey: session.visitorKey,
      sessionKey: session.sessionKey,
      source,
      medium: session.utmMedium,
      campaign: session.utmCampaign,
      landingPage: session.landingPage,
      referrer: session.referrer,
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      timeline,
    };
  }
}
