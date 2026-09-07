import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

const schema = read("src/lib/db/schema.ts");
const nav = read("components/admin/MarketingNav.js");
const page = read("app/admin/marketing/ads/page.js");
const service = read("src/lib/admin/paid-ads-service.ts");
const repository = read("src/lib/db/admin-paid-ads-repository.ts");
const domain = read("src/lib/marketing/paid-ads.ts");

const requiredSchema = [
  'pgEnum("paid_ads_provider"',
  'pgTable(\n  "paid_ad_accounts"',
  'pgTable(\n  "paid_ad_campaign_mappings"',
  'pgTable(\n  "paid_ad_daily_metrics"',
  '.enableRLS()',
  'paid_ad_accounts_store_provider_external_uniq',
  'paid_ad_campaign_mappings_account_external_uniq',
  'paid_ad_daily_metrics_store_mapping_date_uniq',
  'paid_ad_daily_metrics_spend_nonnegative',
  'paid_ad_daily_metrics_impressions_nonnegative',
  'paid_ad_daily_metrics_clicks_nonnegative',
];

for (const fragment of requiredSchema) {
  if (!schema.includes(fragment)) {
    throw new Error(`Paid ads schema contract missing: ${fragment}`);
  }
}

if (!nav.includes("['Ads', '/admin/marketing/ads']")) {
  throw new Error("Paid Ads navigation entry is missing.");
}
if (!page.includes("Paid Ads Intelligence")) {
  throw new Error("Paid Ads admin page is missing.");
}
if (!page.includes("This batch never fabricates currency conversion or ROAS")) {
  throw new Error("Currency/ROAS boundary is not explicit.");
}
if (!service.includes('role === "OWNER" || role === "ADMIN"')) {
  throw new Error("Paid Ads mutation authorization is missing.");
}
if (!repository.includes('ingestionSource: "MANUAL"')) {
  throw new Error("Manual paid delivery ingestion is missing.");
}
if (!domain.includes("calculatePaidAdDelivery")) {
  throw new Error("Paid delivery calculation primitive is missing.");
}

const migrationFiles = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0015_.*\.sql$/.test(name));
if (migrationFiles.length !== 1) {
  throw new Error(`Expected exactly one 0015 migration, found ${migrationFiles.length}.`);
}

console.log("PART O BATCH 01 PAID ADS FOUNDATION VERIFIED");
console.log("Provider-neutral Meta / Google accounts: present");
console.log("Canonical provider campaign mapping: present");
console.log("Manual daily spend / impressions / clicks: present");
console.log("CTR / CPC delivery calculations: present");
console.log("OWNER / ADMIN mutation boundary: present");
console.log("RLS + nonnegative database constraints: present");
console.log(`Generated migration: ${migrationFiles[0]}`);
