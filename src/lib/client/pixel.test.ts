import assert from "node:assert/strict";
import test from "node:test";
import { revokeMetaPixelConsent, trackMetaPixelEvent } from "./pixel";

function browserEnvironment() {
  const scripts: Array<Record<string, unknown>> = [];
  const browser: Record<string, any> = {};
  const document = {
    getElementById: () => null,
    createElement: () => ({}),
    head: { appendChild: (script: Record<string, unknown>) => { scripts.push(script); return script; } },
  };
  return { browser, document, scripts };
}

test("Meta Pixel does not load without consent or a valid ID", () => {
  const environment = browserEnvironment();
  trackMetaPixelEvent({ pixelId: "123456789", consent: "declined", eventName: "PAGE_VIEW" }, environment);
  trackMetaPixelEvent({ pixelId: "not-a-pixel", consent: "accepted", eventName: "PAGE_VIEW" }, environment);
  assert.equal(environment.browser.fbq, undefined);
  assert.equal(environment.scripts.length, 0);
});

test("Meta Pixel loads once, initializes once, and maps commerce events", () => {
  const environment = browserEnvironment();
  trackMetaPixelEvent({ pixelId: "123456789", consent: "accepted", eventName: "PAGE_VIEW", dedupeKey: "page" }, environment);
  trackMetaPixelEvent({ pixelId: "123456789", consent: "accepted", eventName: "PURCHASE", data: { value: 1250, currency: "BDT" }, eventId: "ORD-1" }, environment);
  assert.equal(environment.scripts.length, 1);
  assert.equal(environment.scripts[0]?.src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.deepEqual(environment.browser.fbq.queue, [
    ["init", "123456789"],
    ["consent", "grant"],
    ["trackSingle", "123456789", "PageView", {}, {}],
    ["consent", "grant"],
    ["trackSingle", "123456789", "Purchase", { value: 1250, currency: "BDT" }, { eventID: "ORD-1" }],
  ]);
});

test("Meta Pixel deduplicates events and forwards consent revocation", () => {
  const environment = browserEnvironment();
  const input = { pixelId: "123456789", consent: "accepted", eventName: "PAGE_VIEW", dedupeKey: "page" } as const;
  assert.equal(trackMetaPixelEvent(input, environment), true);
  assert.equal(trackMetaPixelEvent(input, environment), false);
  assert.equal(revokeMetaPixelConsent(environment), true);
  assert.deepEqual(environment.browser.fbq.queue.at(-1), ["consent", "revoke"]);
});
