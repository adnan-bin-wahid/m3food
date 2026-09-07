import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const schema = read("src/lib/db/schema.ts");
const database = read("src/lib/db/index.ts");
const service = read("src/lib/commerce/order-service.ts");
const repository = read("src/lib/db/landing-order-repository.ts");
const batchMigrations = readdirSync(resolve(process.cwd(), "drizzle"))
  .filter((name) => /^0001_.+\.sql$/.test(name));

if (batchMigrations.length !== 1) {
  throw new Error(
    `Expected one Batch 02 migration, found: ${batchMigrations.join(", ") || "none"}`,
  );
}

const migration = read(`drizzle/${batchMigrations[0]}`);

for (const token of [
  'requestHash: varchar("request_hash", { length: 64 }).notNull()',
  'uniqueIndex("orders_store_idempotency_uniq")',
]) {
  if (!schema.includes(token)) throw new Error(`Schema invariant missing: ${token}`);
}

for (const token of [
  'ADD COLUMN "request_hash" varchar(64) NOT NULL',
  'ALTER COLUMN "source" SET NOT NULL',
  'CONSTRAINT "orders_total_consistent"',
  'CONSTRAINT "order_items_total_consistent"',
  'CONSTRAINT "inventory_reserved_nonnegative"',
]) {
  if (!migration.includes(token)) {
    throw new Error(`Database migration invariant missing: ${token}`);
  }
}

if (!database.includes('drizzle-orm/postgres-js')) {
  throw new Error("Database driver is not transaction-capable postgres-js.");
}

for (const token of [
  "fingerprintLandingOrder",
  "IDEMPOTENCY_CONFLICT",
  "reserveStock",
  "insertOrderGraph",
]) {
  if (!service.includes(token)) throw new Error(`Order service invariant missing: ${token}`);
}

for (const token of [
  ".transaction(",
  "orders_store_idempotency_uniq",
  "commerceEvents",
  "orderAttributions",
  "orderStatusHistory",
  "payments",
]) {
  if (!repository.includes(token)) {
    throw new Error(`Persistence invariant missing: ${token}`);
  }
}

console.log("PART C BATCH 02 TRANSACTIONAL ORDER CORE VERIFIED");
console.log("Idempotency payload fingerprint: present");
console.log("Conditional stock reservation: present");
console.log("Atomic order graph persistence: present");
