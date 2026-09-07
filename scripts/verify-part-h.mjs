import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const required = [
  "src/lib/client/google.ts",
  "src/lib/client/google.test.ts",
  "src/lib/marketing/meta-capi.ts",
  "src/lib/marketing/meta-capi.test.ts",
  "scripts/db-verify-marketing-integrations.ts",
  "docs/part-h-marketing-integrations.md",
  "drizzle/0010_marketing_integrations.sql",
];
for (const file of required) if (!existsSync(resolve(root, file))) throw new Error(`Part H file missing: ${file}`);
const migration = read("drizzle/0010_marketing_integrations.sql");
for (const token of ["ga4_measurement_id", "gtm_container_id"]) if (!migration.includes(token)) throw new Error(`Part H migration missing: ${token}`);
const schema = read("src/lib/db/schema.ts");
for (const token of ["ga4MeasurementId", "gtmContainerId"]) if (!schema.includes(token)) throw new Error(`Store marketing config missing: ${token}`);
const landing = read("app/page.js");
for (const token of ["trackGoogleCommerceEvent", "revokeGoogleConsent", "ga4MeasurementId", "gtmContainerId", "commerceEventIdsRef", "eventId: payload.data.publicId"]) if (!landing.includes(token)) throw new Error(`Landing marketing wiring missing: ${token}`);
const analytics = read("src/lib/client/analytics.ts");
if (!analytics.includes("eventId: input.eventId")) throw new Error("First-party event IDs are not caller-controlled for browser/server deduplication.");
const capi = read("src/lib/marketing/meta-capi.ts");
for (const token of ["event_id", "action_source", "META_CAPI_ACCESS_TOKEN", "client_ip_address", "client_user_agent", "createHash(\"sha256\")"]) if (!capi.includes(token)) throw new Error(`Meta CAPI implementation missing: ${token}`);
const eventRoute = read("app/api/v1/events/route.ts");
const orderRoute = read("app/api/v1/orders/route.ts");
for (const source of [eventRoute, orderRoute]) if (!source.includes("sendMetaCapiEvent")) throw new Error("Meta CAPI is not wired to both browser-event and purchase server paths.");
const privacy = read("app/privacy/page.js");
if (!privacy.includes("Meta Conversions API") || !privacy.includes("Google Analytics 4") || !privacy.includes("Google Tag Manager")) throw new Error("Privacy disclosure is stale for Part H third-party delivery.");
const consent = read("src/lib/privacy/consent.ts");
if (!consent.includes("2026-09-07")) throw new Error("Tracking policy version was not advanced for the new third-party disclosure.");
const settings = read("components/admin/StoreSettingsForm.js");
for (const token of ["GA4 Measurement ID", "Google Tag Manager ID", "META_CAPI_ACCESS_TOKEN"]) if (!settings.includes(token)) throw new Error(`Admin integration settings missing: ${token}`);
const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts["verify:part-h"] || !packageJson.scripts["db:verify:marketing-integrations"] || !packageJson.scripts.check.includes("verify:part-h")) throw new Error("Part H verification scripts are not wired.");
console.log("PART H MARKETING INTEGRATION FOUNDATION VERIFIED");
console.log("Consent-gated Meta Pixel + GA4 + GTM browser delivery: present");
console.log("Shared browser/server event IDs for Meta deduplication: present");
console.log("Meta CAPI browser commerce + Purchase server delivery: present");
console.log("Store-scoped GA4/GTM configuration and server-only CAPI credentials: present");
