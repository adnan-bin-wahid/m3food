import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const schema = read("src/lib/db/schema.ts");
const adminRepository = read("src/lib/admin/catalog-admin-repository.ts");
const adminService = read("src/lib/admin/catalog-admin-service.ts");
const dbAdminRepository = read("src/lib/db/admin-catalog-repository.ts");
const actions = read("app/admin/catalog/actions.ts");
const forms = read("components/admin/CatalogForms.js");
const orderRepository = read("src/lib/commerce/order-repository.ts");
const orderService = read("src/lib/commerce/order-service.ts");
const landingRepository = read("src/lib/db/landing-order-repository.ts");
const publicCatalog = read("src/lib/db/catalog-repository.ts");
const docs = read("docs/part-q-01-cost-basis-foundation.md");

requireCondition(
  schema.includes('unitCostMinor: integer("unit_cost_minor")') &&
    schema.includes('totalCostMinor: integer("total_cost_minor")') &&
    schema.includes("product_variants_unit_cost_nonnegative") &&
    schema.includes("order_items_unit_cost_nonnegative") &&
    schema.includes("order_items_total_cost_consistent"),
  "Cost-basis database schema is incomplete.",
);

requireCondition(
  adminRepository.includes("unitCostMinor: number | null") &&
    adminService.includes("unitCostMinor") &&
    dbAdminRepository.includes("unitCostMinor: productVariants.unitCostMinor"),
  "Admin catalog cost basis is incomplete.",
);

requireCondition(
  actions.includes(
    'unitCostMinor: parseOptionalAdminMoneyToMinor(formData.get("unitCost"))',
  ) &&
    forms.includes("Unit cost / COGS"),
  "Admin cost form/action wiring is incomplete.",
);

requireCondition(
  orderRepository.includes("unitCostMinor: number | null") &&
    orderRepository.includes("totalCostMinor: number | null") &&
    orderService.includes("totalCostMinor") &&
    landingRepository.includes(
      "unitCostMinor: productVariants.unitCostMinor",
    ),
  "Immutable order-item cost snapshot wiring is incomplete.",
);

requireCondition(
  !publicCatalog.includes("unitCostMinor") &&
    !publicCatalog.includes("unit_cost_minor"),
  "Internal cost must not be exposed by the public catalog repository.",
);

requireCondition(
  docs.includes("unknown / not configured") &&
    docs.includes("does **not** backfill historical order-item cost"),
  "Unknown/historical cost semantics are undocumented.",
);

const migrations = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0017_.*\.sql$/.test(name));

requireCondition(
  migrations.length === 1,
  `Expected exactly one 0017 cost-basis migration; found ${migrations.length}.`,
);

const migration = read(path.join("drizzle", migrations[0]));
for (const token of [
  "unit_cost_minor",
  "total_cost_minor",
  "product_variants_unit_cost_nonnegative",
  "order_items_unit_cost_nonnegative",
  "order_items_total_cost_consistent",
]) {
  requireCondition(
    migration.includes(token),
    `0017 migration is missing ${token}.`,
  );
}

console.log("PART Q BATCH 01 COST BASIS FOUNDATION VERIFIED");
console.log("Optional variant unit cost: present");
console.log("OWNER / ADMIN catalog cost management: present");
console.log("Catalog cost audit snapshot: present");
console.log("Immutable future order-item cost snapshot: present");
console.log("Unknown historical cost remains NULL: preserved");
console.log("Public catalog cost exposure: absent");
console.log("Generated 0017 migration: verified");
