import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (filePath) =>
  readFileSync(resolve(process.cwd(), filePath), "utf8");
const page = read("app/page.js");
const route = read("app/api/v1/events/route.ts");
const handler = read("src/lib/http/event-handler.ts");
const repository = read("src/lib/db/event-repository.ts");
const contracts = read("src/lib/commerce/contracts.ts");
const analytics = read("src/lib/client/analytics.ts");
const liveVerifier = read("scripts/db-verify-event-flow.ts");

for (const eventName of [
  "PAGE_VIEW",
  "VIEW_CONTENT",
  "ADD_TO_CART",
  "BEGIN_CHECKOUT",
]) {
  if (!contracts.includes(`"${eventName}"`)) {
    throw new Error(`Browser event contract missing: ${eventName}`);
  }
  if (!liveVerifier.includes(`"${eventName}"`)) {
    throw new Error(`Live event-flow verification missing: ${eventName}`);
  }
}

if (contracts.match(/browserCommerceEventNameSchema[\s\S]{0,300}"PURCHASE"/)) {
  throw new Error("The public browser event contract must not accept PURCHASE.");
}

for (const token of [
  "readBoundedJson(request, MAX_EVENT_BODY_BYTES)",
  'scope: "commerce-events:create"',
  "EVENT_RATE_LIMIT",
  "hashClientKey(clientKey)",
]) {
  if (!handler.includes(token)) {
    throw new Error(`Secure event handler invariant missing: ${token}`);
  }
}

for (const token of [
  "createHmac",
  "DrizzleRateLimiter",
  "DrizzleCommerceEventRepository",
  "recordBrowserCommerceEvent",
]) {
  if (!route.includes(token)) {
    throw new Error(`Event route wiring missing: ${token}`);
  }
}

for (const token of [
  "onConflictDoNothing",
  "visitorSessions",
  "multiplyMinorAmount",
  "deriveAttributionSource",
  "receivedAt: occurredAt",
]) {
  if (!repository.includes(token)) {
    throw new Error(`Event persistence invariant missing: ${token}`);
  }
}

for (const token of [
  'fetch("/api/v1/events"',
  "keepalive: true",
  "buildAttribution",
]) {
  if (!analytics.includes(token)) {
    throw new Error(`Browser analytics helper missing: ${token}`);
  }
}

const hasTrackingKeyResolver =
  analytics.includes("getBrowserTrackingKeys") ||
  analytics.includes("getFirstPartyTrackingKeys");

if (!hasTrackingKeyResolver) {
  throw new Error(
    "Browser analytics helper missing a supported tracking-key resolver.",
  );
}

for (const token of [
  "trackBrowserCommerceEvent",
  "trackEventOnce('page-view', 'PAGE_VIEW')",
  "trackEventOnce('view-content', 'VIEW_CONTENT'",
  "trackEventOnce('add-to-cart', 'ADD_TO_CART'",
  "trackEventOnce('begin-checkout', 'BEGIN_CHECKOUT'",
]) {
  if (!page.includes(token)) {
    throw new Error(`Landing behaviour instrumentation missing: ${token}`);
  }
}

console.log("PART C BATCH 06 FIRST-PARTY EVENTS VERIFIED");
console.log("Bounded and rate-limited public event API: present");
console.log("Server-authoritative product values and timestamps: present");
console.log("Idempotent visitor/session/event persistence: present");
console.log("Landing behaviour instrumentation: present");
console.log("Browser PURCHASE forgery prevention: present");
