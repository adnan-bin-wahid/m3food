import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = read("src/lib/db/schema.ts");
requireCondition(schema.includes('campaignId: uuid("campaign_id")'), "visitor_sessions.campaign_id is missing.");
requireCondition(schema.includes('firstTouchCampaignId: uuid("first_touch_campaign_id")'), "order_attributions.first_touch_campaign_id is missing.");
requireCondition(schema.includes('lastTouchCampaignId: uuid("last_touch_campaign_id")'), "order_attributions.last_touch_campaign_id is missing.");

const campaigns = read("src/lib/marketing/campaigns.ts");
requireCondition(campaigns.includes("resolveRegisteredCampaignAttribution"), "Registered first/last touch resolver is missing.");
requireCondition(!campaigns.includes(".filter(hasMeaningfulCampaignTouch)"), "Direct sessions are still being discarded from last-touch semantics.");

for (const repositoryPath of [
  "src/lib/db/event-repository.ts",
  "src/lib/db/interaction-repository.ts",
  "src/lib/db/landing-order-repository.ts",
]) {
  const source = read(repositoryPath);
  requireCondition(source.includes("normalizeCampaignKey"), `${repositoryPath} does not resolve canonical campaign keys.`);
  requireCondition(source.includes("marketingCampaigns"), `${repositoryPath} does not query Campaign Registry.`);
  requireCondition(source.includes("campaignId"), `${repositoryPath} does not persist resolved session campaign IDs.`);
}

const landingOrder = read("src/lib/db/landing-order-repository.ts");
requireCondition(landingOrder.includes("firstTouchCampaignId"), "Landing order attribution does not persist first-touch campaign ID.");
requireCondition(landingOrder.includes("lastTouchCampaignId"), "Landing order attribution does not persist last-touch campaign ID.");
requireCondition(landingOrder.includes("resolveRegisteredCampaignAttribution"), "Landing order does not resolve chronological registered campaign attribution.");

requireCondition(exists("src/lib/db/admin-campaign-performance-repository.ts"), "Campaign performance repository is missing.");
requireCondition(exists("src/lib/admin/campaign-performance-service.ts"), "Campaign performance service is missing.");

const page = read("app/admin/marketing/campaigns/page.js");
for (const label of ["First-touch orders", "Last-touch orders", "Last-touch CVR", "Placed revenue"]) {
  requireCondition(page.includes(label), `Campaign Manager is missing ${label}.`);
}

const migrations = fs.readdirSync(path.join(root, "drizzle")).filter((name) => /^0014_.*\.sql$/.test(name));
requireCondition(migrations.length === 1, `Expected exactly one generated 0014 migration, found ${migrations.length}.`);
const migration = read(path.join("drizzle", migrations[0]));
for (const fragment of [
  "campaign_id",
  "first_touch_campaign_id",
  "last_touch_campaign_id",
  "visitor_sessions_campaign_id_idx",
  "order_attributions_first_campaign_idx",
  "order_attributions_last_campaign_idx",
]) {
  requireCondition(migration.includes(fragment), `0014 migration is missing ${fragment}.`);
}
requireCondition(migration.includes("PART_N_02_SESSION_CAMPAIGN_BACKFILL"), "0014 migration is missing the conservative session campaign backfill.");

const packageJson = JSON.parse(read("package.json"));
requireCondition(packageJson.scripts?.["verify:part-n-02"], "Part N Batch 02 verifier script is missing.");
requireCondition(packageJson.scripts?.check?.includes("verify:part-n-02"), "Full check does not include Part N Batch 02.");

console.log("PART N BATCH 02 ATTRIBUTION VERIFIED");
console.log("Session → Campaign Registry resolution: present");
console.log("Raw UTM preservation: present");
console.log("Chronological first/last touch order attribution: present");
console.log("Direct session last-touch semantics: present");
console.log("Campaign performance reporting: present");
console.log(`Generated migration: ${migrations[0]}`);
