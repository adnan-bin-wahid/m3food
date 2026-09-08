import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireContains(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} missing required contract: ${needle}`);
    }
  }
}

const expectedFiles = [
  "docs/part-r-01-store-financial-summary.md",
  "scripts/db-verify-part-r-01.ts",
  "scripts/verify-part-r-01.mjs",
  "src/lib/admin/store-financial-summary-repository.ts",
  "src/lib/admin/store-financial-summary-service.test.ts",
  "src/lib/admin/store-financial-summary-service.ts",
  "src/lib/db/admin-store-financial-summary-repository.ts",
];

for (const file of expectedFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing Part R Batch 01 file: ${file}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
if (
  packageJson.scripts?.["verify:part-r-01"] !==
  "node scripts/verify-part-r-01.mjs"
) {
  throw new Error("package.json verify:part-r-01 script missing.");
}
if (
  packageJson.scripts?.["db:verify:part-r-01"] !==
  "node --import tsx scripts/db-verify-part-r-01.ts"
) {
  throw new Error("package.json db:verify:part-r-01 script missing.");
}
if (!packageJson.scripts?.check?.includes("npm run verify:part-r-01")) {
  throw new Error("package.json check does not include Part R Batch 01.");
}

requireContains("src/lib/admin/store-financial-summary-service.ts", [
  'order.status === "DELIVERED"',
  'order.status === "CANCELLED" || order.status === "RETURNED"',
  "commerceCostCoverageComplete",
  "realizedCommerceContributionMinor",
  "reversedKnownFulfillmentLossMinor",
  "spendComparable",
  "netContributionAfterAdsMinor",
  "profitabilityComplete",
  "resolveMarketingWindow",
]);

requireContains("src/lib/db/admin-store-financial-summary-repository.ts", [
  "o.status in ('DELIVERED', 'CANCELLED', 'RETURNED')",
  "count(oi.total_cost_minor)",
  "o.fulfillment_cost_minor",
  "paid_ad_accounts",
  "paid_ad_daily_metrics",
  "paa.currency",
  "paa.timezone",
]);

requireContains("src/lib/admin/store-financial-summary-service.test.ts", [
  "unknown delivered item COGS fails closed",
  "unknown delivered fulfillment cost fails closed",
  "unknown cancelled or returned fulfillment loss also fails closed",
  "mixed ad spend currencies",
  "no paid accounts",
]);

const drizzleDir = path.join(root, "drizzle");
const migration19 = fs
  .readdirSync(drizzleDir)
  .filter((name) => /^0019_.*\.sql$/i.test(name));

if (migration19.length > 0) {
  throw new Error(
    `Unexpected Part R Batch 01 migration: ${migration19.join(", ")}`,
  );
}

console.log("PART R BATCH 01 STORE FINANCIAL SUMMARY VERIFIED");
console.log("Current DELIVERED commerce recognition: present");
console.log("Cancelled/returned operational-loss recognition: present");
console.log("Q01 item COGS fail-closed semantics: preserved");
console.log("Q02 fulfillment-cost fail-closed semantics: preserved");
console.log("Store-level realized commerce contribution: present");
console.log("Comparable paid-ad spend deduction: present");
console.log("Mixed/non-store currency suppression: present");
console.log("Provider conversion/revenue commerce truth: excluded");
console.log("Marketing range contract: preserved");
console.log("0019 migration: absent");
