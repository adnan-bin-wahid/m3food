import assert from "node:assert/strict";
import test from "node:test";
import { trackBrowserInteraction } from "./interactions";

function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

test("consented interaction tracking posts attribution and CTA metadata", async () => {
  const requests: Array<{ input: string; init: RequestInit }> = [];
  let counter = 0;
  const ok = await trackBrowserInteraction({
    storeSlug: "m3food",
    eventName: "CTA_CLICK",
    analyticsAllowed: true,
    privacyPolicyVersion: "2026-09-07.4",
    elementKey: "hero_order",
    elementLabel: "Order now",
    sectionKey: "hero",
    targetUrl: "https://example.test/#order",
  }, {
    pageUrl: "https://example.test/?utm_source=facebook&fbclid=meta-click",
    referrer: "https://facebook.com/",
    localStorage: storage(),
    sessionStorage: storage(),
    createUuid: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
    fetch: async (input, init) => { requests.push({ input, init }); return { ok: true }; },
  });
  assert.equal(ok, true);
  assert.equal(requests[0]?.input, "/api/v1/interactions");
  const body = JSON.parse(String(requests[0]?.init.body));
  assert.equal(body.eventName, "CTA_CLICK");
  assert.equal(body.elementKey, "hero_order");
  assert.equal(body.consent.analyticsAllowed, true);
  assert.equal(body.attribution.utmSource, "facebook");
  assert.equal(body.attribution.fbclid, "meta-click");
});

test("first-party CTA tracking works without analytics consent and omits click IDs", async () => {
  const requests: Array<{ input: string; init: RequestInit }> = [];
  const localStorage = storage();
  const sessionStorage = storage();

  const ok = await trackBrowserInteraction({
    storeSlug: "m3food",
    eventName: "CTA_CLICK",
    analyticsAllowed: false,
    privacyPolicyVersion: "2026-09-07.4",
    elementKey: "hero_order",
    elementLabel: "Order now",
    sectionKey: "hero",
  }, {
    pageUrl:
      "https://example.test/?utm_source=facebook&utm_campaign=launch&fbclid=meta-click&gclid=google-click",
    referrer: "https://facebook.com/",
    localStorage,
    sessionStorage,
    createUuid: () => "11111111-1111-4111-8111-111111111111",
    fetch: async (input, init) => { requests.push({ input, init }); return { ok: true }; },
  });

  assert.equal(ok, true);
  const body = JSON.parse(String(requests[0]?.init.body));
  assert.equal(body.consent.analyticsAllowed, false);
  assert.equal(body.attribution.utmSource, "facebook");
  assert.equal(body.attribution.utmCampaign, "launch");
  assert.equal(body.attribution.fbclid, undefined);
  assert.equal(body.attribution.gclid, undefined);
  assert.equal(body.attribution.landingPage.includes("fbclid"), false);
  assert.equal(body.attribution.landingPage.includes("gclid"), false);
  assert.match(body.attribution.visitorKey, /^visitor_session_/);
  assert.equal(localStorage.values.size, 0);
  assert.equal(sessionStorage.values.has("commerce_anon_visitor_key"), true);
});
