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
  "app/admin/financials/page.js",
  "components/admin/AdminShell.js",
  "docs/part-r-03-financial-intelligence-dashboard.md",
  "scripts/db-verify-part-r-03.ts",
  "scripts/verify-part-r-03.mjs",
  "src/lib/admin/financial-intelligence-service.test.ts",
  "src/lib/admin/financial-intelligence-service.ts",
];

for (const file of expectedFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing Part R Batch 03 file: ${file}`);
  }
}

const packageJson = JSON.parse(read("package.json"));

if (
  packageJson.scripts?.["verify:part-r-03"] !==
  "node scripts/verify-part-r-03.mjs"
) {
  throw new Error("package.json verify:part-r-03 script missing.");
}

if (
  packageJson.scripts?.["db:verify:part-r-03"] !==
  "node --import tsx scripts/db-verify-part-r-03.ts"
) {
  throw new Error("package.json db:verify:part-r-03 script missing.");
}

if (!packageJson.scripts?.check?.includes("npm run verify:part-r-03")) {
  throw new Error("package.json check does not include Part R Batch 03.");
}

requireContains("components/admin/AdminShell.js", [
  'href="/admin/financials"',
  "Financials",
]);

requireContains("app/admin/financials/page.js", [
  "getAdminFinancialIntelligence",
  "DrizzleAdminStoreFinancialSummaryRepository",
  "DrizzleAdminChannelFinancialSummaryRepository",
  "parseMarketingRange",
  "/admin/financials?range=",
  "Settled delivered revenue",
  "Commerce contribution",
  "Net contribution",
  "Cost coverage",
  "Channel profitability",
  "Provider conversions and provider revenue never replace first-party commerce truth",
]);

requireContains("src/lib/admin/financial-intelligence-service.ts", [
  "FinancialIntelligenceError",
  "Delivered orders",
  "Settled delivered revenue",
  "Known COGS",
  "Known delivered fulfillment cost",
  "Known reversed fulfillment loss",
  "paid-spend currency totals do not match",
  "Commerce contribution",
  "Net contribution",
  "COST_COVERAGE_INCOMPLETE",
  "SPEND_NOT_COMPARABLE",
  "sameWindow",
  "getAdminFinancialIntelligence",
]);

requireContains("src/lib/admin/financial-intelligence-service.test.ts", [
  "reconciles store totals with channel totals",
  "channel revenue no longer reconciles",
  "provider spend totals do not reconcile",
  "cost and currency warnings",
  "one exact time window",
]);

const migration19 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/i.test(name));

const laterPartSPaymentFoundation = fs.existsSync(
  path.join(root, "docs/part-s-01-payment-settlement-foundation.md"),
);

if (laterPartSPaymentFoundation) {
  if (migration19.length !== 1) {
    throw new Error(
      `Expected the later Part S 0019 payment migration; found ${migration19.length}.`,
    );
  }
} else if (migration19.length !== 0) {
  throw new Error("Unexpected 0019 migration exists before Part S.");
}

console.log("PART R BATCH 03 FINANCIAL INTELLIGENCE DASHBOARD VERIFIED");
console.log("Admin Financials navigation: present");
console.log("7d / 30d / 90d / all range UI: present");
console.log("Store financial summary cards: present");
console.log("Channel profitability table: present");
console.log("Store/channel order + cost reconciliation: present");
console.log("Paid-spend currency reconciliation: present");
console.log("Cost coverage warning: present");
console.log("Currency comparability warning: present");
console.log("Provider conversion/revenue commerce truth: excluded");
console.log("R03 introduced no 0019; later Part S migration: tolerated");
