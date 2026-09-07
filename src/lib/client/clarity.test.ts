import assert from "node:assert/strict";
import test from "node:test";
import { loadClarity, revokeClarityConsent, trackClarityEvent } from "./clarity";

function environment() {
  const appended: any[] = [];
  const nodes = new Map<string, any>();
  const browser: any = {};
  const documentObject: any = {
    head: { appendChild(node: any) { appended.push(node); if (node.id) nodes.set(node.id, node); return node; } },
    createElement() { return {}; },
    getElementById(id: string) { return nodes.get(id); },
  };
  return { browser, documentObject, appended };
}

test("Clarity loads only after explicit analytics consent and identifies Effy visitor/session", () => {
  const env = environment();
  assert.equal(loadClarity({ projectId: "abc123xyz", consent: "declined", visitorKey: "visitor_1", sessionKey: "session_1", pageId: "/" }, { browser: env.browser, document: env.documentObject }), false);
  assert.equal(env.appended.length, 0);
  assert.equal(loadClarity({ projectId: "abc123xyz", consent: "accepted", visitorKey: "visitor_1", sessionKey: "session_1", pageId: "/" }, { browser: env.browser, document: env.documentObject }), true);
  assert.equal(env.appended.length, 1);
  assert.equal(env.appended[0].src, "https://www.clarity.ms/tag/abc123xyz");
  const calls = env.browser.clarity.q;
  assert.deepEqual(calls[0], ["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }]);
  assert.deepEqual(calls[1], ["identify", "visitor_1", "session_1", "/"]);
});

test("Clarity custom events and consent revocation use the existing queue", () => {
  const env = environment();
  loadClarity({ projectId: "abc123xyz", consent: "accepted", visitorKey: "visitor_1", sessionKey: "session_1", pageId: "/" }, { browser: env.browser, document: env.documentObject });
  assert.equal(trackClarityEvent("cta_click.hero_order", "accepted", { browser: env.browser }), true);
  assert.equal(revokeClarityConsent({ browser: env.browser }), true);
  const calls = env.browser.clarity.q;
  assert.deepEqual(calls.at(-2), ["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }]);
  assert.deepEqual(calls.at(-1), ["consent", false]);
});
