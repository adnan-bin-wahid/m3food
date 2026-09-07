import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AddCustomerNoteInput,
  AddCustomerTagInput,
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminCustomerOrder,
  AdminCustomerQuery,
  AdminCustomerRepository,
  MarketingAudienceRow,
  MarketingChannel,
  RemoveCustomerTagInput,
} from "../admin/customer-admin-repository";
import { HIGH_VALUE_CUSTOMER_THRESHOLD_MINOR } from "../admin/customer-admin-service";
import { getDatabase, type Database } from "./index";
import {
  customerActivityHistory,
  customerNotes,
  customers,
  customerTags,
  stores,
} from "./schema";

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rawRows<T>(value: unknown): T[] {
  return value as T[];
}

function uniqueViolation(error: unknown, constraint: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; constraint_name?: unknown; constraint?: unknown };
  return (
    candidate.code === "23505" &&
    (candidate.constraint_name === constraint || candidate.constraint === constraint)
  );
}

function searchCondition(query: AdminCustomerQuery) {
  if (!query.query) return sql`true`;
  const pattern = `%${query.query}%`;
  return sql`(c.name ilike ${pattern} or c.phone ilike ${pattern} or coalesce(c.email, '') ilike ${pattern})`;
}

function segmentCondition(query: AdminCustomerQuery) {
  if (query.segment === "NEW") return sql`coalesce(os.order_count, 0) <= 1`;
  if (query.segment === "REPEAT") return sql`coalesce(os.order_count, 0) >= 2`;
  if (query.segment === "HIGH_VALUE") {
    return sql`coalesce(os.delivered_revenue_minor, 0) >= ${HIGH_VALUE_CUSTOMER_THRESHOLD_MINOR}`;
  }
  return sql`true`;
}

function channelCondition(query: AdminCustomerQuery) {
  if (query.channel === "EMAIL") {
    return sql`coalesce(lc.email_allowed, false) = true and nullif(c.email, '') is not null`;
  }
  if (query.channel === "SMS") {
    return sql`coalesce(lc.sms_allowed, false) = true and nullif(c.phone, '') is not null`;
  }
  if (query.channel === "WHATSAPP") {
    return sql`coalesce(lc.whatsapp_allowed, false) = true and nullif(c.phone, '') is not null`;
  }
  return sql`true`;
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  orderCount: number | string;
  deliveredOrderCount: number | string;
  deliveredRevenueMinor: number | string;
  lastOrderAt: Date | null;
  emailMarketingAllowed: boolean | null;
  smsMarketingAllowed: boolean | null;
  whatsappMarketingAllowed: boolean | null;
  privacyPolicyVersion: string | null;
  consentCapturedAt: Date | null;
  tags: string[] | null;
}

