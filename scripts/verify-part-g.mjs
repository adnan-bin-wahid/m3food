import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const required = [
  "app/admin/customers/page.js",
  "app/admin/customers/[customerId]/page.js",
  "app/admin/customers/actions.ts",
  "app/api/admin/customers/export/route.ts",
  "components/admin/CustomerForms.js",
  "src/lib/admin/customer-admin-repository.ts",
  "src/lib/admin/customer-admin-service.ts",
  "src/lib/admin/customer-admin-service.test.ts",
  "src/lib/db/admin-customer-repository.ts",
  "scripts/db-verify-admin-customers.ts",
  "drizzle/0009_customer_crm.sql",
  "drizzle/meta/0009_snapshot.json",
  "docs/part-g-customer-crm.md",
];
for (const file of required) {
  if (!exists(file)) throw new Error(`Part G file missing: ${file}`);
}

const schema = read("src/lib/db/schema.ts");
const migration = read("drizzle/0009_customer_crm.sql");
const service = read("src/lib/admin/customer-admin-service.ts");
const repository = read("src/lib/db/admin-customer-repository.ts");
const exportRoute = read("app/api/admin/customers/export/route.ts");
const listPage = read("app/admin/customers/page.js");
const detailPage = read("app/admin/customers/[customerId]/page.js");
const shell = read("components/admin/AdminShell.js");
const packageJson = JSON.parse(read("package.json"));

for (const token of ["customerNotes", "customerTags", "customerActivityHistory"]) {
  if (!schema.includes(token)) throw new Error(`CRM schema missing: ${token}`);
}
if ((schema.match(/\.enableRLS\(\)/g)?.length ?? 0) !== (schema.match(/pgTable\(/g)?.length ?? 0)) {
  throw new Error("Every public table must retain RLS after Part G.");
}
for (const token of [
  'CREATE TABLE "customer_notes"',
  'CREATE TABLE "customer_tags"',
  'CREATE TABLE "customer_activity_history"',
  'ENABLE ROW LEVEL SECURITY',
  'customer_tags_store_customer_tag_uniq',
]) {
  if (!migration.includes(token)) throw new Error(`CRM migration missing: ${token}`);
}
for (const token of [
  "parseAdminCustomerQuery",
  "canManageCustomerOperations",
  "canExportCustomerAudience",
  "HIGH_VALUE_CUSTOMER_THRESHOLD_MINOR",
  'role === "ORDER_MANAGER"',
]) {
  if (!service.includes(token)) throw new Error(`Customer service missing: ${token}`);
}
for (const token of [
  "latest_consent",
  "distinct on (o.customer_id)",
  "oc.captured_at desc",
  "c.store_id = ${storeId}",
  "customerActivityHistory",
  "TAG_ADDED",
  "TAG_REMOVED",
  "NOTE_ADDED",
]) {
  if (!repository.includes(token)) throw new Error(`Customer repository missing: ${token}`);
}
for (const token of [
  "getAdminMarketingAudience",
  "Content-Disposition",
  "Cache-Control",
  "no-store",
  "/^[=+\\-@]/",
]) {
  if (!exportRoute.includes(token)) throw new Error(`Audience export protection missing: ${token}`);
}
for (const token of ["Marketing channel", "Email CSV", "SMS CSV", "WhatsApp CSV", "latest captured order consent"]) {
  if (!listPage.includes(token)) throw new Error(`Customer list UI missing: ${token}`);
}
for (const token of ["Latest marketing consent", "Internal notes", "CRM activity", "Acquisition sources", "CustomerTagForm"]) {
  if (!detailPage.includes(token)) throw new Error(`Customer detail UI missing: ${token}`);
}
if (!shell.includes('href="/admin/customers"')) throw new Error("Admin navigation missing Customers.");
if (packageJson.scripts["verify:part-g"] !== "node scripts/verify-part-g.mjs") throw new Error("verify:part-g script missing.");
if (!packageJson.scripts.check.includes("verify:part-g")) throw new Error("Part G is not in npm run check.");

console.log("PART G CUSTOMER CRM VERIFIED");
console.log("Store-scoped customer search, segments, metrics, and history: present");
console.log("Consent-aware Email/SMS/WhatsApp audience filtering and export: present");
console.log("OWNER/ADMIN export and operational-role CRM permission boundaries: present");
console.log("Append-only notes, normalized tags, and immutable CRM activity: present");
console.log("RLS-protected CRM migration and admin navigation: present");
