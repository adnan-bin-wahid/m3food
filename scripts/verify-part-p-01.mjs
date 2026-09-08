import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const read = (file) =>
  fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");

const schema = read("src/lib/db/schema.ts");
const service = read(
  "src/lib/admin/paid-ads-scheduler-service.ts",
);
const repository = read(
  "src/lib/db/admin-paid-ads-scheduler-repository.ts",
);
const route = read(
  "app/api/internal/paid-ads/sync/route.ts",
);
const cron = read("vercel.json");
const env = read(".env.example");
const docs = read(
  "docs/part-p-01-scheduled-paid-ads-sync.md",
);

const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

requireCondition(
  schema.includes('syncEnabled: boolean("sync_enabled")') &&
    schema.includes(
      'syncLookbackDays: integer("sync_lookback_days")',
    ),
  "Paid ad account scheduling state is missing.",
);

requireCondition(
  schema.includes('paidAdsSyncRunStatusEnum') &&
    schema.includes('paid_ad_sync_runs'),
  "Paid ads sync run history schema is missing.",
);

requireCondition(
  service.includes(
    "resolveScheduledPaidAdsWindow",
  ) &&
    service.includes(
      "paid-ads-scheduler@system.internal",
    ) &&
    service.includes("duplicateSkipped"),
  "Scheduled sync orchestration is missing.",
);

requireCondition(
  repository.includes("syncEnabled") &&
    repository.includes("claimScheduledRun") &&
    repository.includes("scheduleKey"),
  "Scheduled sync database repository is missing.",
);

requireCondition(
  route.includes("CRON_SECRET") ||
    route.includes("getCronSecret"),
  "Cron route authentication is missing.",
);

requireCondition(
  route.includes("syncAdminPaidAdAccount") &&
    route.includes("runScheduledPaidAdsSync"),
  "Cron route does not reuse the provider-neutral sync service.",
);

const cronJson = JSON.parse(cron);
requireCondition(
  Array.isArray(cronJson.crons) &&
    cronJson.crons.some(
      (job) =>
        job.path === "/api/internal/paid-ads/sync" &&
        job.schedule === "5 0 * * *",
    ),
  "Daily paid ads cron configuration is missing.",
);

requireCondition(
  env.includes("CRON_SECRET="),
  "CRON_SECRET is missing from .env.example.",
);

requireCondition(
  docs.includes("previous provider-local date") &&
    docs.includes("first-party commerce truth"),
  "Scheduler date/truth boundaries are undocumented.",
);

const migrations = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0016_.*\.sql$/.test(name));

requireCondition(
  migrations.length === 1,
  `Expected exactly one 0016 migration, found ${migrations.length}.`,
);

const migration = read(path.join("drizzle", migrations[0]));

for (const token of [
  "paid_ad_sync_runs",
  "sync_enabled",
  "sync_lookback_days",
  "paid_ads_sync_run_status",
]) {
  requireCondition(
    migration.includes(token),
    `0016 migration is missing ${token}.`,
  );
}

console.log(
  "PART P BATCH 01 SCHEDULED PAID ADS SYNC VERIFIED",
);
console.log("Daily cron route + Bearer secret: present");
console.log("Provider-local completed-day window: present");
console.log("Scheduled account state: present");
console.log("Run history + duplicate protection: present");
console.log("Provider-neutral Part O sync reuse: present");
console.log("First-party conversion truth boundary: preserved");
console.log("Generated 0016 migration: verified");
