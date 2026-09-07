import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = read("src/lib/db/schema.ts");
requireCondition(schema.includes('pgEnum("marketing_campaign_status"'), "Campaign status enum is missing.");
requireCondition(schema.includes('"marketing_campaigns"'), "Campaign registry table is missing.");
requireCondition(schema.includes("marketingCampaigns"), "Drizzle campaign schema export is missing.");
requireCondition(schema.includes(".enableRLS()"), "Schema must retain RLS tables.");

const marketing = read("src/lib/marketing/campaigns.ts");
requireCondition(marketing.includes("normalizeCampaignKey"), "Campaign key normalizer is missing.");
requireCondition(marketing.includes("buildCampaignUtmUrl"), "UTM builder domain helper is missing.");
requireCondition(marketing.includes("selectFirstLastCampaignTouches"), "First/last touch primitive is missing.");

const service = read("src/lib/admin/campaign-admin-service.ts");
requireCondition(service.includes('role === "OWNER" || role === "ADMIN"'), "Campaign mutation role boundary is missing.");
requireCondition(service.includes("DUPLICATE_KEY"), "Duplicate campaign-key handling is missing.");

const nav = read("components/admin/MarketingNav.js");
requireCondition(nav.includes("Campaigns"), "Marketing nav does not expose Campaign Manager.");
requireCondition(nav.includes("/admin/marketing/campaigns"), "Campaign Manager route is missing from nav.");

requireCondition(exists("app/admin/marketing/campaigns/page.js"), "Campaign Manager page is missing.");
requireCondition(exists("components/admin/UtmBuilder.js"), "UTM Builder UI is missing.");
requireCondition(exists("components/admin/CampaignCreateForm.js"), "Campaign create UI is missing.");
requireCondition(exists("src/lib/db/admin-campaign-repository.ts"), "Campaign database repository is missing.");

const packageJson = JSON.parse(read("package.json"));
requireCondition(packageJson.scripts?.["verify:part-n-01"], "Part N verifier script is missing.");
requireCondition(packageJson.scripts?.check?.includes("verify:part-n-01"), "Full check does not include Part N Batch 01.");

const migrations = fs.readdirSync(path.join(root, "drizzle")).filter((name) => /^0013_.*\.sql$/.test(name));
requireCondition(migrations.length === 1, `Expected exactly one generated 0013 migration, found ${migrations.length}.`);
const migration = read(path.join("drizzle", migrations[0]));
requireCondition(migration.includes("marketing_campaigns"), "0013 migration does not create marketing_campaigns.");
requireCondition(migration.toLowerCase().includes("enable row level security"), "0013 migration does not enable RLS.");

console.log("PART N BATCH 01 CAMPAIGN REGISTRY VERIFIED");
console.log("Campaign Registry schema + RLS: present");
console.log("Canonical UTM campaign identity: present");
console.log("Campaign Manager + UTM Builder: present");
console.log("Owner/Admin mutation boundary: present");
console.log("First/last touch resolver foundation: present");
console.log(`Generated migration: ${migrations[0]}`);
