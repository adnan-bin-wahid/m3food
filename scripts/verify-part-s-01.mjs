import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = read("src/lib/db/schema.ts");
const service = read("src/lib/admin/payment-settlement-service.ts");
const repository = read("src/lib/admin/payment-settlement-repository.ts");
const dbRepository = read("src/lib/db/admin-payment-settlement-repository.ts");
const actions = read("app/admin/orders/actions.ts");
const page = read("app/admin/orders/[publicId]/page.js");
const form = read("components/admin/OrderPaymentStatusForm.js");
const docs = read("docs/part-s-01-payment-settlement-foundation.md");
const packageJson = read("package.json");

for (const token of [
  'revision: integer("revision").notNull().default(0)',
  'export const paymentStatusHistory = pgTable(',
  '"payment_status_history"',
  "payments_revision_nonnegative",
  "payment_status_history_store_time_idx",
  "payment_status_history_payment_time_idx",
]) {
  requireCondition(schema.includes(token), `Schema missing ${token}`);
}

for (const token of [
  "PAYMENT_TRANSITIONS",
  'UNPAID: ["PENDING", "PAID", "FAILED"]',
  'PENDING: ["UNPAID", "PAID", "FAILED"]',
  'FAILED: ["UNPAID", "PENDING", "PAID"]',
  'PAID: ["REFUNDED"]',
  "REFUNDED: []",
  "canManagePaymentSettlement",
  "statusConsistent",
  "expectedRevision",
]) {
  requireCondition(service.includes(token), `Payment service missing ${token}`);
}

requireCondition(
  repository.includes("expectedPaymentId") &&
    repository.includes("expectedStatus") &&
    repository.includes("expectedRevision"),
  "Payment repository contract is missing concurrency guards.",
);

for (const token of [
  '.for("update")',
  "desc(payments.createdAt)",
  "desc(payments.id)",
  "eq(payments.revision, input.expectedRevision)",
  "eq(payments.status, input.expectedStatus)",
  "paymentStatus: input.toStatus",
  "paymentStatusHistory",
]) {
  requireCondition(dbRepository.includes(token), `DB settlement repository missing ${token}`);
}

requireCondition(
  actions.includes("updateOrderPaymentStatusAction") &&
    actions.includes("updateAdminPaymentSettlement") &&
    page.includes("OrderPaymentStatusForm") &&
    page.includes("Payment settlement data is inconsistent") &&
    form.includes("Reconcile payment status"),
  "Payment settlement admin wiring is incomplete.",
);

for (const token of [
  "S01 does not change Part Q/R profitability recognition yet",
  "OWNER",
  "ORDER_MANAGER",
  "latest payment identity",
  "immutable `payment_status_history`",
]) {
  requireCondition(docs.includes(token), `S01 docs missing ${token}`);
}

requireCondition(
  packageJson.includes('"verify:part-s-01"') &&
    packageJson.includes('"db:verify:part-s-01"') &&
    (packageJson.includes("npm run verify:part-r-03 && npm run verify:part-s-01 && npm run test:domain") ||
      packageJson.includes("npm run verify:part-r-03 && npm run verify:part-s-01 && npm run verify:part-s-02 && npm run test:domain")),
  "package.json is missing Part S verification wiring.",
);

const migrations = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/.test(name));
requireCondition(migrations.length === 1, `Expected exactly one 0019 migration; found ${migrations.length}.`);

const migration = read(path.join("drizzle", migrations[0]));
for (const token of [
  "payment_status_history",
  "payments",
  "revision",
  "payments_revision_nonnegative",
  "ENABLE ROW LEVEL SECURITY",
]) {
  requireCondition(migration.includes(token), `0019 migration missing ${token}`);
}

requireCondition(
  fs.existsSync(path.join(root, "drizzle/meta/0019_snapshot.json")),
  "0019 Drizzle snapshot is missing.",
);

const migration20 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0020_.*\.sql$/.test(name));
requireCondition(migration20.length === 0, "Unexpected 0020 migration exists.");

console.log("PART S BATCH 01 PAYMENT SETTLEMENT FOUNDATION VERIFIED");
console.log("Payment revision guard: present");
console.log("Latest-payment identity guard: present");
console.log("Atomic payment/order status sync: present");
console.log("Immutable payment audit history: present");
console.log("OWNER/ADMIN/ORDER_MANAGER mutation boundary: present");
console.log("Payment admin form/action: present");
console.log("S01 financial-recognition boundary: preserved");
console.log("Generated 0019 migration: verified");
console.log("0020 migration: absent");
