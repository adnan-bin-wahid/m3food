import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (filePath) =>
  readFileSync(resolve(process.cwd(), filePath), "utf8");
const page = read("app/page.js");
const privacyPage = read("app/privacy/page.js");
const styles = read("app/globals.css");
const consent = read("src/lib/privacy/consent.ts");
const contracts = read("src/lib/commerce/contracts.ts");
const schema = read("src/lib/db/schema.ts");
const orderRepository = read("src/lib/db/landing-order-repository.ts");
const eventRepository = read("src/lib/db/event-repository.ts");
const verifyStore = read("src/lib/db/verify-store.ts");
const liveVerifier = read("scripts/db-verify-consent-flow.ts");
const batchMigrations = readdirSync(resolve(process.cwd(), "drizzle")).filter(
  (name) => /^0004_.+\.sql$/.test(name),
);

if (batchMigrations.length !== 1) {
  throw new Error(
    `Expected one Batch 07 migration, found: ${batchMigrations.join(", ") || "none"}`,
  );
}
const migration = read(`drizzle/${batchMigrations[0]}`);
for (const token of [
  'CREATE TABLE "order_consents"',
  'ENABLE ROW LEVEL SECURITY',
  'order_consents_order_uniq',
]) {
  if (!migration.includes(token)) {
    throw new Error(`Consent migration invariant missing: ${token}`);
  }
}

if ((schema.match(/\.enableRLS\(\)/g)?.length ?? 0) < 15) {
  throw new Error("Expected the 15-table consent baseline to retain RLS.");
}
if (!verifyStore.includes('"order_consents"')) {
  throw new Error("Live store verification does not include order_consents.");
}

for (const token of [
  "orderConsentInputSchema",
  "analyticsEventConsentSchema",
  "analyticsAllowed: z.literal(true)",
  "privacyPolicyVersion",
]) {
  if (!contracts.includes(token)) {
    throw new Error(`Consent contract invariant missing: ${token}`);
  }
}

for (const token of [
  'export const orderConsents = pgTable(',
  '"order_consents"',
  "emailMarketingAllowed",
  "smsMarketingAllowed",
  "whatsappMarketingAllowed",
  ").enableRLS()",
]) {
  if (!schema.includes(token)) {
    throw new Error(`Auditable consent schema missing: ${token}`);
  }
}

for (const token of [
  "CURRENT_PRIVACY_POLICY_VERSION",
  "readAnalyticsConsent",
  "writeAnalyticsConsent",
  "ANALYTICS_CONSENT_STORAGE_KEY",
]) {
  if (!consent.includes(token)) {
    throw new Error(`Versioned browser consent helper missing: ${token}`);
  }
}

for (const token of [
  "if (analyticsConsent !== 'accepted') return",
  "clearBrowserTrackingKeys",
  "analyticsAllowed: analyticsConsent === 'accepted'",
  'name="privacyAcknowledged"',
  "consent-banner",
  'href="/privacy"',
]) {
  if (!page.includes(token)) {
    throw new Error(`Landing consent control missing: ${token}`);
  }
}

const hasLegacyMarketingConsent = page.includes('name="marketingConsent"');
const hasChannelMarketingConsent = [
  'name="emailMarketingConsent"',
  'name="smsMarketingConsent"',
  'name="whatsappMarketingConsent"',
].every((token) => page.includes(token));

if (!hasLegacyMarketingConsent && !hasChannelMarketingConsent) {
  throw new Error(
    "Landing marketing consent control missing: expected the legacy aggregate control or all channel-specific controls.",
  );
}

for (const token of [
  ".consent-banner",
  ".order-consent-check",
  ".privacy-page",
]) {
  if (!styles.includes(token)) {
    throw new Error(`Consent/privacy presentation missing: ${token}`);
  }
}

for (const token of [
  "অর্ডারের জন্য প্রয়োজনীয় তথ্য",
  "Analytics tracking",
  "Marketing communication",
  "Third-party delivery",
]) {
  if (!privacyPage.includes(token)) {
    throw new Error(`Privacy disclosure missing: ${token}`);
  }
}

if (!orderRepository.includes("this.transaction.insert(orderConsents)")) {
  throw new Error("Order consent is not persisted atomically with the order.");
}
if (!eventRepository.includes("consent: input.consent")) {
  throw new Error("First-party events do not retain their consent assertion.");
}

for (const token of [
  "M3Food Consent Test",
  "orderConsents",
  "privacyPolicyVersion",
  "idempotently reused",
]) {
  if (!liveVerifier.includes(token)) {
    throw new Error(`Live consent verification missing: ${token}`);
  }
}

console.log("PART C BATCH 07 CONSENT AND PRIVACY VERIFIED");
console.log("Analytics disabled before explicit choice: present");
console.log("Necessary-only path without durable tracking: present");
console.log("Versioned privacy disclosure: present");
console.log("Atomic order communication-consent snapshot: present");
console.log("RLS-protected consent records: present");
