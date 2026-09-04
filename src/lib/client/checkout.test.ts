import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAttribution,
  getBrowserTrackingKeys,
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

test("the catalog default variant is selected", () => {
  assert.equal(selectDefaultVariant(catalog)?.variant.sku, "DEMO-002");
  assert.equal(
    selectDefaultVariant({ ...catalog, products: [] }),
    null,
  );
});

test("tracking keys persist when storage is available", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  const first = getOrCreateTrackingKey(
    storage,
    "visitor",
    "visitor",
    () => "11111111-1111-4111-8111-111111111111",
  );
  const second = getOrCreateTrackingKey(
    storage,
    "visitor",
    "visitor",
    () => "22222222-2222-4222-8222-222222222222",
  );

  assert.equal(first, second);
  assert.match(first, /^visitor_/);
});

test("browser tracking uses separate durable visitor and session keys", () => {
  const localValues = new Map<string, string>();
  const sessionValues = new Map<string, string>();
  let counter = 0;
  const storage = (values: Map<string, string>) => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });

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
});

test("UTM and click identifiers are captured with deterministic limits", () => {
  const attribution = buildAttribution(
    `https://example.test/offer?utm_source=facebook&utm_campaign=launch&fbclid=${"x".repeat(3000)}`,
    "https://facebook.com/ad",
    "visitor_1234567890",
    "session_1234567890",
  );

  assert.equal(attribution.utmSource, "facebook");
  assert.equal(attribution.utmCampaign, "launch");
  assert.equal(attribution.referrer, "https://facebook.com/ad");
  assert.equal(attribution.fbclid?.length, 2048);
});
