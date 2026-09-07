import assert from "node:assert/strict";
import test from "node:test";
import { trackBrowserInteraction } from "./interactions";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

test("interaction tracking posts attribution and CTA metadata", async () => {
  const requests: Array<{ input: string; init: RequestInit }> = [];
  let counter = 0;
  const ok = await trackBrowserInteraction({
    storeSlug: "m3food",
    eventName: "CTA_CLICK",
    privacyPolicyVersion: "2026-09-07",
    elementKey: "hero_order",
    elementLabel: "Order now",
    sectionKey: "hero",
    targetUrl: "https://example.test/#order",
  }, {
    pageUrl: "https://example.test/?utm_source=facebook",
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
  assert.equal(body.attribution.utmSource, "facebook");
});
