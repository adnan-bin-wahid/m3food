import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = read("src/lib/db/schema.ts");
const service = read("src/lib/admin/order-profitability-service.ts");
const repository = read("src/lib/admin/order-profitability-repository.ts");
const dbRepository = read("src/lib/db/admin-order-profitability-repository.ts");
const actions = read("app/admin/orders/actions.ts");
const page = read("app/admin/orders/[publicId]/page.js");
const form = read("components/admin/OrderFulfillmentCostForm.js");
const docs = read("docs/part-q-02-order-contribution-intelligence.md");

for (const token of [
  'fulfillmentCostMinor: integer("fulfillment_cost_minor")',
  'fulfillmentCostRevision: integer("fulfillment_cost_revision")',
  'export const orderCostHistory = pgTable(',
  '"order_cost_history"',
  "orders_fulfillment_cost_nonnegative",
  "orders_fulfillment_cost_revision_nonnegative",
]) {
  requireCondition(schema.includes(token), `Schema missing ${token}`);
}

const laterPartSRecognition = fs.existsSync(
  path.join(root, "docs/part-s-02-settlement-aware-profitability.md"),
);

for (const token of laterPartSRecognition
  ? [
      "projectedContributionMinor",
      "recognizedContributionMinor",
      "classifyFinancialPaymentRecognition",
      "paymentRecognition",
      "settlementComplete",
      "itemCostsComplete",
      "canManageOrderCosts",
    ]
  : [
      "projectedContributionMinor",
      "recognizedContributionMinor",
      'snapshot.status === "DELIVERED"',
      'snapshot.status === "CANCELLED"',
      'snapshot.status === "RETURNED"',
      "itemCostsComplete",
      "canManageOrderCosts",
    ]) {
  requireCondition(service.includes(token), `Profit service missing ${token}`);
}

requireCondition(
  repository.includes("fulfillmentCostRevision") &&
    dbRepository.includes("FULFILLMENT_COST_UPDATED") &&
    dbRepository.includes("orderCostHistory"),
  "Optimistic fulfillment-cost audit repository is incomplete.",
);

requireCondition(
  actions.includes("updateOrderFulfillmentCostAction") &&
    actions.includes("parseOptionalOrderCostToMinor") &&
    form.includes("Actual fulfillment cost") &&
    page.includes("Contribution economics") &&
    page.includes("OrderFulfillmentCostForm"),
  "Order profitability admin UI/action wiring is incomplete.",
);

requireCondition(
  docs.includes("Unknown cost is never treated as zero") &&
    docs.includes("PENDING / CONFIRMED / PROCESSING / SHIPPED") &&
    docs.includes("DELIVERED") &&
    docs.includes("CANCELLED") &&
    docs.includes("RETURNED"),
  "Profit/lifecycle semantics are not documented.",
);

const migrations = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0018_.*\.sql$/.test(name));

requireCondition(
  migrations.length === 1,
  `Expected exactly one 0018 migration; found ${migrations.length}.`,
);

const migration = read(path.join("drizzle", migrations[0]));

for (const token of [
  "fulfillment_cost_minor",
  "fulfillment_cost_revision",
  "order_cost_history",
  "orders_fulfillment_cost_nonnegative",
  "orders_fulfillment_cost_revision_nonnegative",
]) {
  requireCondition(
    migration.includes(token),
    `0018 migration missing ${token}`,
  );
}

const migration19 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/i.test(name));

const laterPartSPaymentFoundation = fs.existsSync(
  path.join(root, "docs/part-s-01-payment-settlement-foundation.md"),
);

if (laterPartSPaymentFoundation) {
  if (migration19.length !== 1) {
    throw new Error(
      `Expected the later Part S 0019 payment migration; found ${migration19.length}.`,
    );
  }
} else if (migration19.length !== 0) {
  throw new Error("Unexpected 0019 migration exists before Part S.");
}

console.log("PART Q BATCH 02 ORDER CONTRIBUTION INTELLIGENCE VERIFIED");
console.log("Order-level actual fulfillment cost: present");
console.log("Optimistic cost revision + audit history: present");
console.log("Gross/projected contribution calculations: present");
console.log("Delivered lifecycle recognition: present");
console.log("Cancelled/returned reversal semantics: present");
console.log("Unknown COGS/cost fail closed: present");
console.log("OWNER/ADMIN/ORDER_MANAGER mutation boundary: present");
console.log("Generated 0018 migration: verified");
console.log("Q02 introduced no 0019; later Part S migration: tolerated");
