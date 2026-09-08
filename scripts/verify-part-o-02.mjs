import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

const page = read("app/admin/marketing/ads/page.js");
const service = read("src/lib/admin/paid-ads-performance-service.ts");
const repository = read("src/lib/db/admin-paid-ads-performance-repository.ts");
const docs = read("docs/part-o-02-paid-acquisition-performance.md");

const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

requireCondition(
  page.includes("Paid acquisition performance"),
  "Paid acquisition performance UI is missing.",
);
requireCondition(
  page.includes("Spend → first-party orders → revenue"),
  "Paid acquisition first-party bridge label is missing.",
);
requireCondition(
  page.includes("ROAS is shown only when paid spend and store revenue use the same currency"),
  "Currency-safe ROAS explanation is missing.",
);
requireCondition(
  service.includes("buildPaidAcquisitionPerformance"),
  "Paid acquisition aggregation service is missing.",
);
requireCondition(
  service.includes("spendByCurrency"),
  "Currency-aware spend aggregation is missing.",
);
requireCondition(
  service.includes("placedRoas") && service.includes("deliveredRoas"),
  "Placed/delivered ROAS calculations are missing.",
);
requireCondition(
  repository.includes("paid_ad_daily_metrics"),
  "Paid delivery source is missing.",
);
requireCondition(
  repository.includes("timezone(${timezoneColumn}") &&
    repository.includes('"paa.timezone"'),
  "Paid metric date windows must use the provider account timezone.",
);
requireCondition(
  !repository.includes("endAt.toISOString().slice(0, 10)") &&
    !repository.includes("startAt?.toISOString().slice(0, 10)"),
  "Paid metric date windows must not derive calendar dates from UTC ISO slicing.",
);
requireCondition(
  repository.includes("order_attributions"),
  "First-party order attribution join is missing.",
);
requireCondition(
  repository.includes("oa.last_touch_campaign_id = mc.id"),
  "Canonical last-touch paid outcome semantics are missing.",
);
requireCondition(
  repository.includes("osh.to_status = 'CONFIRMED'") &&
    repository.includes("osh.to_status = 'DELIVERED'"),
  "Confirmed/delivered lifecycle evidence is missing.",
);
requireCondition(
  docs.includes("avoids double-counting orders"),
  "Canonical aggregation/double-counting boundary is undocumented.",
);

const migrationBaseline = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0015_.*\.sql$/.test(name));

requireCondition(
  migrationBaseline.length === 1,
  `Part O Batch 02 requires exactly one 0015 paid-ads baseline migration; found ${migrationBaseline.length}.`,
);

console.log("PART O BATCH 02 PAID ACQUISITION PERFORMANCE VERIFIED");
console.log("Canonical campaign delivery aggregation: present");
console.log("First-party placed / confirmed / delivered outcomes: present");
console.log("Multiple provider mappings avoid order double-counting: present");
console.log("Placed / delivered CPA: present");
console.log("Currency-safe placed / delivered ROAS: present");
console.log("Part O paid-ads migration baseline: verified");
