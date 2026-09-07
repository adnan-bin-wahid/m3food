import assert from "node:assert/strict";
import test from "node:test";
import { revokeGoogleConsent, trackGoogleCommerceEvent } from "./google";

function environment() {
  const scripts: Record<string, any>[] = [];
  const browser: Record<string, any> = {};
  const document = {
    getElementById: () => null,
    createElement: () => ({}),
    head: { appendChild: (script: Record<string, any>) => { scripts.push(script); return script; } },
  };
  return { browser, document, scripts };
}

test("Google tags stay disabled without explicit consent or valid IDs", () => {
  const env = environment();
  assert.equal(trackGoogleCommerceEvent({ measurementId: "G-ABC12345", consent: "declined", eventName: "PAGE_VIEW" }, env), false);
  assert.equal(trackGoogleCommerceEvent({ measurementId: "bad", consent: "accepted", eventName: "PAGE_VIEW" }, env), false);
  assert.equal(env.scripts.length, 0);
});

test("GA4 and GTM load once and receive normalized commerce events", () => {
  const env = environment();
  const input = {
    measurementId: "G-ABC12345",
    containerId: "GTM-ABC1234",
    consent: "accepted",
    eventName: "ADD_TO_CART" as const,
    eventId: "event-1",
    dedupeKey: "cart",
    currency: "BDT",
    value: 1250,
    item: { id: "M3F-CMM-001", name: "Product", price: 1250, quantity: 1 },
  };
  assert.equal(trackGoogleCommerceEvent(input, env), true);
  assert.equal(trackGoogleCommerceEvent(input, env), false);
  assert.equal(env.scripts.length, 2);
  assert.ok(env.browser.dataLayer.some((entry: any) => Array.isArray(entry) && entry[0] === "event" && entry[1] === "add_to_cart"));
  assert.ok(env.browser.dataLayer.some((entry: any) => entry?.event === "effy_add_to_cart"));
});

test("Google consent can be revoked", () => {
  const env = environment();
  revokeGoogleConsent(env);
  assert.deepEqual(env.browser.dataLayer.at(-1), ["consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  }]);
});
