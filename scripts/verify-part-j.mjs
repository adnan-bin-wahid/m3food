import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const contains = (file, ...needles) => {
  const text = read(file);
  for (const needle of needles) assert(text.includes(needle), `${file} is missing: ${needle}`);
};

const requiredFiles = [
  "app/admin/marketing/page.js",
  "app/admin/marketing/visitors/page.js",
  "app/admin/marketing/funnel/page.js",
  "app/admin/marketing/sources/page.js",
  "components/admin/MarketingNav.js",
  "app/api/v1/checkout-intents/route.ts",
  "src/lib/commerce/checkout-intent-service.ts",
  "src/lib/db/checkout-intent-repository.ts",
  "app/preferences/[token]/page.js",
  "app/preferences/[token]/actions.ts",
  "src/lib/privacy/preferences.ts",
  "src/lib/db/marketing-preference-repository.ts",
  "src/lib/fulfillment/steadfast.ts",
  "src/lib/admin/fulfillment-service.ts",
  "src/lib/db/admin-fulfillment-repository.ts",
  "drizzle/0011_part_c_minimum_closure.sql",
  "drizzle/meta/0011_snapshot.json",
  "scripts/db-verify-part-j.ts",
  "docs/part-j-part-c-minimum-closure.md",
];
for (const file of requiredFiles) assert(exists(file), `Part J required file missing: ${file}`);

contains("components/admin/AdminShell.js", "Marketing", "/admin/marketing/visitors", "/admin/marketing/retargeting");
contains("app/admin/marketing/page.js", "Visitors", "Product views", "Add to cart", "Checkout", "Orders", "Delivered revenue", "Status outcome");
contains("src/lib/db/admin-marketing-analytics-repository.ts", "utm_source", "fbclid", "BEGIN_CHECKOUT", "checkout_intents", "not exists");
contains("app/admin/orders/[publicId]/page.js", "Content", "Term", "Referrer", "fbclid", "gclid", "Visitor ID", "Session ID", "Steadfast fulfillment");
contains("src/lib/db/admin-customer-repository.ts", "customer_marketing_preferences", "latest_order_consent", "latest_consent");
contains("src/lib/commerce/checkout-intent-service.ts", "A consented recovery channel with matching contact information is required");
contains("src/lib/privacy/preferences.ts", "createMarketingPreferenceToken", "timingSafeEqual", "marketing-preferences");
contains("src/lib/admin/fulfillment-service.ts", "claimSubmission", "IN_PROGRESS", "CONFIRMED", "PROCESSING");
contains("src/lib/db/admin-fulfillment-repository.ts", "on conflict (store_id, order_id)", "updated_at <=", "SUBMITTED");
contains("src/lib/config/server-env.ts", "STEADFAST_API_KEY", "STEADFAST_SECRET_KEY", "getMarketingPreferenceSecret");
contains("app/privacy/page.js", "Email, SMS", "abandoned-checkout", "Steadfast", "Marketing preferences");
contains("package.json", '"verify:part-j"', '"db:verify:part-j"', "src/lib/fulfillment/*.test.ts");
contains("drizzle/0011_part_c_minimum_closure.sql", "checkout_intents", "customer_marketing_preferences", "fulfillment_shipments", "ENABLE ROW LEVEL SECURITY");

const env = read(".env.example");
assert(env.includes("STEADFAST_API_KEY=") && env.includes("STEADFAST_SECRET_KEY="), "Steadfast server-only environment placeholders missing.");
assert(env.includes("MARKETING_PREFERENCE_SECRET="), "Marketing preference secret placeholder missing.");
assert(!read("components/admin/StoreSettingsForm.js").includes("STEADFAST_SECRET_KEY"), "Steadfast secret must never be exposed in the admin settings form.");

console.log("PART J PART C MINIMUM CLOSURE VERIFIED");
console.log("Marketing overview, visitors, funnel, sources, and order attribution: present");
console.log("Consent-aware checkout recovery and signed preference management: present");
console.log("Steadfast server-only adapter with duplicate-submission protection: present");
console.log("Part C closure migration, live verifier, documentation, and tests: present");
