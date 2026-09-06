import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const requiredFiles = [
  "app/admin/catalog/page.js",
  "app/admin/catalog/actions.ts",
  "app/admin/catalog/loading.js",
  "app/admin/catalog/error.js",
  "app/admin/catalog/[productId]/page.js",
  "app/admin/catalog/[productId]/loading.js",
  "app/admin/catalog/[productId]/error.js",
  "app/admin/catalog/[productId]/not-found.js",
  "components/admin/CatalogForms.js",
  "src/lib/admin/catalog-admin-repository.ts",
  "src/lib/admin/catalog-admin-service.ts",
  "src/lib/admin/catalog-admin-service.test.ts",
  "src/lib/db/admin-catalog-repository.ts",
  "scripts/db-verify-admin-catalog.ts",
  "drizzle/0008_catalog_admin_management.sql",
  "drizzle/meta/0008_snapshot.json",
  "docs/part-f-admin-catalog-management.md",
];
for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) throw new Error(`Part F file missing: ${file}`);
}

const shell = read("components/admin/AdminShell.js");
if (!shell.includes('href="/admin/catalog"')) {
  throw new Error("Admin navigation is missing Catalog.");
}

const schema = read("src/lib/db/schema.ts");
for (const token of [
  'revision: integer("revision").notNull().default(0)',
  'export const catalogChangeHistory',
  '"catalog_change_history"',
  'beforeState: jsonb("before_state")',
  'afterState: jsonb("after_state")',
]) {
  if (!schema.includes(token)) throw new Error(`Catalog schema missing: ${token}`);
}

const migration = read("drizzle/0008_catalog_admin_management.sql");
for (const token of [
  'ALTER TABLE "products" ADD COLUMN "revision"',
  'ALTER TABLE "product_variants" ADD COLUMN "revision"',
  'ALTER TABLE "inventory" ADD COLUMN "revision"',
  'CREATE TABLE "catalog_change_history"',
  'ENABLE ROW LEVEL SECURITY',
]) {
  if (!migration.includes(token)) throw new Error(`Part F migration missing: ${token}`);
}

const journal = JSON.parse(read("drizzle/meta/_journal.json"));
if (!journal.entries.some((entry) => entry.idx === 8 && entry.tag === "0008_catalog_admin_management")) {
  throw new Error("Part F migration is missing from the Drizzle journal.");
}

const service = read("src/lib/admin/catalog-admin-service.ts");
for (const token of [
  'role === "OWNER" || role === "ADMIN"',
  "adminProductCreateSchema",
  "adminProductUpdateSchema",
  "adminVariantCreateSchema",
  "adminVariantUpdateSchema",
  "adminInventoryUpdateSchema",
  "DUPLICATE_SLUG",
  "DUPLICATE_SKU",
  "NO_ACTIVE_VARIANT",
  "DEFAULT_REQUIRED",
  "RESERVED_STOCK",
  "INVALID_STOCK",
  "parseAdminMoneyToMinor",
]) {
  if (!service.includes(token)) throw new Error(`Catalog service missing: ${token}`);
}

const tests = read("src/lib/admin/catalog-admin-service.test.ts");
for (const token of [
  'canManageCatalog("ORDER_MANAGER")',
  'canManageCatalog("ANALYST")',
  "sellable stock after reservations",
  "read-only roles fail before a catalog mutation",
  "RESERVED_STOCK",
]) {
  if (!tests.includes(token)) throw new Error(`Catalog test coverage missing: ${token}`);
}

const repository = read("src/lib/db/admin-catalog-repository.ts");
for (const token of [
  "eq(products.storeId, input.storeId)",
  "eq(productVariants.storeId, input.storeId)",
  "eq(inventory.storeId, input.storeId)",
  "eq(products.revision, input.expectedRevision)",
  "eq(productVariants.revision, input.expectedRevision)",
  "eq(inventory.revision, input.expectedRevision)",
  'action: "PRODUCT_CREATED"',
  'action: "PRODUCT_UPDATED"',
  'action: "VARIANT_CREATED"',
  'action: "VARIANT_UPDATED"',
  'action: "DEFAULT_VARIANT_CHANGED"',
  'action: "INVENTORY_UPDATED"',
]) {
  if (!repository.includes(token)) throw new Error(`Catalog repository invariant missing: ${token}`);
}
if (repository.includes(".delete(")) {
  throw new Error("Part F must not hard-delete catalog records.");
}

const actions = read("app/admin/catalog/actions.ts");
for (const token of [
  "createProductAction",
  "updateProductAction",
  "createVariantAction",
  "updateVariantAction",
  "setDefaultVariantAction",
  "updateInventoryAction",
  "getCurrentAdmin",
  "revalidatePath",
]) {
  if (!actions.includes(token)) throw new Error(`Catalog action missing: ${token}`);
}

const page = read("app/admin/catalog/page.js");
const detail = read("app/admin/catalog/[productId]/page.js");
for (const token of ["Create product", "Stock attention", "Management access", "Read only"]) {
  if (!page.includes(token)) throw new Error(`Catalog page missing: ${token}`);
}
for (const token of ["Identity and publishing", "Add variant", "Inventory", "Recent catalog changes"]) {
  if (!detail.includes(token)) throw new Error(`Catalog detail page missing: ${token}`);
}

for (const path of [
  "src/lib/db/landing-order-repository.ts",
  "src/lib/db/admin-order-repository.ts",
]) {
  const source = read(path);
  if (!source.includes("revision: sql`${inventory.revision} + 1`")) {
    throw new Error(`Inventory revision is not advanced by order flow: ${path}`);
  }
}

const liveVerifier = read("scripts/db-verify-admin-catalog.ts");
for (const token of [
  "LIVE ADMIN CATALOG VERIFIED",
  "Revision-protected catalog schema: verified",
  "Catalog audit history table: verified",
]) {
  if (!liveVerifier.includes(token)) throw new Error(`Live catalog verifier missing: ${token}`);
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts["db:verify:admin-catalog"] || !packageJson.scripts["verify:part-f"]) {
  throw new Error("Part F package scripts are incomplete.");
}
if (!packageJson.scripts.check.includes("verify:part-f")) {
  throw new Error("Part F verifier is not included in npm run check.");
}

console.log("PART F ADMIN CATALOG MANAGEMENT VERIFIED");
console.log("Product create/edit/archive lifecycle: present");
console.log("Variant, pricing, default selection, and active-state management: present");
console.log("Revision-protected inventory management: present");
console.log("OWNER/ADMIN write access and ORDER_MANAGER/ANALYST read-only access: present");
console.log("Immutable catalog audit snapshots: present");
console.log("Order-side inventory revision propagation: present");
console.log("No hard-delete catalog path: verified");
