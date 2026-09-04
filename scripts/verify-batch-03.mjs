import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (filePath) =>
  readFileSync(resolve(process.cwd(), filePath), "utf8");
const schema = read("src/lib/db/schema.ts");
const database = read("src/lib/db/index.ts");
const environment = read("src/lib/config/server-env.ts");
const seedConfig = read("src/lib/db/store-config.ts");
const seedStore = read("src/lib/db/seed-store.ts");
const verifyStore = read("src/lib/db/verify-store.ts");
const m3foodConfig = JSON.parse(read("config/stores/m3food.json"));
const batchMigrations = readdirSync(resolve(process.cwd(), "drizzle")).filter(
  (name) => /^0002_.+\.sql$/.test(name),
);

if (batchMigrations.length !== 1) {
  throw new Error(
    `Expected one Batch 03 migration, found: ${batchMigrations.join(", ") || "none"}`,
  );
}

const migration = read(`drizzle/${batchMigrations[0]}`);
const schemaRlsCount = schema.match(/\.enableRLS\(\)/g)?.length ?? 0;
const migrationRlsCount =
  migration.match(/ENABLE ROW LEVEL SECURITY/g)?.length ?? 0;

if (schemaRlsCount < 13 || migrationRlsCount !== 13) {
  throw new Error(
    `Expected RLS on 13 tables; schema=${schemaRlsCount}, migration=${migrationRlsCount}.`,
  );
}

for (const token of ["MIGRATION_DATABASE_URL", "DATABASE_URL"]) {
  if (!environment.includes(token)) {
    throw new Error(`Supabase environment invariant missing: ${token}`);
  }
}

for (const token of ["max: 1", "prepare: false"]) {
  if (!database.includes(token)) {
    throw new Error(`Supabase pooler invariant missing: ${token}`);
  }
}

for (const token of [
  "exactly one default variant",
  "Product slugs must be unique",
  "Variant SKUs must be unique",
]) {
  if (!seedConfig.includes(token)) {
    throw new Error(`Reusable seed validation missing: ${token}`);
  }
}

for (const token of [
  ".transaction(",
  ".onConflictDoUpdate(",
  "productVariants",
  "inventory",
]) {
  if (!seedStore.includes(token)) {
    throw new Error(`Idempotent seed invariant missing: ${token}`);
  }
}

for (const token of ["pg_catalog.pg_class", "relrowsecurity", "verifyStore"]) {
  if (!verifyStore.includes(token)) {
    throw new Error(`Live verification invariant missing: ${token}`);
  }
}

const variant = m3foodConfig.products?.[0]?.variants?.[0];
if (
  m3foodConfig.store?.slug !== "m3food" ||
  m3foodConfig.store?.currency !== "BDT" ||
  variant?.priceMinor !== 125000 ||
  variant?.compareAtPriceMinor !== 189000 ||
  variant?.trackStock !== false
) {
  throw new Error("M3Food seed configuration does not match the landing offer.");
}

const reusableBackend = [seedConfig, seedStore, verifyStore, database].join("\n");
for (const productLiteral of ["M3Food", "M3F-CMM-001", "125000", "189000"]) {
  if (reusableBackend.includes(productLiteral)) {
    throw new Error(
      `Product-specific value leaked into reusable backend: ${productLiteral}`,
    );
  }
}

console.log("PART C BATCH 03 SUPABASE BOOTSTRAP VERIFIED");
console.log("Runtime and migration credentials: separated");
console.log("Public tables protected by RLS: 13");
console.log("Reusable idempotent store seed: present");
console.log("Live data verification: present");
