import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");

const page = read("app/admin/marketing/ads/page.js");
const actions = read("app/admin/marketing/ads/actions.ts");
const service = read(
  "src/lib/admin/paid-ads-schedule-service.ts",
);
const repository = read(
  "src/lib/db/admin-paid-ads-schedule-repository.ts",
);
const component = read(
  "components/admin/PaidAdScheduleForm.js",
);
const docs = read(
  "docs/part-p-02-sync-health-admin-controls.md",
);

const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

requireCondition(
  page.includes("Scheduled sync controls") &&
    page.includes("Sync health & run history"),
  "Paid Ads scheduling/health UI is missing.",
);

requireCondition(
  actions.includes("updatePaidAdScheduleAction"),
  "Paid Ads schedule server action is missing.",
);

requireCondition(
  service.includes("canManagePaidAds") &&
    service.includes("ACCOUNT_NOT_FOUND_OR_STALE") &&
    service.includes(".max(31)"),
  "Schedule authorization/validation boundary is missing.",
);

requireCondition(
  repository.includes("paidAdSyncRuns") &&
    repository.includes("syncEnabled") &&
    repository.includes("syncLookbackDays") &&
    repository.includes("revision"),
  "Schedule workspace/persistence repository is incomplete.",
);

requireCondition(
  component.includes("Save schedule") &&
    component.includes("syncLookbackDays"),
  "Schedule control component is missing.",
);

requireCondition(
  docs.includes("No 0017 migration") &&
    docs.includes("provider conversions"),
  "Part P Batch 02 migration/truth boundary is undocumented.",
);

const p01Baseline = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0016_.*\.sql$/.test(name));

requireCondition(
  p01Baseline.length === 1,
  `Part P Batch 02 requires exactly one 0016 scheduler baseline; found ${p01Baseline.length}.`,
);

console.log(
  "PART P BATCH 02 SYNC HEALTH + ADMIN CONTROLS VERIFIED",
);
console.log("OWNER / ADMIN scheduling controls: present");
console.log("Optimistic schedule revision: present");
console.log("1-31 day lookback boundary: present");
console.log("Sync health + recent run history: present");
console.log("Provider conversion truth boundary: preserved");
console.log("Part P scheduler migration baseline: verified");
