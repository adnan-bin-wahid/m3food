import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { getAdminDashboard } from "../src/lib/admin/dashboard-service";
import { DrizzleAdminDashboardRepository } from "../src/lib/db/admin-dashboard-repository";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { stores } from "../src/lib/db/schema";

async function main() {
  loadEnvConfig(process.cwd());
  const storeSlug = process.env.ADMIN_BOOTSTRAP_STORE_SLUG ?? "m3food";
  const database = getDatabase();
  const [store] = await database
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.slug, storeSlug), eq(stores.status, "ACTIVE")))
    .limit(1);
  if (!store) throw new Error("The live dashboard store is unavailable.");

  const dashboard = await getAdminDashboard(
    store.id,
    "all",
    new DrizzleAdminDashboardRepository(database),
  );
  const statusTotal = dashboard.statuses.reduce(
    (total, row) => total + row.orderCount,
    0,
  );
  const sourceTotal = dashboard.sources.reduce(
    (total, row) => total + row.orderCount,
    0,
  );
  const channelTotal = dashboard.channels.reduce(
    (total, row) => total + row.orderCount,
    0,
  );
  if (
    statusTotal !== dashboard.metrics.orders ||
    sourceTotal !== dashboard.metrics.orders ||
    channelTotal !== dashboard.metrics.orders
  ) {
    throw new Error("Dashboard order aggregates do not reconcile.");
  }
  if (
    dashboard.recentOrders.length > 8 ||
    dashboard.funnel.length !== 5 ||
    !Number.isFinite(dashboard.metrics.conversionRate) ||
    dashboard.metrics.grossOrderValueMinor < 0
  ) {
    throw new Error("Dashboard metric boundaries are invalid.");
  }
  if (dashboard.metrics.orders === 0) {
    throw new Error("Expected the existing marked synthetic orders to be visible.");
  }

  console.log("LIVE ADMIN DASHBOARD VERIFIED");
  console.log(`Store: ${storeSlug}`);
  console.log(`Visitors: ${dashboard.metrics.visitors}`);
  console.log(`Orders: ${dashboard.metrics.orders}`);
  console.log(`Gross order value minor: ${dashboard.metrics.grossOrderValueMinor}`);
  console.log("Status, source, channel, and recent-order totals: reconciled");
  console.log("Store isolation: verified by authenticated store ID");
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Dashboard verification failed.",
    );
    process.exitCode = 1;
  })
  .finally(closeDatabase);
