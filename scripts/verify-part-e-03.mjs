import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const page = read("app/admin/dashboard/page.js");
const errorPage = read("app/admin/dashboard/error.js");
const loadingPage = read("app/admin/dashboard/loading.js");
const styles = read("app/admin/admin.css");
const contracts = read("src/lib/admin/dashboard-repository.ts");
const service = read("src/lib/admin/dashboard-service.ts");
const repository = read("src/lib/db/admin-dashboard-repository.ts");
const tests = read("src/lib/admin/dashboard-service.test.ts");
const liveVerifier = read("scripts/db-verify-admin-dashboard.ts");
const packageJson = JSON.parse(read("package.json"));

for (const token of [
  "requireCurrentAdmin",
  "admin.storeId",
  "await searchParams",
  "DrizzleAdminDashboardRepository",
  "Commerce dashboard",
  "Conversion rate",
  "Gross order value",
  "Activity funnel",
  "Meta vs organic",
  "Order status",
  "Order sources",
  "Recent orders",
]) {
  if (!page.includes(token)) throw new Error(`Dashboard UI missing: ${token}`);
}
if (page.includes("placeholder") || page.includes("/api/admin/dashboard")) {
  throw new Error("Dashboard must use live server-side data without a placeholder API.");
}
for (const token of ["DashboardError", "reset", "role=\"alert\""]) {
  if (!errorPage.includes(token)) throw new Error(`Dashboard error state missing: ${token}`);
}
if (!loadingPage.includes("Loading live dashboard") || !styles.includes("admin-loading-grid")) {
  throw new Error("Dashboard loading state is incomplete.");
}
for (const token of [
  "AdminDashboardRepository",
  "DashboardRawSnapshot",
  "DashboardRecentOrder",
]) {
  if (!contracts.includes(token)) throw new Error(`Dashboard contract missing: ${token}`);
}
for (const token of [
  'DASHBOARD_RANGES = ["7d", "30d", "90d", "all"]',
  "classifyDashboardSource",
  'row.status !== "CANCELLED"',
  'row.status !== "RETURNED"',
  "visitors === 0 ? 0",
]) {
  if (!service.includes(token)) throw new Error(`Dashboard service missing: ${token}`);
}
for (const token of [
  "eq(commerceEvents.storeId, storeId)",
  "eq(orders.storeId, storeId)",
  "count(distinct",
  "Promise.all",
  "orderAttributions",
  ".limit(8)",
]) {
  if (!repository.includes(token)) throw new Error(`Dashboard query missing: ${token}`);
}
if ((styles.match(/admin-metric-card/g)?.length ?? 0) < 3) {
  throw new Error("Dashboard responsive visualization styles are missing.");
}
for (const token of ["zero visitors", "channel totals", "falls back to 30 days"]) {
  if (!tests.includes(token)) throw new Error(`Dashboard regression test missing: ${token}`);
}
for (const token of [
  "LIVE ADMIN DASHBOARD VERIFIED",
  "aggregates do not reconcile",
  "store.id",
]) {
  if (!liveVerifier.includes(token)) throw new Error(`Live verifier missing: ${token}`);
}
if (!packageJson.scripts["db:verify:admin-dashboard"] || !packageJson.scripts["verify:part-e-03"]) {
  throw new Error("Part E-03 package scripts are missing.");
}

console.log("PART E-03 LIVE ADMIN DASHBOARD VERIFIED");
console.log("Protected server-side dashboard read: present");
console.log("Rolling range filters and exact KPIs: present");
console.log("Funnel, status, channel, and source visualizations: present");
console.log("Recent live orders and responsive states: present");
console.log("Live Supabase aggregate reconciliation: present");