function mapCustomer(row: CustomerRow): AdminCustomerListItem {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    createdAt: row.createdAt,
    orderCount: number(row.orderCount),
    deliveredOrderCount: number(row.deliveredOrderCount),
    deliveredRevenueMinor: number(row.deliveredRevenueMinor),
    lastOrderAt: row.lastOrderAt,
    consent: {
      emailMarketingAllowed: row.emailMarketingAllowed === true,
      smsMarketingAllowed: row.smsMarketingAllowed === true,
      whatsappMarketingAllowed: row.whatsappMarketingAllowed === true,
      privacyPolicyVersion: row.privacyPolicyVersion,
      capturedAt: row.consentCapturedAt,
    },
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

const customerCtes = (storeId: string) => sql`
  with order_stats as (
    select
      o.customer_id,
      count(*)::int as order_count,
      count(*) filter (where o.status = 'DELIVERED')::int as delivered_order_count,
      coalesce(sum(o.total_minor) filter (where o.status = 'DELIVERED'), 0)::bigint as delivered_revenue_minor,
      min(o.created_at) as first_order_at,
      max(o.created_at) as last_order_at
    from orders o
    where o.store_id = ${storeId} and o.customer_id is not null
    group by o.customer_id
  ),
  latest_order_consent as (
    select distinct on (o.customer_id)
      o.customer_id,
      oc.email_marketing_allowed as email_allowed,
      oc.sms_marketing_allowed as sms_allowed,
      oc.whatsapp_marketing_allowed as whatsapp_allowed,
      oc.privacy_policy_version,
      oc.captured_at
    from orders o
    inner join order_consents oc on oc.order_id = o.id and oc.store_id = ${storeId}
    where o.store_id = ${storeId} and o.customer_id is not null
    order by o.customer_id, oc.captured_at desc, o.created_at desc
  ),
  latest_consent as (
    select
      c.id as customer_id,
      coalesce(mp.email_marketing_allowed, loc.email_allowed, false) as email_allowed,
      coalesce(mp.sms_marketing_allowed, loc.sms_allowed, false) as sms_allowed,
      coalesce(mp.whatsapp_marketing_allowed, loc.whatsapp_allowed, false) as whatsapp_allowed,
      coalesce(mp.privacy_policy_version, loc.privacy_policy_version) as privacy_policy_version,
      coalesce(mp.updated_at, loc.captured_at) as captured_at
    from customers c
    left join latest_order_consent loc on loc.customer_id = c.id
    left join customer_marketing_preferences mp
      on mp.customer_id = c.id and mp.store_id = ${storeId}
    where c.store_id = ${storeId}
  ),
  tag_agg as (
    select ct.customer_id, array_agg(ct.tag order by ct.tag) as tags
    from customer_tags ct
    where ct.store_id = ${storeId}
    group by ct.customer_id
  )
`;

export class DrizzleAdminCustomerRepository implements AdminCustomerRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async listCustomers(storeId: string, query: AdminCustomerQuery) {
    const storeRows = await this.database
      .select({
        name: stores.name,
        slug: stores.slug,
        currency: stores.currency,
        timezone: stores.timezone,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    const store = storeRows[0];
    if (!store) return null;

    const offset = (query.page - 1) * query.pageSize;
    const search = searchCondition(query);
    const segment = segmentCondition(query);
    const channel = channelCondition(query);

    const rows = rawRows<CustomerRow>(await this.database.execute(
      sql<CustomerRow>`${customerCtes(storeId)}
        select
          c.id,
          c.name,
          c.phone,
          c.email,
          c.created_at as "createdAt",
          coalesce(os.order_count, 0) as "orderCount",
          coalesce(os.delivered_order_count, 0) as "deliveredOrderCount",
          coalesce(os.delivered_revenue_minor, 0) as "deliveredRevenueMinor",
          os.last_order_at as "lastOrderAt",
          lc.email_allowed as "emailMarketingAllowed",
          lc.sms_allowed as "smsMarketingAllowed",
          lc.whatsapp_allowed as "whatsappMarketingAllowed",
          lc.privacy_policy_version as "privacyPolicyVersion",
          lc.captured_at as "consentCapturedAt",
          coalesce(ta.tags, array[]::text[]) as tags
        from customers c
        left join order_stats os on os.customer_id = c.id
        left join latest_consent lc on lc.customer_id = c.id
        left join tag_agg ta on ta.customer_id = c.id
        where c.store_id = ${storeId}
          and ${search}
          and ${segment}
          and ${channel}
        order by coalesce(os.last_order_at, c.created_at) desc, c.id
        limit ${query.pageSize} offset ${offset}
      `,
    ));

    const totalRows = await this.database.execute(
      sql<{ total: number | string }>`${customerCtes(storeId)}
        select count(*)::int as total
        from customers c
        left join order_stats os on os.customer_id = c.id
        left join latest_consent lc on lc.customer_id = c.id
        where c.store_id = ${storeId}
          and ${search}
          and ${segment}
          and ${channel}
      `,
    );

    const summaryRows = await this.database.execute(
      sql<{
        customerCount: number | string;
        repeatCustomerCount: number | string;
        deliveredRevenueMinor: number | string;
        marketingEligibleCount: number | string;
      }>`${customerCtes(storeId)}
        select
          count(*)::int as "customerCount",
          count(*) filter (where coalesce(os.order_count, 0) >= 2)::int as "repeatCustomerCount",
          coalesce(sum(os.delivered_revenue_minor), 0)::bigint as "deliveredRevenueMinor",
          count(*) filter (
            where
              (coalesce(lc.email_allowed, false) = true and nullif(c.email, '') is not null)
              or (coalesce(lc.sms_allowed, false) = true and nullif(c.phone, '') is not null)
              or (coalesce(lc.whatsapp_allowed, false) = true and nullif(c.phone, '') is not null)
          )::int as "marketingEligibleCount"
        from customers c
        left join order_stats os on os.customer_id = c.id
        left join latest_consent lc on lc.customer_id = c.id
        where c.store_id = ${storeId}
      `,
    );

    const summary = summaryRows[0] ?? {
      customerCount: 0,
      repeatCustomerCount: 0,
      deliveredRevenueMinor: 0,
      marketingEligibleCount: 0,
    };

    return {
      store,
      customers: rows.map(mapCustomer),
      total: number(totalRows[0]?.total),
      summary: {
        customerCount: number(summary.customerCount),
        repeatCustomerCount: number(summary.repeatCustomerCount),
        deliveredRevenueMinor: number(summary.deliveredRevenueMinor),
        marketingEligibleCount: number(summary.marketingEligibleCount),
      },
    };
  }

  async getCustomer(storeId: string, customerId: string): Promise<AdminCustomerDetail | null> {
    const storeRows = await this.database
      .select({ name: stores.name, slug: stores.slug, currency: stores.currency, timezone: stores.timezone })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    const store = storeRows[0];
    if (!store) return null;

    const customerRows = rawRows<CustomerRow & { firstOrderAt: Date | null }>(await this.database.execute(
      sql<CustomerRow & { firstOrderAt: Date | null }>`${customerCtes(storeId)}
        select
          c.id, c.name, c.phone, c.email, c.created_at as "createdAt",
          coalesce(os.order_count, 0) as "orderCount",
          coalesce(os.delivered_order_count, 0) as "deliveredOrderCount",
          coalesce(os.delivered_revenue_minor, 0) as "deliveredRevenueMinor",
          os.first_order_at as "firstOrderAt",
          os.last_order_at as "lastOrderAt",
          lc.email_allowed as "emailMarketingAllowed",
          lc.sms_allowed as "smsMarketingAllowed",
          lc.whatsapp_allowed as "whatsappMarketingAllowed",
          lc.privacy_policy_version as "privacyPolicyVersion",
          lc.captured_at as "consentCapturedAt",
          coalesce(ta.tags, array[]::text[]) as tags
        from customers c
        left join order_stats os on os.customer_id = c.id
        left join latest_consent lc on lc.customer_id = c.id
        left join tag_agg ta on ta.customer_id = c.id
        where c.store_id = ${storeId} and c.id = ${customerId}
        limit 1
      `,
    ));
    const row = customerRows[0];
    if (!row) return null;

    const [ordersRaw, sourcesRaw, notes, activity] = await Promise.all([
      this.database.execute(sql<{
        publicId: string;
        status: string;
        paymentStatus: string;
        totalMinor: number;
        currency: string;
        source: string | null;
        createdAt: Date;
      }>`
        select
          o.public_id as "publicId",
          o.status::text as status,
          o.payment_status::text as "paymentStatus",
          o.total_minor as "totalMinor",
          o.currency,
          oa.source,
          o.created_at as "createdAt"
        from orders o
        left join order_attributions oa on oa.order_id = o.id and oa.store_id = ${storeId}
        where o.store_id = ${storeId} and o.customer_id = ${customerId}
        order by o.created_at desc, o.id desc
        limit 100
      `),
      this.database.execute(sql<{ source: string; orderCount: number | string }>`
        select coalesce(nullif(lower(oa.source), ''), 'direct') as source, count(*)::int as "orderCount"
        from orders o
        left join order_attributions oa on oa.order_id = o.id and oa.store_id = ${storeId}
        where o.store_id = ${storeId} and o.customer_id = ${customerId}
        group by coalesce(nullif(lower(oa.source), ''), 'direct')
        order by count(*) desc, source asc
      `),
      this.database
        .select({
          id: customerNotes.id,
          note: customerNotes.note,
          createdByAdminEmail: customerNotes.createdByAdminEmail,
          createdAt: customerNotes.createdAt,
        })
        .from(customerNotes)
        .where(and(eq(customerNotes.storeId, storeId), eq(customerNotes.customerId, customerId)))
        .orderBy(desc(customerNotes.createdAt))
        .limit(30),
      this.database
        .select({
          id: customerActivityHistory.id,
          action: customerActivityHistory.action,
          changedByAdminEmail: customerActivityHistory.changedByAdminEmail,
          metadata: customerActivityHistory.metadata,
          createdAt: customerActivityHistory.createdAt,
        })
        .from(customerActivityHistory)
        .where(and(eq(customerActivityHistory.storeId, storeId), eq(customerActivityHistory.customerId, customerId)))
        .orderBy(desc(customerActivityHistory.createdAt))
        .limit(30),
    ]);

    const orders = rawRows<AdminCustomerOrder>(ordersRaw);
    const sources = rawRows<{ source: string; orderCount: number | string }>(sourcesRaw);

    const base = mapCustomer(row);
    return {
      ...base,
      store,
      firstOrderAt: row.firstOrderAt,
      averageDeliveredOrderMinor:
        base.deliveredOrderCount > 0
          ? Math.round(base.deliveredRevenueMinor / base.deliveredOrderCount)
          : 0,
      acquisitionSources: sources.map((source) => ({
        source: source.source,
        orderCount: number(source.orderCount),
      })),
      orders,
      notes,
      activity,
    };
  }

  async addTag(input: AddCustomerTagInput) {
    try {
      return await this.database.transaction(async (tx) => {
        const found = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(and(eq(customers.storeId, input.storeId), eq(customers.id, input.customerId)))
          .limit(1);
        if (!found[0]) return { kind: "NOT_FOUND" } as const;

        await tx.insert(customerTags).values({
          storeId: input.storeId,
          customerId: input.customerId,
          tag: input.tag,
          addedByAdminUserId: input.actor.id,
          addedByAdminEmail: input.actor.email,
          createdAt: input.now,
        });
        await tx.insert(customerActivityHistory).values({
          storeId: input.storeId,
          customerId: input.customerId,
          action: "TAG_ADDED",
          changedByAdminUserId: input.actor.id,
          changedByAdminEmail: input.actor.email,
          metadata: { tag: input.tag },
          createdAt: input.now,
        });
        return { kind: "OK" } as const;
      });
    } catch (error) {
      if (uniqueViolation(error, "customer_tags_store_customer_tag_uniq")) {
        return { kind: "DUPLICATE" } as const;
      }
      throw error;
    }
  }

  async removeTag(input: RemoveCustomerTagInput) {
    return this.database.transaction(async (tx) => {
      const removed = await tx
        .delete(customerTags)
        .where(
          and(
            eq(customerTags.storeId, input.storeId),
            eq(customerTags.customerId, input.customerId),
            eq(customerTags.tag, input.tag),
          ),
        )
        .returning({ id: customerTags.id });
      if (!removed[0]) return { kind: "NOT_FOUND" } as const;

      await tx.insert(customerActivityHistory).values({
        storeId: input.storeId,
        customerId: input.customerId,
        action: "TAG_REMOVED",
        changedByAdminUserId: input.actor.id,
        changedByAdminEmail: input.actor.email,
        metadata: { tag: input.tag },
        createdAt: input.now,
      });
      return { kind: "OK" } as const;
    });
  }

  async addNote(input: AddCustomerNoteInput) {
    return this.database.transaction(async (tx) => {
      const found = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.storeId, input.storeId), eq(customers.id, input.customerId)))
        .limit(1);
      if (!found[0]) return { kind: "NOT_FOUND" } as const;

      const inserted = await tx
        .insert(customerNotes)
        .values({
          storeId: input.storeId,
          customerId: input.customerId,
          note: input.note,
          createdByAdminUserId: input.actor.id,
          createdByAdminEmail: input.actor.email,
          createdAt: input.now,
        })
        .returning({ id: customerNotes.id });

      await tx.insert(customerActivityHistory).values({
        storeId: input.storeId,
        customerId: input.customerId,
        action: "NOTE_ADDED",
        changedByAdminUserId: input.actor.id,
        changedByAdminEmail: input.actor.email,
        metadata: { noteId: inserted[0]?.id ?? null },
        createdAt: input.now,
      });
      return { kind: "OK" } as const;
    });
  }

  async listMarketingAudience(
    storeId: string,
    channel: Exclude<MarketingChannel, "ALL">,
  ): Promise<MarketingAudienceRow[]> {
    const consentColumn =
      channel === "EMAIL"
        ? sql`lc.email_allowed`
        : channel === "SMS"
          ? sql`lc.sms_allowed`
          : sql`lc.whatsapp_allowed`;
    const contactCondition =
      channel === "EMAIL" ? sql`nullif(c.email, '') is not null` : sql`nullif(c.phone, '') is not null`;

    const rows = rawRows<{
      customerId: string;
      name: string;
      phone: string;
      email: string | null;
      deliveredOrderCount: number | string;
      deliveredRevenueMinor: number | string;
      lastOrderAt: Date | null;
      consentCapturedAt: Date;
    }>(await this.database.execute(
      sql<{
        customerId: string;
        name: string;
        phone: string;
        email: string | null;
        deliveredOrderCount: number | string;
        deliveredRevenueMinor: number | string;
        lastOrderAt: Date | null;
        consentCapturedAt: Date;
      }>`${customerCtes(storeId)}
        select
          c.id as "customerId",
          c.name,
          c.phone,
          c.email,
          coalesce(os.delivered_order_count, 0) as "deliveredOrderCount",
          coalesce(os.delivered_revenue_minor, 0) as "deliveredRevenueMinor",
          os.last_order_at as "lastOrderAt",
          lc.captured_at as "consentCapturedAt"
        from customers c
        left join order_stats os on os.customer_id = c.id
        inner join latest_consent lc on lc.customer_id = c.id
        where c.store_id = ${storeId}
          and coalesce(${consentColumn}, false) = true
          and ${contactCondition}
        order by coalesce(os.last_order_at, c.created_at) desc, c.id
      `,
    ));

    return rows.map((row) => ({
      ...row,
      deliveredOrderCount: number(row.deliveredOrderCount),
      deliveredRevenueMinor: number(row.deliveredRevenueMinor),
    }));
  }
}
