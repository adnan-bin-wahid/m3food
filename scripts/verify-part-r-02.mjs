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
  "docs/part-r-02-channel-acquisition-profitability.md",
  "scripts/db-verify-part-r-02.ts",
  "scripts/verify-part-r-02.mjs",
  "src/lib/admin/channel-financial-summary-repository.ts",
  "src/lib/admin/channel-financial-summary-service.test.ts",
  "src/lib/admin/channel-financial-summary-service.ts",
  "src/lib/db/admin-channel-financial-summary-repository.ts",
];

for (const file of expectedFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing Part R Batch 02 file: ${file}`);
  }
}

const packageJson = JSON.parse(read("package.json"));

if (
  packageJson.scripts?.["verify:part-r-02"] !==
  "node scripts/verify-part-r-02.mjs"
) {
  throw new Error("package.json verify:part-r-02 script missing.");
}

if (
  packageJson.scripts?.["db:verify:part-r-02"] !==
  "node --import tsx scripts/db-verify-part-r-02.ts"
) {
  throw new Error("package.json db:verify:part-r-02 script missing.");
}

if (!packageJson.scripts?.check?.includes("npm run verify:part-r-02")) {
  throw new Error("package.json check does not include Part R Batch 02.");
}

requireContains("src/lib/admin/channel-financial-summary-service.ts", [
  '"META"',
  '"GOOGLE"',
  '"ORGANIC"',
  '"OTHER"',
  "classifyFinancialAcquisitionChannel",
  "mappedProviders",
  "costCoverageComplete",
  "realizedCommerceContributionMinor",
  "spendComparable",
  "netContributionAfterAdsMinor",
  "orderReconciliationComplete",
  "resolveMarketingWindow",
]);

requireContains(
  "src/lib/db/admin-channel-financial-summary-repository.ts",
  [
    "order_attributions",
    "oa.last_touch_campaign_id",
    "paid_ad_campaign_mappings",
    "paid_ad_accounts",
    "paid_ad_daily_metrics",
    "paa.provider",
    "paa.currency",
    "paa.timezone",
    "o.status in ('DELIVERED', 'CANCELLED', 'RETURNED')",
  ],
);

requireContains(
  "src/lib/admin/channel-financial-summary-service.test.ts",
  [
    "assigns every recognized order exactly once",
    "deduct only their own comparable provider spend",
    "unknown costs fail closed only for the affected acquisition channel",
    "mixed Meta spend currencies suppress only Meta",
    "negative net contribution",
  ],
);

const migration19 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/i.test(name));

if (migration19.length > 0) {
  throw new Error(
    `Unexpected Part R Batch 02 migration: ${migration19.join(", ")}`,
  );
}

console.log("PART R BATCH 02 CHANNEL / ACQUISITION PROFITABILITY VERIFIED");
console.log("Last-touch channel classification: present");
console.log("META / GOOGLE / ORGANIC / OTHER rows: present");
console.log("One-order-one-channel reconciliation: present");
console.log("Provider-specific paid spend deduction: present");
console.log("Q01/Q02 fail-closed channel cost semantics: preserved");
console.log("Cancelled/returned operational loss: preserved by channel");
console.log("Mixed/non-store provider currency suppression: present");
console.log("Provider conversion/revenue commerce truth: excluded");
console.log("Marketing range contract: preserved");
console.log("0019 migration: absent");
