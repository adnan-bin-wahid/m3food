import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");

const actions = read("app/admin/marketing/ads/actions.ts");
const page = read("app/admin/marketing/ads/page.js");
const syncService = read(
  "src/lib/admin/paid-ads-sync-service.ts",
);
const syncRepository = read(
  "src/lib/db/admin-paid-ads-sync-repository.ts",
);
const meta = read(
  "src/lib/marketing/meta-paid-ads-provider.ts",
);
const google = read(
  "src/lib/marketing/google-paid-ads-provider.ts",
);
const env = read(
  "src/lib/config/paid-ads-sync-env.ts",
);
const exampleEnv = read(".env.example");
const docs = read(
  "docs/part-o-03-provider-sync-foundation.md",
);

const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

requireCondition(
  actions.includes("syncPaidAdsAccountAction"),
  "Paid Ads sync server action is missing.",
);
requireCondition(
  page.includes("Provider API sync") &&
    page.includes("Sync provider delivery"),
  "Paid Ads sync admin UI is missing.",
);
requireCondition(
  syncService.includes("at most 31 calendar days") &&
    syncService.includes("PROVIDER_NOT_CONFIGURED"),
  "Paid Ads sync safety boundaries are missing.",
);
requireCondition(
  syncRepository.includes('ingestionSource: "API"') &&
    syncRepository.includes("revision"),
  "API delivery persistence/revision semantics are missing.",
);

requireCondition(
  meta.includes("/insights") &&
    meta.includes('"level", "campaign"') &&
    meta.includes('"time_increment", "1"'),
  "Meta campaign/day Insights sync is missing.",
);
requireCondition(
  meta.includes(
    "campaign_id,campaign_name,spend,impressions,clicks,date_start",
  ),
  "Meta delivery field contract is missing.",
);
requireCondition(
  !meta.toLowerCase().includes("conversions"),
  "Meta sync must not import provider conversions.",
);

requireCondition(
  google.includes("googleAds:searchStream") &&
    google.includes("metrics.cost_micros") &&
    google.includes("metrics.impressions") &&
    google.includes("metrics.clicks"),
  "Google Ads delivery GAQL sync is missing.",
);
requireCondition(
  !google.toLowerCase().includes("conversions"),
  "Google sync must not import provider conversions.",
);

for (const key of [
  "META_ADS_ACCESS_TOKEN",
  "META_ADS_API_VERSION",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_API_VERSION",
]) {
  requireCondition(
    env.includes(key) && exampleEnv.includes(key),
    `Paid Ads provider environment key is missing: ${key}`,
  );
}

requireCondition(
  docs.includes("first-party commerce") &&
    docs.includes("no scheduled/background sync"),
  "Provider sync source-of-truth/scheduling boundary is undocumented.",
);

const migrationBaseline = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0015_.*\.sql$/.test(name));

requireCondition(
  migrationBaseline.length === 1,
  `Part O Batch 03 requires exactly one 0015 paid-ads baseline migration; found ${migrationBaseline.length}.`,
);

console.log("PART O BATCH 03 PROVIDER SYNC FOUNDATION VERIFIED");
console.log("Meta campaign/day delivery adapter: present");
console.log("Google Ads GAQL delivery adapter: present");
console.log("Server-only provider credential contract: present");
console.log("OWNER / ADMIN on-demand sync boundary: present");
console.log("API delivery upsert + revision semantics: present");
console.log("Provider conversions excluded from commerce truth: present");
console.log("Part O paid-ads migration baseline: verified");
