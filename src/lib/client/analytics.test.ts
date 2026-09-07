import assert from "node:assert/strict";
import test from "node:test";
import { trackBrowserCommerceEvent } from "./analytics";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

test("consented browser analytics posts an attributed product event", async () => {
  const requests: Array<{ input: string; init: RequestInit }> = [];
  let counter = 0;
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();

  const result = await trackBrowserCommerceEvent(
    {
      storeSlug: "demo-store",
      eventName: "BEGIN_CHECKOUT",
      analyticsAllowed: true,
      privacyPolicyVersion: "2026-09-07.4",
      eventId: "shared-event-id",
      quantity: 2,
      selection: {
        product: { id: "11111111-1111-4111-8111-111111111111" },
        variant: {
          id: "22222222-2222-4222-8222-222222222222",
          sku: "DEMO-001",
          label: null,
          priceMinor: 125000,
          compareAtPriceMinor: 189000,
          isDefault: true,
          inStock: true,
        },
      },
    },
    {
      pageUrl: "https://example.test/?utm_source=facebook&fbclid=meta-click",
      referrer: "https://facebook.com/",
      localStorage,
      sessionStorage,
      createUuid: () =>
        `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
      fetch: async (input, init) => {
        requests.push({ input, init });
        return { ok: true };
      },
    },
  );

  assert.equal(result, true);
  assert.equal(requests[0]?.input, "/api/v1/events");
  assert.equal(requests[0]?.init.keepalive, true);
  const body = JSON.parse(String(requests[0]?.init.body)) as Record<string, any>;
  assert.equal(body.eventName, "BEGIN_CHECKOUT");
  assert.equal(body.eventId, "shared-event-id");
  assert.equal(body.quantity, 2);
  assert.equal(body.consent.analyticsAllowed, true);
  assert.equal(body.attribution.utmSource, "facebook");
  assert.equal(body.attribution.fbclid, "meta-click");
  assert.match(body.attribution.visitorKey, /^visitor_/);
  assert.equal(localStorage.values.has("commerce_visitor_key"), true);
});

test("first-party commerce measurement works without analytics consent and stays session-only", async () => {
  const requests: Array<{ input: string; init: RequestInit }> = [];
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();

  const result = await trackBrowserCommerceEvent(
    {
      storeSlug: "demo-store",
      eventName: "PAGE_VIEW",
      analyticsAllowed: false,
      privacyPolicyVersion: "2026-09-07.4",
      eventId: "anonymous-page-view",
    },
    {
      pageUrl:
        "https://example.test/?utm_source=facebook&utm_campaign=launch&fbclid=meta-click&gclid=google-click",
      referrer: "https://facebook.com/",
      localStorage,
      sessionStorage,
      createUuid: () => "11111111-1111-4111-8111-111111111111",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return { ok: true };
      },
    },
  );

  assert.equal(result, true);
  const body = JSON.parse(String(requests[0]?.init.body)) as Record<string, any>;
  assert.equal(body.consent.analyticsAllowed, false);
  assert.equal(body.attribution.utmSource, "facebook");
  assert.equal(body.attribution.utmCampaign, "launch");
  assert.equal(body.attribution.fbclid, undefined);
  assert.equal(body.attribution.gclid, undefined);
  assert.equal(body.attribution.landingPage.includes("fbclid"), false);
  assert.equal(body.attribution.landingPage.includes("gclid"), false);
  assert.match(body.attribution.visitorKey, /^visitor_session_/);
  assert.match(body.attribution.sessionKey, /^session_anon_/);
  assert.equal(localStorage.values.size, 0);
  assert.equal(sessionStorage.values.has("commerce_anon_visitor_key"), true);
});

test("browser analytics failures never interrupt the landing experience", async () => {
  const result = await trackBrowserCommerceEvent(
    {
      storeSlug: "demo-store",
      eventName: "PAGE_VIEW",
      analyticsAllowed: false,
      privacyPolicyVersion: "2026-09-07.4",
    },
    {
      pageUrl: "https://example.test/",
      referrer: "",
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      createUuid: () => "11111111-1111-4111-8111-111111111111",
      fetch: async () => {
        throw new Error("offline");
      },
    },
  );

  assert.equal(result, false);
});
