import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogRepository } from "../commerce/catalog-repository";
import { handleCatalogGet } from "./catalog-handler";

const repository: CatalogRepository = {
  findActiveCatalog: async (storeSlug) =>
    storeSlug === "demo-store"
      ? {
          store: { name: "Demo", slug: "demo-store", currency: "BDT" },
          products: [],
        }
      : null,
};

test("the catalog endpoint returns cacheable public catalog data", async () => {
  const response = await handleCatalogGet(
    "demo-store",
    repository,
    () => "request-123",
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=60/);
  assert.deepEqual(await response.json(), {
    data: {
      store: { name: "Demo", slug: "demo-store", currency: "BDT" },
      products: [],
    },
  });
});

test("missing and malformed store slugs have distinct public errors", async () => {
  const missing = await handleCatalogGet(
    "missing-store",
    repository,
    () => "request-123",
  );
  const malformed = await handleCatalogGet(
    "NOT VALID",
    repository,
    () => "request-123",
  );

  assert.equal(missing.status, 404);
  assert.equal(malformed.status, 400);
});
