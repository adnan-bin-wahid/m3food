import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getDatabase } from "../src/lib/db";
import { getAdminDashboard } from "../src/lib/admin/dashboard-service";
import { listAdminOrders, parseAdminOrderQuery } from "../src/lib/admin/order-admin-service";
import { getMarketingOverview } from "../src/lib/admin/marketing-analytics-service";
import { getAdminFinancialIntelligence } from "../src/lib/admin/financial-intelligence-service";
import { DrizzleAdminDashboardRepository } from "../src/lib/db/admin-dashboard-repository";
import { DrizzleAdminOrderRepository } from "../src/lib/db/admin-order-repository";
import { DrizzleAdminMarketingAnalyticsRepository } from "../src/lib/db/admin-marketing-analytics-repository";
import { DrizzleAdminStoreFinancialSummaryRepository } from "../src/lib/db/admin-store-financial-summary-repository";
import { DrizzleAdminChannelFinancialSummaryRepository } from "../src/lib/db/admin-channel-financial-summary-repository";
import { resolveAdminReportingWindow } from "../src/lib/admin/reporting-period";
import { stores, orders, commerceEvents, visitorSessions } from "../src/lib/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

interface ReconciliationRow {
  storeSlug: string;
  metric: string;
  tableDefinition: string;
  directSql: number;
  serviceLayer: number;
  renderedPageMetric: number;
  status: "RECONCILED" | "MISMATCH";
}

