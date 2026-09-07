import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const contracts = read("src/lib/commerce/contracts.ts");
requireCondition(
  /analyticsAllowed:\s*z\.boolean\(\)\.default\(false\)/.test(contracts),
  "First-party analytics consent schema must accept false.",
);
requireCondition(
  !/analyticsAllowed:\s*z\.literal\(true\)/.test(contracts),
  "First-party event schema still requires analytics consent.",
);

const checkout = read("src/lib/client/checkout.ts");
requireCondition(
  checkout.includes("ANONYMOUS_VISITOR_STORAGE_KEY"),
  "Anonymous session-only visitor storage is missing.",
);
requireCondition(
  checkout.includes("ANONYMOUS_SESSION_STORAGE_KEY"),
  "Anonymous session key storage is missing.",
);
requireCondition(
  checkout.includes("getFirstPartyTrackingKeys"),
  "First-party tracking key resolver is missing.",
);
requireCondition(
  checkout.includes("includeClickIds"),
  "Attribution click-ID suppression is missing.",
);
requireCondition(
  checkout.includes('landingUrl.searchParams.delete("fbclid")') &&
    checkout.includes('landingUrl.searchParams.delete("gclid")'),
  "Privacy-reduced landing URL still retains advertising click IDs.",
);

const analytics = read("src/lib/client/analytics.ts");
const interactions = read("src/lib/client/interactions.ts");
for (const [name, source] of [["commerce", analytics], ["interaction", interactions]]) {
  requireCondition(
    source.includes("analyticsAllowed: input.analyticsAllowed"),
    `${name} client does not forward real analytics consent state.`,
  );
  requireCondition(
    source.includes("{ includeClickIds: input.analyticsAllowed }"),
    `${name} client does not suppress click IDs in privacy-reduced mode.`,
  );
  requireCondition(
    source.includes("getFirstPartyTrackingKeys"),
    `${name} client is not using first-party tracking identities.`,
  );
}

const eventHandler = read("src/lib/http/event-handler.ts");
const interactionHandler = read("src/lib/http/interaction-handler.ts");
requireCondition(
  eventHandler.includes("body.consent.analyticsAllowed") &&
    eventHandler.includes(": {};"),
  "Commerce event handler is not redacting request context without consent.",
);
requireCondition(
  interactionHandler.includes("body.consent.analyticsAllowed") &&
    interactionHandler.includes(": {};"),
  "Interaction handler is not redacting request context without consent.",
);

const page = read("app/page.js");
requireCondition(
  page.includes("getFirstPartyTrackingKeys"),
  "Landing page does not use the first-party tracking resolver for checkout attribution.",
);
requireCondition(
  page.includes("consentReady") && page.includes("setConsentReady(true)"),
  "Landing tracking can start before stored analytics preference has hydrated.",
);
requireCondition(
  !/function trackEventOnce[\s\S]{0,160}analyticsConsent !== 'accepted'\) return;/.test(page),
  "First-party commerce tracking is still gated by analytics consent.",
);
requireCondition(
  !/function trackInteraction[\s\S]{0,160}analyticsConsent !== 'accepted'\) return;/.test(page),
  "First-party interaction tracking is still gated by analytics consent.",
);
requireCondition(
  !/useEffect\(\(\) => \{\s*if \(analyticsConsent !== 'accepted'\) return;\s*trackInteraction\('SESSION_START'/.test(page),
  "Landing interaction observers are still consent-gated.",
);
requireCondition(
  (page.match(/analyticsAllowed:\s*analyticsConsent === 'accepted'/g) ?? []).length >= 3,
  "Landing page must pass the real external-analytics preference to first-party events and orders.",
);
requireCondition(
  page.includes("শুধু First-party"),
  "Consent UI does not explain the First-party-only choice.",
);

const pixel = read("src/lib/client/pixel.ts");
const google = read("src/lib/client/google.ts");
const clarity = read("src/lib/client/clarity.ts");
const capi = read("src/lib/marketing/meta-capi.ts");
requireCondition(
  pixel.includes('consent !== "accepted"'),
  "Meta Pixel consent gate was removed.",
);
requireCondition(
  google.includes('input.consent !== "accepted"'),
  "Google consent gate was removed.",
);
requireCondition(
  clarity.includes('consent !== "accepted"') || clarity.includes('input.consent !== "accepted"'),
  "Clarity consent gate was removed.",
);
requireCondition(
  capi.includes("if (!input.analyticsAllowed)"),
  "Meta CAPI consent gate was removed.",
);

const privacy = read("app/privacy/page.js");
requireCondition(
  privacy.includes("First-party anonymous measurement"),
  "Privacy page does not describe first-party anonymous measurement.",
);
requireCondition(
  read("src/lib/privacy/consent.ts").includes('CURRENT_PRIVACY_POLICY_VERSION = "2026-09-07.4"'),
  "Privacy policy version was not advanced for Part M.",
);

console.log("PART M FIRST-PARTY TRACKING V2 VERIFIED");
console.log("First-party page/commerce/interaction measurement: consent-independent");
console.log("Anonymous identities: session-only");
console.log("Anonymous attribution: UTM/referrer retained, fbclid/gclid suppressed");
console.log("Anonymous request fingerprint context: suppressed");
console.log("Meta / Google / Clarity / CAPI consent gates: preserved");
console.log("Privacy policy split architecture: documented");
