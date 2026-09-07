import assert from "node:assert/strict";
import test from "node:test";
import { storeConfigSchema } from "./store-config";

function validConfig() {
  return {
    store: {
      name: "Reusable Store",
      slug: "reusable-store",
      primaryDomain: "example.test",
      currency: "bdt",
      timezone: "Asia/Dhaka",
      status: "ACTIVE" as const,
    },
    products: [
      {
        name: "Example Product",
        slug: "example-product",
        description: null,
        status: "ACTIVE" as const,
        variants: [
          {
            sku: "EXAMPLE-001",
            label: "Default",
            priceMinor: 125000,
            compareAtPriceMinor: 189000,
            isDefault: true,
            isActive: true,
            trackStock: false,
            available: 0,
          },
        ],
      },
    ],
  };
}

test("a reusable store configuration is normalized", () => {
  const config = storeConfigSchema.parse(validConfig());
  assert.equal(config.store.currency, "BDT");
  assert.equal(config.products[0]?.variants[0]?.priceMinor, 125000);
});

test("every product requires exactly one default variant", () => {
  const config = validConfig();
  config.products[0]!.variants[0]!.isDefault = false;

  assert.throws(
    () => storeConfigSchema.parse(config),
    /exactly one default variant/,
  );
});

test("duplicate SKUs and invalid inventory are rejected", () => {
  const config = validConfig();
  config.products.push({
    ...config.products[0]!,
    slug: "another-product",
    variants: [{ ...config.products[0]!.variants[0]!, available: 5 }],
  });

  assert.throws(() => storeConfigSchema.parse(config), /Variant SKUs|Untracked inventory/);
});
