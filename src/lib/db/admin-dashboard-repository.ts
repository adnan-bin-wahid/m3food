import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { AdminDashboardRepository } from "../admin/dashboard-repository";
import { getDatabase, type Database } from "./index";
import {
  commerceEvents,
  orderAttributions,
  orders,
  stores,
} from "./schema";

function toNumber(value: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export class DrizzleAdminDashboardRepository
  implements AdminDashboardRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getSnapshot(storeId: string, startAt: Date | null, endAt: Date) {
    const eventConditions = [
      eq(commerceEvents.storeId, storeId),
      lte(commerceEvents.occurredAt, endAt),
    ];
    const orderConditions = [
      eq(orders.storeId, storeId),
      lte(orders.createdAt, endAt),
    ];
    if (startAt) {
      eventConditions.push(gte(commerceEvents.occurredAt, startAt));
      orderConditions.push(gte(orders.createdAt, startAt));
    }

    const sourceExpression = sql<string>`coalesce(nullif(trim(${orderAttributions.source}), ''), 'direct')`;
    const metaClickExpression = sql<boolean>`${orderAttributions.fbclid} is not null`;
    const [storeRows, eventRows, statusRows, sourceRows, recentOrders] =
      await Promise.all([
        this.database
          .select({
            name: stores.name,
            currency: stores.currency,
            timezone: stores.timezone,
          })
          .from(stores)
          .where(and(eq(stores.id, storeId), eq(stores.status, "ACTIVE")))
          .limit(1),
        this.database
          .select({
            visitors: sql<number>`count(distinct ${commerceEvents.visitorId})::int`,
            pageViews: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'PAGE_VIEW')::int`,
            productViews: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'VIEW_CONTENT')::int`,
            addToCarts: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'ADD_TO_CART')::int`,
            checkouts: sql<number>`count(*) filter (where ${commerceEvents.eventName} = 'BEGIN_CHECKOUT')::int`,
          })
          .from(commerceEvents)
          .where(and(...eventConditions)),
        this.database
          .select({
            status: orders.status,
            orderCount: sql<number>`count(*)::int`,
            totalMinor: sql<number | string>`coalesce(sum(${orders.totalMinor}), 0)`,
          })
          .from(orders)
          .where(and(...orderConditions))
          .groupBy(orders.status),
        this.database
          .select({
            source: sourceExpression.as("source"),
            medium: orderAttributions.medium,
            hasMetaClick: metaClickExpression.as("has_meta_click"),
            orderCount: sql<number>`count(*)::int`,
            totalMinor: sql<number | string>`coalesce(sum(${orders.totalMinor}), 0)`,
          })
          .from(orders)
          .leftJoin(orderAttributions, eq(orderAttributions.orderId, orders.id))
          .where(and(...orderConditions))
          .groupBy(
            sourceExpression,
            orderAttributions.medium,
            metaClickExpression,
          ),
        this.database
          .select({
            publicId: orders.publicId,
            customerName: orders.customerName,
            status: orders.status,
            totalMinor: orders.totalMinor,
            currency: orders.currency,
            source: sourceExpression.as("source"),
            createdAt: orders.createdAt,
          })
          .from(orders)
          .leftJoin(orderAttributions, eq(orderAttributions.orderId, orders.id))
          .where(and(...orderConditions))
          .orderBy(desc(orders.createdAt), desc(orders.id))
          .limit(8),
      ]);

    const store = storeRows[0];
    if (!store) return null;
    const events = eventRows[0] ?? {
      visitors: 0,
      pageViews: 0,
      productViews: 0,
      addToCarts: 0,
      checkouts: 0,
    };

    return {
      store,
      events: {
        visitors: toNumber(events.visitors),
        pageViews: toNumber(events.pageViews),
        productViews: toNumber(events.productViews),
        addToCarts: toNumber(events.addToCarts),
        checkouts: toNumber(events.checkouts),
      },
      statuses: statusRows.map((row) => ({
        status: row.status,
        orderCount: toNumber(row.orderCount),
        totalMinor: toNumber(row.totalMinor),
      })),
      sources: sourceRows.map((row) => ({
        source: row.source,
        medium: row.medium,
        hasMetaClick: row.hasMetaClick,
        orderCount: toNumber(row.orderCount),
        totalMinor: toNumber(row.totalMinor),
      })),
      recentOrders,
    };
  }
}
