import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAttribution,
  clearBrowserTrackingKeys,
  getBrowserTrackingKeys,
  getFirstPartyTrackingKeys,
  getOrCreateTrackingKey,
  selectDefaultVariant,
  type PublicCatalog,
} from "./checkout";

const catalog: PublicCatalog = {
  store: { name: "Demo", slug: "demo-store", currency: "BDT" },
  products: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Demo Product",
      slug: "demo-product",
      description: null,
      variants: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          sku: "DEMO-001",
          label: "Secondary",
          priceMinor: 10000,
          compareAtPriceMinor: null,
          isDefault: false,
          inStock: true,
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          sku: "DEMO-002",
          label: "Default",
          priceMinor: 12500,
          compareAtPriceMinor: 15000,
          isDefault: true,
          inStock: true,
        },
      ],
    },
  ],
};

function storage(values: Map<string, string>) {
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("the catalog default variant is selected", () => {
  assert.equal(selectDefaultVariant(catalog)?.variant.sku, "DEMO-002");
  assert.equal(selectDefaultVariant({ ...catalog, products: [] }), null);
});

test("tracking keys persist when storage is available", () => {
  const values = new Map<string, string>();
  const first = getOrCreateTrackingKey(
    storage(values),
    "visitor",
    "visitor",
    () => "11111111-1111-4111-8111-111111111111",
  );
  const second = getOrCreateTrackingKey(
    storage(values),
    "visitor",
    "visitor",
    () => "22222222-2222-4222-8222-222222222222",
  );

  assert.equal(first, second);
  assert.match(first, /^visitor_/);
});

test("consented tracking uses durable visitor and consented session keys", () => {
  const localValues = new Map<string, string>();
  const sessionValues = new Map<string, string>();
  let counter = 0;

  const first = getBrowserTrackingKeys(
    storage(localValues),
    storage(sessionValues),
    () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
  );
  const repeated = getBrowserTrackingKeys(
    storage(localValues),
    storage(sessionValues),
    () => "unused-uuid",
  );

  assert.deepEqual(repeated, first);
  assert.match(first.visitorKey, /^visitor_/);
  assert.match(first.sessionKey, /^session_/);
  assert.equal(localValues.has("commerce_visitor_key"), true);
  assert.equal(sessionValues.has("commerce_session_key"), true);
});

test("first-party measurement without analytics consent is session-only", () => {
  const localValues = new Map<string, string>();
  const sessionValues = new Map<string, string>();
  let counter = 0;

  const first = getFirstPartyTrackingKeys(
    storage(localValues),
    storage(sessionValues),
    () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
    false,
  );
  const repeated = getFirstPartyTrackingKeys(
    storage(localValues),
    storage(sessionValues),
    () => "unused-uuid",
    false,
  );

  assert.deepEqual(repeated, first);
  assert.equal(localValues.size, 0);
  assert.match(first.visitorKey, /^visitor_session_/);
  assert.match(first.sessionKey, /^session_anon_/);
  assert.equal(sessionValues.has("commerce_anon_visitor_key"), true);
  assert.equal(sessionValues.has("commerce_anon_session_key"), true);
  assert.equal(sessionValues.has("commerce_session_key"), false);
});

test("accepting analytics starts a separate durable identity instead of merging anonymous history", () => {
  const localValues = new Map<string, string>();
  const sessionValues = new Map<string, string>();
  let counter = 0;
  const createUuid = () =>
    `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;

  const anonymous = getFirstPartyTrackingKeys(
    storage(localValues),
    storage(sessionValues),
    createUuid,
    false,
  );
  const consented = getFirstPartyTrackingKeys(
    storage(localValues),
    storage(sessionValues),
    createUuid,
    true,
  );

  assert.notEqual(anonymous.visitorKey, consented.visitorKey);
  assert.notEqual(anonymous.sessionKey, consented.sessionKey);
  assert.equal(localValues.has("commerce_visitor_key"), true);
  assert.equal(sessionValues.has("commerce_anon_visitor_key"), true);
});

test("declining analytics clears only durable consented tracking keys", () => {
  const localValues = new Map([
    ["commerce_visitor_key", "visitor_existing_key"],
  ]);
  const sessionValues = new Map([
    ["commerce_session_key", "session_existing_key"],
    ["commerce_anon_visitor_key", "visitor_session_existing_key"],
    ["commerce_anon_session_key", "session_anon_existing_key"],
  ]);

  clearBrowserTrackingKeys(storage(localValues), storage(sessionValues));

  assert.equal(localValues.has("commerce_visitor_key"), false);
  assert.equal(sessionValues.has("commerce_session_key"), false);
  assert.equal(sessionValues.has("commerce_anon_visitor_key"), true);
  assert.equal(sessionValues.has("commerce_anon_session_key"), true);
});

test("UTM attribution remains available while click IDs can be suppressed", () => {
  const url = `https://example.test/offer?utm_source=facebook&utm_campaign=launch&fbclid=${"x".repeat(3000)}&gclid=google-click`;
  const full = buildAttribution(
    url,
    "https://facebook.com/ad",
    "visitor_1234567890",
    "session_1234567890",
  );
  const privacyReduced = buildAttribution(
    url,
    "https://facebook.com/ad",
    "visitor_1234567890",
    "session_1234567890",
    { includeClickIds: false },
  );

  assert.equal(full.utmSource, "facebook");
  assert.equal(full.utmCampaign, "launch");
  assert.equal(full.referrer, "https://facebook.com/ad");
  assert.equal(full.fbclid?.length, 2048);
  assert.equal(full.gclid, "google-click");
  assert.equal(privacyReduced.utmSource, "facebook");
  assert.equal(privacyReduced.utmCampaign, "launch");
  assert.equal(privacyReduced.fbclid, undefined);
  assert.equal(privacyReduced.gclid, undefined);
  assert.equal(privacyReduced.landingPage?.includes("fbclid"), false);
  assert.equal(privacyReduced.landingPage?.includes("gclid"), false);
});
