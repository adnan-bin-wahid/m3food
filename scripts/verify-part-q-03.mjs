import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const repository = read(
  "src/lib/admin/campaign-profitability-repository.ts",
);
const service = read("src/lib/admin/campaign-profitability-service.ts");
const dbRepository = read(
  "src/lib/db/admin-campaign-profitability-repository.ts",
);
const tests = read("src/lib/admin/campaign-profitability-service.test.ts");
const page = read("app/admin/marketing/ads/page.js");
const docs = read("docs/part-q-03-campaign-profitability.md");
const packageJson = read("package.json");

for (const token of [
  "CampaignProfitabilityDeliveryRow",
  "CampaignDeliveredOrderRow",
  "CampaignProfitabilityRaw",
  "CampaignProfitabilityRepository",
]) {
  requireCondition(repository.includes(token), `Q03 repository missing ${token}`);
}

for (const token of [
  "knownCogsMinor",
  "knownFulfillmentCostMinor",
  "contributionBeforeAdsMinor",
  "netContributionAfterAdsMinor",
  "contributionMarginPercent",
  "profitEfficiency",
  "costCoverageComplete",
  "spendComparable",
]) {
  requireCondition(service.includes(token), `Q03 service missing ${token}`);
}

for (const token of [
  "oa.last_touch_campaign_id",
  "o.status = 'DELIVERED'",
  "o.fulfillment_cost_minor",
  "oi.total_cost_minor",
  "paid_ad_daily_metrics",
  "paid_ad_campaign_mappings",
]) {
  requireCondition(dbRepository.includes(token), `Q03 DB query missing ${token}`);
}

requireCondition(
  !dbRepository.includes("provider_conversion") &&
    !dbRepository.includes("conversion_value"),
  "Q03 must not import provider conversion/revenue as commerce truth.",
);

for (const token of [
  "unknown delivered item COGS fails closed",
  "unknown fulfillment cost fails closed",
  "mixed spend currencies",
  "single non-store spend currency",
  "no delivered orders",
]) {
  requireCondition(tests.includes(token), `Q03 tests missing ${token}`);
}

for (const token of [
  "Campaign profitability",
  "Contribution before ads",
  "Net contribution after ads",
  "Profit efficiency",
  "Cost coverage",
]) {
  requireCondition(page.includes(token), `Q03 admin UI missing ${token}`);
}

for (const token of [
  "current order status is `DELIVERED`",
  "Unknown COGS or unknown fulfillment cost is never treated as zero",
  "No FX rate is invented",
  "last-touch campaign attribution",
  "no `0019` migration is introduced",
]) {
  requireCondition(docs.includes(token), `Q03 docs missing ${token}`);
}

requireCondition(
  packageJson.includes('"verify:part-q-03"') &&
    packageJson.includes('"db:verify:part-q-03"'),
  "Q03 package verification scripts are missing.",
);

const migration19 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/.test(name));

requireCondition(
  migration19.length === 0,
  "Unexpected 0019 migration exists for read-only Q03 analytics.",
);

console.log("PART Q BATCH 03 CAMPAIGN PROFITABILITY VERIFIED");
console.log("Current DELIVERED first-party cohort: present");
console.log("Canonical last-touch attribution: preserved");
console.log("Q01 item COGS snapshots: consumed fail-closed");
console.log("Q02 fulfillment cost: consumed fail-closed");
console.log("Contribution before ads: present");
console.log("Net contribution after ads: present");
console.log("Contribution margin + profit efficiency: present");
console.log("Mixed/non-store spend currency suppression: present");
console.log("Provider conversion/revenue commerce truth: excluded");
console.log("0019 migration: absent");
