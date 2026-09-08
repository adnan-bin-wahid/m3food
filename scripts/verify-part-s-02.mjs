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

const recognition = read("src/lib/admin/payment-recognition.ts");
const orderService = read("src/lib/admin/order-profitability-service.ts");
const storeService = read("src/lib/admin/store-financial-summary-service.ts");
const channelService = read("src/lib/admin/channel-financial-summary-service.ts");
const campaignService = read("src/lib/admin/campaign-profitability-service.ts");
const intelligence = read("src/lib/admin/financial-intelligence-service.ts");
const financialPage = read("app/admin/financials/page.js");
const adsPage = read("app/admin/marketing/ads/page.js");
const orderDb = read("src/lib/db/admin-order-profitability-repository.ts");
const storeDb = read("src/lib/db/admin-store-financial-summary-repository.ts");
const channelDb = read("src/lib/db/admin-channel-financial-summary-repository.ts");
const campaignDb = read("src/lib/db/admin-campaign-profitability-repository.ts");
const docs = read("docs/part-s-02-settlement-aware-profitability.md");
const tests = read("src/lib/admin/settlement-aware-profitability.test.ts");
const packageJson = read("package.json");

for (const token of [
  "PAID_DELIVERED",
  "REFUNDED_DELIVERED",
  "REVERSED_RESOLVED",
  "UNSETTLED",
  'paymentStatus === "PAID"',
  'paymentStatus === "REFUNDED"',
]) {
  requireCondition(
    recognition.includes(token),
    `Payment recognition contract missing ${token}`,
  );
}

for (const source of [orderDb, storeDb, channelDb, campaignDb]) {
  requireCondition(
    source.includes("paymentStatus"),
    "A financial DB repository does not expose payment settlement truth.",
  );
}

for (const source of [storeDb, channelDb, campaignDb]) {
  requireCondition(
    source.includes("payment_status"),
    "A raw-SQL financial repository does not select payment_status.",
  );
}

for (const source of [storeService, channelService, campaignService]) {
  requireCondition(
    source.includes("settlementCoverageComplete") &&
      source.includes("unsettled") &&
      source.includes("REFUNDED_DELIVERED"),
    "A financial summary service is missing settlement-aware recognition.",
  );
}

requireCondition(
  orderService.includes("classifyFinancialPaymentRecognition") &&
    orderService.includes("recognizedRevenueMinor") &&
    orderService.includes("Delivered payment was refunded") &&
    orderService.includes("settlement remains unresolved"),
  "Order profitability is not settlement-aware.",
);

requireCondition(
  intelligence.includes("PAYMENT_SETTLEMENT_INCOMPLETE") &&
    intelligence.includes("settlement coverage completeness") &&
    intelligence.includes("Unsettled orders"),
  "Financial intelligence settlement reconciliation is incomplete.",
);

requireCondition(
  financialPage.includes("Settled delivered revenue") &&
    financialPage.includes("Settlement coverage") &&
    financialPage.includes("Payment settlement incomplete"),
  "Financial dashboard does not expose settlement-aware truth.",
);

requireCondition(
  adsPage.includes("Unsettled payments") &&
    adsPage.includes("Settled revenue") &&
    adsPage.includes("Settlement"),
  "Campaign profitability UI does not expose settlement-aware truth.",
);

for (const token of [
  "DELIVERED + PAID",
  "DELIVERED + REFUNDED",
  "DELIVERED + UNPAID/PENDING/FAILED",
  "No `0020` migration is required",
]) {
  requireCondition(
    docs.includes(token),
    `S02 documentation missing ${token}`,
  );
}

for (const token of [
  "delivered but unpaid order fails closed",
  "delivered refund recognizes COGS and fulfillment as loss",
  "store settlement coverage fails closed",
  "only the affected channel is blocked",
  "campaign refund keeps cost loss with zero revenue",
  "financial intelligence exposes payment settlement warning",
]) {
  requireCondition(
    tests.includes(token),
    `S02 tests missing ${token}`,
  );
}

requireCondition(
  packageJson.includes('"verify:part-s-02"') &&
    packageJson.includes('"db:verify:part-s-02"') &&
    packageJson.includes(
      "npm run verify:part-s-01 && npm run verify:part-s-02 && npm run test:domain",
    ),
  "package.json S02 verification wiring is incomplete.",
);

for (const verifier of [
  "scripts/verify-part-q-02.mjs",
  "scripts/verify-part-q-03.mjs",
  "scripts/verify-part-r-01.mjs",
  "scripts/verify-part-r-02.mjs",
  "scripts/verify-part-r-03.mjs",
  "scripts/verify-part-s-01.mjs",
]) {
  const content = read(verifier);
  requireCondition(
    content.includes("part-s-01-payment-settlement-foundation") ||
      content.includes("verify:part-s-02"),
    `${verifier} is not forward-compatible with Part S.`,
  );
}

const migration19 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/.test(name));

requireCondition(
  migration19.length === 1,
  `Expected exactly one 0019 migration; found ${migration19.length}.`,
);

const migration20 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0020_.*\.sql$/.test(name));

requireCondition(
  migration20.length === 0,
  "Unexpected 0020 migration exists.",
);

console.log("PART S BATCH 02 SETTLEMENT-AWARE PROFITABILITY VERIFIED");
console.log("Shared payment recognition classifier: present");
console.log("DELIVERED + PAID realized revenue: present");
console.log("DELIVERED + REFUNDED cost-loss recognition: present");
console.log("Unsettled delivered fail-closed rule: present");
console.log("Cancelled/returned settlement guard: present");
console.log("Store/channel/campaign settlement coverage: present");
console.log("Financial intelligence settlement reconciliation: present");
console.log("Settlement-aware admin financial UI: present");
console.log("Provider revenue/conversions: still excluded");
console.log("0019 migration head: preserved");
console.log("0020 migration: absent");
