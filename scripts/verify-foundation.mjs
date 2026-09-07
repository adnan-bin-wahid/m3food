import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const schemaPath = resolve(root, "src/lib/db/schema.ts");
const contractsPath = resolve(root, "src/lib/commerce/contracts.ts");
const schema = readFileSync(schemaPath, "utf8");
const contracts = readFileSync(contractsPath, "utf8");

const requiredTables = [
  "stores",
  "products",
  "productVariants",
  "inventory",
  "customers",
  "visitors",
  "visitorSessions",
  "orders",
  "orderItems",
  "orderStatusHistory",
  "payments",
  "commerceEvents",
  "orderAttributions",
];

const missingTables = requiredTables.filter(
  (name) => !schema.includes(`export const ${name} = pgTable(`),
);
if (missingTables.length) {
  throw new Error(`Missing schema tables: ${missingTables.join(", ")}`);
}

const forbiddenBackendLiterals = ["1250", "1890", "চুইঝাল মিষ্টি মসলা"];
const backendSource = `${schema}\n${contracts}`;
const hardcoded = forbiddenBackendLiterals.filter((value) =>
  backendSource.includes(value),
);
if (hardcoded.length) {
  throw new Error(
    `Product-specific values leaked into reusable backend: ${hardcoded.join(", ")}`,
  );
}

for (const token of [
  "storeSlug",
  "variantId",
  "idempotencyKey",
  "visitorKey",
  "sessionKey",
  "utmSource",
  "fbclid",
  "gclid",
]) {
  if (!contracts.includes(token)) {
    throw new Error(`Landing order contract is missing: ${token}`);
  }
}

console.log("PART C BATCH 01 FOUNDATION VERIFIED");
console.log(`Schema tables: ${requiredTables.length}`);
console.log("Product-specific backend literals: none");
console.log("Landing order + attribution contracts: present");