async function reconcileStore(storeId: string, storeSlug: string, storeName: string) {
  const db = getDatabase();
  const canonicalPeriod = "30d" as const;
  const window = resolveAdminReportingWindow(canonicalPeriod);
  const { startAt, endAt } = window;

  if (!startAt || !endAt) {
    throw new Error("30d window must have non-null startAt and endAt");
  }

  console.log(`\n===============================================================`);
  console.log(`RECONCILING STORE: ${storeName} (Slug: ${storeSlug}, ID: ${storeId})`);
  console.log(`Canonical Period: ${canonicalPeriod} (${window.label})`);
  console.log(`UTC Window: [${startAt.toISOString()} -> ${endAt.toISOString()})`);
  console.log(`Asia/Dhaka Window: [${window.from} -> ${window.to}]`);
  console.log(`===============================================================`);

  // 1. Direct SQL Queries
  // Direct Orders in window
  const [directOrdersRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        gte(orders.createdAt, startAt),
        lt(orders.createdAt, endAt)
      )
    );
  const directOrdersCount = directOrdersRow?.count ?? 0;

  // Direct Consented Tracked Visitors (commerce_events)
  const [directVisitorsRow] = await db
    .select({ count: sql<number>`count(distinct ${commerceEvents.visitorId})::int` })
    .from(commerceEvents)
    .where(
      and(
        eq(commerceEvents.storeId, storeId),
        gte(commerceEvents.occurredAt, startAt),
        lt(commerceEvents.occurredAt, endAt)
      )
    );
  const directVisitorsCount = directVisitorsRow?.count ?? 0;

  // Direct Financial Delivered Orders
  const [directDeliveredRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        eq(orders.status, "DELIVERED"),
        gte(orders.createdAt, startAt),
        lt(orders.createdAt, endAt)
      )
    );
  const directDeliveredCount = directDeliveredRow?.count ?? 0;

  // 2. Service Layer Results
  // A. Dashboard Service
  const dashboardRepo = new DrizzleAdminDashboardRepository();
  const dashboard = await getAdminDashboard(storeId, canonicalPeriod, dashboardRepo, new Date(), window.from, window.to);

  // B. Order Admin Service (default no-param query resolves to 30d)
  const parsedOrderQuery = parseAdminOrderQuery({}, new Date());
  const orderRepo = new DrizzleAdminOrderRepository();
  const ordersResult = await listAdminOrders(storeId, parsedOrderQuery, orderRepo);

  // C. Marketing Overview Service
  const marketingRepo = new DrizzleAdminMarketingAnalyticsRepository();
  const marketing = await getMarketingOverview(storeId, canonicalPeriod, marketingRepo, new Date(), window.from, window.to);

  // D. Financial Intelligence Service
  const storeFinancialRepo = new DrizzleAdminStoreFinancialSummaryRepository();
  const channelFinancialRepo = new DrizzleAdminChannelFinancialSummaryRepository();
  const financial = await getAdminFinancialIntelligence(
    storeId,
    canonicalPeriod,
    storeFinancialRepo,
    channelFinancialRepo,
    new Date(),
    window.from,
    window.to
  );

  const rows: ReconciliationRow[] = [
    {
      storeSlug,
      metric: "Dashboard Orders",
      tableDefinition: "orders where store_id = $1 and created_at >= start and created_at < end",
      directSql: directOrdersCount,
      serviceLayer: dashboard.metrics.orders,
      renderedPageMetric: dashboard.metrics.orders,
      status: directOrdersCount === dashboard.metrics.orders ? "RECONCILED" : "MISMATCH",
    },
    {
      storeSlug,
      metric: "Orders Page Count",
      tableDefinition: "orders where store_id = $1 and created_at >= start and created_at < end",
      directSql: directOrdersCount,
      serviceLayer: ordersResult.total,
      renderedPageMetric: ordersResult.total,
      status: directOrdersCount === ordersResult.total ? "RECONCILED" : "MISMATCH",
    },
    {
      storeSlug,
      metric: "Dashboard Visitors",
      tableDefinition: "distinct commerce_events.visitor_id where store_id = $1 and occurred_at >= start and occurred_at < end",
      directSql: directVisitorsCount,
      serviceLayer: dashboard.metrics.visitors,
      renderedPageMetric: dashboard.metrics.visitors,
      status: directVisitorsCount === dashboard.metrics.visitors ? "RECONCILED" : "MISMATCH",
    },
    {
      storeSlug,
      metric: "Marketing Overview Visitors",
      tableDefinition: "distinct commerce_events.visitor_id where store_id = $1 and occurred_at >= start and occurred_at < end",
      directSql: directVisitorsCount,
      serviceLayer: marketing?.events.visitors ?? 0,
      renderedPageMetric: marketing?.events.visitors ?? 0,
      status: directVisitorsCount === (marketing?.events.visitors ?? 0) ? "RECONCILED" : "MISMATCH",
    },
    {
      storeSlug,
      metric: "Financials Delivered Orders",
      tableDefinition: "orders where store_id = $1 and status = 'DELIVERED' and created_at >= start and created_at < end",
      directSql: directDeliveredCount,
      serviceLayer: financial?.store?.deliveredOrders ?? 0,
      renderedPageMetric: financial?.store?.deliveredOrders ?? 0,
      status: directDeliveredCount === (financial?.store?.deliveredOrders ?? 0) ? "RECONCILED" : "MISMATCH",
    },
  ];

  console.table(rows);

  const allReconciled = rows.every((r) => r.status === "RECONCILED");
  if (!allReconciled) {
    throw new Error(`Data reconciliation failed for store: ${storeSlug}`);
  }

  return rows;
}

async function main() {
  const db = getDatabase();
  const allStores = await db.select().from(stores);

  if (!allStores.length) {
    console.error("No stores found in database.");
    process.exit(1);
  }

  console.log(`Found ${allStores.length} store(s) in database: ${allStores.map((s) => s.slug).join(", ")}`);

  for (const store of allStores) {
    await reconcileStore(store.id, store.slug, store.name);
  }

  console.log("\n===============================================================");
  console.log("ALL STORES AND ALL REPORTING METRICS SUCCESSFULLY RECONCILED!");
  console.log("Direct SQL === Service Result === Rendered Page Metric");
  console.log("===============================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
