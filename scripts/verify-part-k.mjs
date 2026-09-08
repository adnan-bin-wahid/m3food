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

const required = [
  "src/lib/analytics/interaction-contracts.ts",
  "src/lib/analytics/interaction-service.ts",
  "src/lib/client/interactions.ts",
  "src/lib/client/clarity.ts",
  "src/lib/db/interaction-repository.ts",
  "src/lib/http/interaction-handler.ts",
  "app/api/v1/interactions/route.ts",
  "src/lib/admin/visitor-intelligence-service.ts",
  "src/lib/db/admin-visitor-intelligence-repository.ts",
  "app/admin/marketing/interactions/page.js",
  "app/admin/marketing/visitors/[sessionKey]/page.js",
  "drizzle/0012_visitor_intelligence_clarity.sql",
  "drizzle/meta/0012_snapshot.json",
  "scripts/db-verify-part-k.ts",
  "docs/part-k-visitor-intelligence-clarity.md",
];
for (const file of required) assert(exists(file), `Part K required file missing: ${file}`);

contains("src/lib/db/schema.ts", "visitorInteractionEvents", "visitorInteractionEventNameEnum", "clarityProjectId", ".enableRLS()");
contains("src/lib/analytics/interaction-contracts.ts", "SESSION_START", "SECTION_VIEW", "CTA_VIEW", "CTA_CLICK", "SCROLL_DEPTH", "WHATSAPP_CLICK", "MESSENGER_CLICK");
contains("src/lib/http/interaction-handler.ts", "visitor-interactions:create", "INTERACTION_RATE_LIMIT", "browserInteractionEventInputSchema");
contains("src/lib/analytics/interaction-contracts.ts", "analyticsEventConsentSchema", "CTA_VIEW", "CTA_CLICK");
contains("src/lib/db/interaction-repository.ts", "onConflictDoNothing", "visitorInteractionEvents", "visitorSessions", "visitors");
contains("src/lib/client/clarity.ts", "consentv2", "analytics_Storage", "identify", "effy_visitor", "effy_session", "www.clarity.ms/tag");
contains("app/page.js", "data-track-cta", "CTA_VIEW", "CTA_CLICK", "SECTION_VIEW", "SCROLL_DEPTH", "loadClarity", "data-clarity-mask=\"true\"");
contains("app/page.js", "WHATSAPP_CLICK", "MESSENGER_CLICK", "cta-view:${elementKey}");
contains("src/lib/db/admin-visitor-intelligence-repository.ts", "unique_views", "unique_clicks", "attributed_orders", "visitor_interaction_events", "ORDER_STATUS");
contains("src/lib/admin/visitor-intelligence-service.ts", "ctr:", "uniqueClicks / uniqueViews", "getVisitorSessionJourney");
contains("app/admin/marketing/interactions/page.js", "CTA performance", "Unique views", "Unique clicks", "CTR", "Revenue", "Microsoft Clarity");
contains("app/admin/marketing/visitors/[sessionKey]/page.js", "Chronological first-party journey", "Clarity correlation", "Visitor ID", "Session ID");
contains("components/admin/MarketingNav.js", "/admin/marketing/interactions", "Interactions");
contains("components/admin/AdminShell.js", "/admin/marketing/interactions", "Interactions");
contains("components/admin/StoreSettingsForm.js", "Microsoft Clarity Project ID", "clarityProjectId");
contains("src/lib/admin/settings-service.ts", "clarityProjectId", "Clarity Project ID");
contains("src/lib/db/catalog-repository.ts", "clarityProjectId");
const privacyPage = read("app/privacy/page.js");

for (const token of [
  "CTA view/click",
  "scroll-depth",
  "Microsoft Clarity",
  "masked",
]) {
  assert(
    privacyPage.includes(token),
    `app/privacy/page.js is missing: ${token}`,
  );
}

const hasLegacyAnonymousVisitorDisclosure =
  privacyPage.includes("anonymous visitor ID");

const hasPrivacyReducedAnonymousDisclosure =
  privacyPage.includes("First-party anonymous measurement") &&
  privacyPage.includes("durable cross-session visitor ID");

assert(
  hasLegacyAnonymousVisitorDisclosure ||
    hasPrivacyReducedAnonymousDisclosure,
  "Privacy page has neither the original anonymous visitor disclosure nor the later privacy-reduced first-party disclosure.",
);
const consentSource = read("src/lib/privacy/consent.ts");

const hasPartKPolicyVersion =
  consentSource.includes(
    'CURRENT_PRIVACY_POLICY_VERSION = "2026-09-07.3"',
  );

const hasLaterPartMPolicyVersion =
  consentSource.includes(
    'CURRENT_PRIVACY_POLICY_VERSION = "2026-09-07.4"',
  );

assert(
  hasPartKPolicyVersion || hasLaterPartMPolicyVersion,
  "Privacy policy version is neither the Part K version nor the later Part M version.",
);
contains("drizzle/0012_visitor_intelligence_clarity.sql", "visitor_interaction_events", "clarity_project_id", "ENABLE ROW LEVEL SECURITY", "CTA_CLICK", "SCROLL_DEPTH");
contains("package.json", '"verify:part-k"', '"db:verify:part-k"', "src/lib/analytics/*.test.ts");

const landing = read("app/page.js");
assert(!landing.includes('data-track-cta=""'), "Landing contains an empty CTA tracking key.");
assert(!read("components/admin/StoreSettingsForm.js").includes("CLARITY_SECRET"), "Clarity must not expose a server secret because Project ID is public configuration only.");

console.log("PART K VISITOR INTELLIGENCE & CLARITY VERIFIED");
console.log("Interaction tracking foundation with later privacy-reduced compatibility: present");
console.log("CTA CTR, CTA-attributed orders/revenue and chronological visitor journey: present");
console.log("Clarity ConsentV2, Identify correlation and masked order form: present");
console.log("Store-scoped interaction persistence, admin visibility, migration and live verifier: present");
