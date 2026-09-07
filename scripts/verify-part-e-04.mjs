import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const migrationFiles = readdirSync(resolve(root, "drizzle")).filter((name) =>
  /^0006_.*\.sql$/.test(name),
);
if (migrationFiles.length !== 1) {
  throw new Error(`Expected one Part E-04 migration, found ${migrationFiles.length}.`);
}

const migration = read(`drizzle/${migrationFiles[0]}`);
const schema = read("src/lib/db/schema.ts");
const service = read("src/lib/admin/order-admin-service.ts");
const repository = read("src/lib/db/admin-order-repository.ts");
const listPage = read("app/admin/orders/page.js");
const detailPage = read("app/admin/orders/[publicId]/page.js");
const errorPage = read("app/admin/orders/error.js");
const loadingPage = read("app/admin/orders/loading.js");
const action = read("app/admin/orders/actions.ts");
const form = read("components/admin/OrderStatusForm.js");
const tests = read("src/lib/admin/order-admin-service.test.ts");
const liveVerifier = read("scripts/db-verify-admin-orders.ts");
const docs = read("docs/part-e-04-order-operations.md");
const packageJson = JSON.parse(read("package.json"));

for (const token of [
  "changed_by_admin_user_id",
  "changed_by_admin_email",
  "order_status_history_admin_idx",
]) {
  if (!migration.includes(token)) throw new Error(`Audit migration missing: ${token}`);
}
for (const token of [
  "changedByAdminUserId",
  "changedByAdminEmail",
  "order_status_history_admin_idx",
]) {
  if (!schema.includes(token)) throw new Error(`Audit schema missing: ${token}`);
}
for (const token of [
  "OWNER",
  "ADMIN",
  "ORDER_MANAGER",
  "canTransitionOrder",
  "getOrderInventoryEffect",
  "STATUS_CONFLICT",
  "INVENTORY_CONFLICT",
]) {
  if (!service.includes(token)) throw new Error(`Order service missing: ${token}`);
}
for (const token of [
  "this.database.transaction",
  '.for("update")',
  "eq(orders.storeId, input.storeId)",
  "inventory.reserved",
  "inventory.available",
  "changedByAdminUserId",
  "changedByAdminEmail",
  "StatusConflictError",
]) {
  if (!repository.includes(token)) throw new Error(`Order transaction missing: ${token}`);
}
for (const [content, tokens, label] of [
  [listPage, ["requireCurrentAdmin", "await searchParams", "admin.storeId", "DrizzleAdminOrderRepository", "Order ID, customer, or phone", "Page {query.page}"], "list page"],
  [detailPage, ["requireCurrentAdmin", "await params", "admin.storeId", "Items and totals", "Status timeline", "Attribution and consent", "OrderStatusForm"], "detail page"],
  [action, ['"use server"', "getCurrentAdmin", "transitionAdminOrder", "revalidatePath"], "server action"],
  [form, ["use client", "useActionState", "maxLength={500}", "aria-live"], "status form"],
]) {
  for (const token of tokens) {
    if (!content.includes(token)) throw new Error(`Admin ${label} missing: ${token}`);
  }
}
if (existsSync(resolve(root, "app/api/admin/orders"))) {
  throw new Error("Order mutation must remain an authenticated Server Action, not a public API.");
}
if (!errorPage.includes('role="alert"') || !errorPage.includes("reset")) {
  throw new Error("Order database error recovery state is incomplete.");
}
if (!loadingPage.includes('aria-live="polite"')) {
  throw new Error("Order loading state is incomplete.");
}
for (const token of [
  "ANALYST",
  "RELEASE_RESERVATION",
  "COMMIT_RESERVATION",
  "RESTOCK",
  "immutable actor snapshot",
  "fail closed",
]) {
  if (!tests.includes(token)) throw new Error(`Order regression test missing: ${token}`);
}
for (const token of [
  "batch05_live_order_flow_v2",
  "LIVE ADMIN ORDER OPERATIONS VERIFIED",
  "foreignStoreId",
  "changedByAdminEmail",
]) {
  if (!liveVerifier.includes(token)) throw new Error(`Live order verifier missing: ${token}`);
}
if (!docs.includes("inventory-safe") || !docs.includes("synthetic")) {
  throw new Error("Part E-04 operational documentation is incomplete.");
}
if (
  !packageJson.scripts["db:verify:admin-orders"] ||
  !packageJson.scripts["verify:part-e-04"] ||
  !packageJson.scripts.check.includes("verify:part-e-04")
) {
  throw new Error("Part E-04 package scripts are missing.");
}

console.log("PART E-04 ADMIN ORDER OPERATIONS VERIFIED");
console.log("Store-scoped list, filters, pagination, and detail graph: present");
console.log("Role-gated lifecycle transitions and stale-write protection: present");
console.log("Atomic inventory effects and immutable admin audit snapshots: present");
console.log("Protected responsive UI and Server Action mutation: present");
console.log("Live synthetic-order and cross-store verification: present");
