import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of [
  "src/lib/admin/campaign-attribution-diagnostics-repository.ts",
  "src/lib/admin/campaign-attribution-diagnostics-service.ts",
  "src/lib/admin/campaign-attribution-diagnostics-service.test.ts",
  "src/lib/db/admin-campaign-attribution-diagnostics-repository.ts",
  "app/admin/marketing/campaigns/[campaignId]/page.js",
  "docs/part-n-03-attribution-diagnostics.md",
]) {
  requireCondition(exists(file), `Missing Batch 03 file: ${file}`);
}

const performanceService = read("src/lib/admin/campaign-performance-service.ts");
requireCondition(
  performanceService.includes("resolveMarketingWindow"),
  "Campaign performance is not range scoped.",
);

const diagnostics = read("src/lib/admin/campaign-attribution-diagnostics-service.ts");
for (const fragment of [
  "suggestedCampaignKey",
  "normalizeCampaignKey",
  '"FIRST + LAST"',
  "readTouchCampaign",
]) {
  requireCondition(
    diagnostics.includes(fragment),
    `Attribution diagnostics are missing ${fragment}.`,
  );
}

const db = read("src/lib/db/admin-campaign-attribution-diagnostics-repository.ts");
for (const fragment of [
  "vs.campaign_id is null",
  "oa.first_touch_campaign_id",
  "oa.last_touch_campaign_id",
  "order_status_history",
  "osh.to_status = 'CONFIRMED'",
  "osh.to_status = 'DELIVERED'",
]) {
  requireCondition(db.includes(fragment), `Diagnostics DB query is missing ${fragment}.`);
}

const campaignsPage = read("app/admin/marketing/campaigns/page.js");
for (const fragment of [
  "Unregistered UTM traffic",
  "Suggested key",
  "MARKETING_RANGES",
  "/admin/marketing/campaigns/${campaign.id}?range=${range}",
]) {
  requireCondition(campaignsPage.includes(fragment), `Campaign Manager is missing ${fragment}.`);
}

const detailPage = read("app/admin/marketing/campaigns/[campaignId]/page.js");
for (const fragment of [
  "Reached confirmed",
  "Reached delivered",
  "Recent attributed orders",
  "First → Last",
  "does not calculate spend, CPA or ROAS",
]) {
  requireCondition(detailPage.includes(fragment), `Campaign detail is missing ${fragment}.`);
}

const partNBaselineMigrations = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0014_.*\.sql$/.test(name));
requireCondition(
  partNBaselineMigrations.length === 1,
  "Part N Batch 03 requires exactly one 0014 attribution migration baseline.",
);

const packageJson = JSON.parse(read("package.json"));
requireCondition(
  packageJson.scripts?.["verify:part-n-03"],
  "Part N Batch 03 verifier script is missing.",
);
requireCondition(
  packageJson.scripts?.check?.includes("verify:part-n-03"),
  "Full check does not include Part N Batch 03.",
);

console.log("PART N BATCH 03 ATTRIBUTION DIAGNOSTICS VERIFIED");
console.log("Campaign date windows: present");
console.log("Campaign drill-down: present");
console.log("First/last touch order evidence: present");
console.log("Confirmed/delivered lifecycle reach: present");
console.log("Unregistered UTM diagnostics: present");
console.log("Part N attribution migration baseline: verified");
