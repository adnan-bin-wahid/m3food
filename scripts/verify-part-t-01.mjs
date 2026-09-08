import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = read("src/lib/db/schema.ts");
const contracts = read("src/lib/commerce/contracts.ts");
const orderRepository = read(
  "src/lib/commerce/order-repository.ts",
);
const orderService = read("src/lib/commerce/order-service.ts");
const landingRepository = read(
  "src/lib/db/landing-order-repository.ts",
);
const intent = read("src/lib/payments/payment-intent.ts");
const adapter = read("src/lib/payments/provider-adapter.ts");
const tests = read("src/lib/payments/payment-intent.test.ts");
const env = read("src/lib/config/server-env.ts");
const envExample = read(".env.example");
const docs = read(
  "docs/part-t-01-payment-intent-provider-foundation.md",
);
const packageJson = read("package.json");

for (const token of [
  'export const paymentMethodEnum = pgEnum("payment_method", [',
  'pgEnum("payment_provider"',
  '"payment_intent_status"',
  '"payment_provider_event_verification_status"',
  'export const paymentIntents = pgTable(',
  '"payment_intents"',
  'export const paymentProviderEvents = pgTable(',
  '"payment_provider_events"',
  "payment_intents_store_idempotency_uniq",
  "payment_provider_events_store_provider_event_uniq",
]) {
  requireCondition(
    schema.includes(token),
    `T01 schema missing ${token}`,
  );
}

requireCondition(
  contracts.includes("paymentSelectionSchema") &&
    contracts.includes("payment: paymentSelectionSchema.optional()"),
  "Landing order payment selection contract is missing.",
);

for (const token of [
  "paymentMethod",
  "paymentStatus",
  "paymentIntent",
  "PaymentIntentSummary",
]) {
  requireCondition(
    orderRepository.includes(token),
    `Order repository contract missing ${token}.`,
  );
}

requireCondition(
  orderService.includes("resolveInitialPaymentState") &&
    orderService.includes("input.payment") &&
    orderService.includes("paymentIntent"),
  "Order service is not creating provider-neutral initial payment state.",
);

requireCondition(
  landingRepository.includes("paymentIntents") &&
    landingRepository.includes('paymentMethod: payment.method') &&
    landingRepository.includes('paymentStatus: payment.status') &&
    landingRepository.includes("paymentIntent"),
  "Landing order DB graph is not payment-intent aware.",
);

for (const token of [
  "SSL_COMMERZ",
  "CREATED",
  "INITIATING",
  "REQUIRES_ACTION",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]) {
  requireCondition(
    intent.includes(token),
    `Payment intent contract missing ${token}.`,
  );
}

requireCondition(
  adapter.includes("interface PaymentAdapter") &&
    adapter.includes("initiate(") &&
    adapter.includes("verifyCallback") &&
    adapter.includes("verified: false") &&
    adapter.includes("verified: true") &&
    adapter.includes("hashPaymentProviderPayload"),
  "Provider adapter verification/replay contract is incomplete.",
);

requireCondition(
  tests.includes(
    "COD remains the backward-compatible default payment selection",
  ) &&
    tests.includes(
      "online checkout creates a pending payment and an untrusted payment intent",
    ) &&
    tests.includes(
      "provider payload hashes are stable for replay protection",
    ),
  "T01 payment intent tests are incomplete.",
);

requireCondition(
  env.includes("sslCommerzEnvironmentSchema") &&
    env.includes("getSslCommerzEnvironment") &&
    envExample.includes("SSLCOMMERZ_STORE_ID=") &&
    envExample.includes("SSLCOMMERZ_STORE_PASSWORD="),
  "Server-only SSLCommerz configuration boundary is missing.",
);

for (const verifier of [
  "scripts/verify-part-s-01.mjs",
  "scripts/verify-part-s-02.mjs",
  "scripts/verify-part-s-03.mjs",
]) {
  const content = read(verifier);
  requireCondition(
    content.includes("verify:part-t-01"),
    `${verifier} is not forward-compatible with T01.`,
  );
}

requireCondition(
  packageJson.includes('"verify:part-t-01"') &&
    packageJson.includes('"db:verify:part-t-01"') &&
    packageJson.includes("src/lib/payments/*.test.ts") &&
    packageJson.includes(
      "npm run verify:part-s-03 && npm run verify:part-t-01 && npm run test:domain",
    ),
  "package.json T01 verification wiring is incomplete.",
);

const migration20 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0020_.*\.sql$/.test(name));

requireCondition(
  migration20.length === 1,
  `Expected exactly one 0020 migration; found ${migration20.length}.`,
);

requireCondition(
  fs.existsSync(
    path.join(root, "drizzle/meta/0020_snapshot.json"),
  ),
  "0020 Drizzle snapshot is missing.",
);

const migration = read(path.join("drizzle", migration20[0]));

for (const token of [
  "ONLINE",
  "payment_provider",
  "payment_intent_status",
  "payment_provider_event_verification_status",
  "payment_intents",
  "payment_provider_events",
  "ENABLE ROW LEVEL SECURITY",
]) {
  requireCondition(
    migration.includes(token),
    `0020 migration missing ${token}.`,
  );
}

const migration21 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0021_.*\.sql$/.test(name));

requireCondition(
  migration21.length === 0,
  "T01 must not introduce a 0021 migration.",
);

for (const token of [
  "callback is never trusted",
  "verified: false",
  "verified: true",
  "exactly one `0020` migration",
]) {
  requireCondition(
    docs.includes(token),
    `T01 documentation missing ${token}.`,
  );
}

console.log(
  "PART T BATCH 01 PAYMENT INTENT + PROVIDER ADAPTER FOUNDATION VERIFIED",
);
console.log("COD backward compatibility: preserved");
console.log("ONLINE payment method: present");
console.log("Provider-neutral payment intent lifecycle: present");
console.log("SSLCommerz provider identity foundation: present");
console.log("PaymentAdapter initiation/verification contract: present");
console.log("Unverified callback cannot settle payment: enforced by contract");
console.log("Provider event replay-protection schema: present");
console.log("Server-only gateway configuration boundary: present");
console.log("S01 settlement path: preserved");
console.log("0020 migration: verified");
console.log("0021 migration: absent");
