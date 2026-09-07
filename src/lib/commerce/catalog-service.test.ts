import assert from "node:assert/strict";
import test from "node:test";
import type {
  CatalogRepository,
  StoreCatalog,
} from "./catalog-repository";
import { getStoreCatalog } from "./catalog-service";
import { CommerceError } from "./commerce-error";

const catalog: StoreCatalog = {
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
          label: "Default",
          priceMinor: 125000,
          compareAtPriceMinor: 189000,
          isDefault: true,
          inStock: true,
        },
      ],
    },
  ],
};

test("an active catalog is returned without changing its data", async () => {
  const repository: CatalogRepository = {
    findActiveCatalog: async (storeSlug) =>
      storeSlug === "demo-store" ? catalog : null,
  };

  assert.equal(await getStoreCatalog("demo-store", repository), catalog);
});

test("an unavailable store produces a typed commerce error", async () => {
  const repository: CatalogRepository = {
    findActiveCatalog: async () => null,
  };

  await assert.rejects(
    () => getStoreCatalog("missing-store", repository),
    (error: unknown) =>
      error instanceof CommerceError && error.code === "STORE_NOT_AVAILABLE",
  );
});
