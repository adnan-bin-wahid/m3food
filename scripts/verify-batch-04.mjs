import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (filePath) =>
  readFileSync(resolve(process.cwd(), filePath), "utf8");
const schema = read("src/lib/db/schema.ts");
const orderRoute = read("app/api/v1/orders/route.ts");
const catalogRoute = read(
  "app/api/v1/stores/[storeSlug]/catalog/route.ts",
);
const orderHandler = read("src/lib/http/order-handler.ts");
const requestBody = read("src/lib/http/request-body.ts");
const rateLimiter = read("src/lib/db/rate-limiter.ts");
const catalogRepository = read("src/lib/db/catalog-repository.ts");
const liveVerifier = read("scripts/db-verify-api.ts");
const batchMigrations = readdirSync(resolve(process.cwd(), "drizzle")).filter(
  (name) => /^0003_.+\.sql$/.test(name),
);

if (batchMigrations.length !== 1) {
  throw new Error(
    `Expected one Batch 04 migration, found: ${batchMigrations.join(", ") || "none"}`,
  );
}

const migration = read(`drizzle/${batchMigrations[0]}`);
for (const token of [
  'CREATE TABLE "request_rate_limits"',
  'ENABLE ROW LEVEL SECURITY',
  'request_rate_limits_scope_key_uniq',
  'request_rate_limits_count_positive',
]) {
  if (!migration.includes(token)) {
    throw new Error(`Rate-limit migration invariant missing: ${token}`);
  }
}

if ((schema.match(/\.enableRLS\(\)/g)?.length ?? 0) < 14) {
  throw new Error("Expected the 14-table Batch 04 baseline to retain RLS.");
}

for (const route of [orderRoute, catalogRoute]) {
  for (const token of ['runtime = "nodejs"', 'dynamic = "force-dynamic"']) {
    if (!route.includes(token)) {
      throw new Error(`Route runtime invariant missing: ${token}`);
    }
  }
}

for (const token of [
  "Idempotency-Key header is required",
  "MAX_ORDER_BODY_BYTES",
  "ORDER_RATE_LIMIT",
  "X-RateLimit-Remaining",
  "safeServerError",
]) {
  if (!orderHandler.includes(token)) {
    throw new Error(`Order HTTP invariant missing: ${token}`);
  }
}

for (const token of ["request.body.getReader()", "PAYLOAD_TOO_LARGE", "INVALID_JSON"]) {
  if (!requestBody.includes(token)) {
    throw new Error(`Bounded-body invariant missing: ${token}`);
  }
}

for (const token of [
  "createHmac",
  ".onConflictDoUpdate(",
  "requestCount",
  "current_timestamp",
]) {
  if (!rateLimiter.includes(token)) {
    throw new Error(`Persistent rate-limit invariant missing: ${token}`);
  }
}

if (rateLimiter.includes("expiresAt} <= ${input.now}")) {
  throw new Error("Rate-limit SQL must not interpolate untyped JavaScript dates.");
}

if (/clientKey|forwarded-for|real-ip/i.test(rateLimiter)) {
  throw new Error("Raw client identifiers leaked into the database rate limiter.");
}

for (const token of ["stores.status", "products.status", "productVariants.isActive"]) {
  if (!catalogRepository.includes(token)) {
    throw new Error(`Active catalog filter missing: ${token}`);
  }
}

for (const token of [
  "Runtime transaction pooler: connected",
  "Persistent HMAC rate limiter: writable",
]) {
  if (!liveVerifier.includes(token)) {
    throw new Error(`Live API verification missing: ${token}`);
  }
}

const reusableApiSource = [
  orderRoute,
  catalogRoute,
  orderHandler,
  requestBody,
  rateLimiter,
  catalogRepository,
].join("\n");
for (const productLiteral of ["M3Food", "M3F-CMM-001", "125000", "189000"]) {
  if (reusableApiSource.includes(productLiteral)) {
    throw new Error(`Product-specific value leaked into reusable API: ${productLiteral}`);
  }
}

console.log("PART C BATCH 04 SECURE COMMERCE API VERIFIED");
console.log("Public catalog endpoint: present");
console.log("Idempotent order endpoint: present");
console.log("Bounded JSON parsing: present");
console.log("Persistent HMAC rate limiting: present");
console.log("RLS-protected public tables: 14-table baseline retained");
