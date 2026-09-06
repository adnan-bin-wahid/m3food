import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminCatalogRepository,
  AdminCatalogSnapshot,
} from "./catalog-admin-repository";
import {
  AdminCatalogError,
  adminVariantCreateSchema,
  canManageCatalog,
  createAdminProduct,
  parseAdminMoneyToMinor,
  parseOptionalAdminMoneyToMinor,
  summarizeAdminCatalog,
  updateAdminInventory,
} from "./catalog-admin-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

const snapshot: AdminCatalogSnapshot = {
  store: {
    name: "M3Food",
    slug: "m3food",
    currency: "BDT",
    timezone: "Asia/Dhaka",
  },
  products: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      revision: 2,
      name: "Product",
      slug: "product",
      description: null,
      status: "ACTIVE",
      variants: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          revision: 3,
          sku: "SKU-1",
          label: "One",
          priceMinor: 10000,
          compareAtPriceMinor: 12000,
          isDefault: true,
          isActive: true,
          trackStock: true,
          available: 8,
          reserved: 4,
          inventoryRevision: 5,
        },
        {
          id: "55555555-5555-4555-8555-555555555555",
          revision: 0,
          sku: "SKU-2",
          label: "Two",
          priceMinor: 20000,
          compareAtPriceMinor: null,
          isDefault: false,
          isActive: true,
          trackStock: true,
          available: 3,
          reserved: 3,
          inventoryRevision: 1,
        },
      ],
    },
  ],
};

function makeRepository(
  overrides: Partial<AdminCatalogRepository> = {},
): AdminCatalogRepository {
  return {
    async getCatalog() {
      return snapshot;
    },
    async getProduct() {
      return null;
    },
    async createProduct() {
      return { kind: "NOT_FOUND" } as const;
    },
    async updateProduct() {
      return { kind: "NOT_FOUND" } as const;
    },
    async createVariant() {
      return { kind: "NOT_FOUND" } as const;
    },
    async updateVariant() {
      return { kind: "NOT_FOUND" } as const;
    },
    async setDefaultVariant() {
      return { kind: "NOT_FOUND" } as const;
    },
    async updateInventory() {
      return { kind: "NOT_FOUND" } as const;
    },
    ...overrides,
  };
}

test("catalog writes are restricted to OWNER and ADMIN", () => {
  assert.equal(canManageCatalog("OWNER"), true);
  assert.equal(canManageCatalog("ADMIN"), true);
  assert.equal(canManageCatalog("ORDER_MANAGER"), false);
  assert.equal(canManageCatalog("ANALYST"), false);
});

test("stock summary uses sellable stock after reservations", () => {
  const summary = summarizeAdminCatalog(snapshot);
  assert.equal(summary.productCount, 1);
  assert.equal(summary.variantCount, 2);
  assert.equal(summary.lowStockVariantCount, 1);
  assert.equal(summary.outOfStockVariantCount, 1);
});

test("admin money parsing is exact to two decimal places", () => {
  assert.equal(parseAdminMoneyToMinor("1250"), 125000);
  assert.equal(parseAdminMoneyToMinor("1250.5"), 125050);
  assert.equal(parseAdminMoneyToMinor("1250.05"), 125005);
  assert.equal(parseOptionalAdminMoneyToMinor(""), null);
  assert.equal(Number.isNaN(parseAdminMoneyToMinor("12.345")), true);
  assert.equal(Number.isNaN(parseAdminMoneyToMinor("-1")), true);
});

test("variant validation rejects bad compare-at price and untracked stock", () => {
  const base = {
    productId: "33333333-3333-4333-8333-333333333333",
    sku: "SKU-NEW",
    label: "New",
    priceMinor: 10000,
    compareAtPriceMinor: 9000,
    isActive: true,
    trackStock: false,
    available: 4,
  };
  assert.equal(adminVariantCreateSchema.safeParse(base).success, false);
  assert.equal(
    adminVariantCreateSchema.safeParse({
      ...base,
      compareAtPriceMinor: 12000,
      available: 0,
    }).success,
    true,
  );
});

test("product creation is store scoped and carries immutable actor identity", async () => {
  const captured: {
    value: Parameters<AdminCatalogRepository["createProduct"]>[0] | null;
  } = { value: null };
  const repository = makeRepository({
    async createProduct(input) {
      captured.value = input;
      return {
        kind: "OK",
        value: { id: "66666666-6666-4666-8666-666666666666", revision: 0 },
      } as const;
    },
  });

  await createAdminProduct(
    owner,
    { name: " New Product ", slug: "new-product", description: "" },
    repository,
    new Date("2026-09-06T12:00:00Z"),
  );

  assert.ok(captured.value);
  const capturedInput = captured.value;

  assert.equal(capturedInput.storeId, owner.storeId);
  assert.deepEqual(capturedInput.actor, {
    id: owner.id,
    email: owner.email,
  });
  assert.equal(capturedInput.name, "New Product");
  assert.equal(capturedInput.description, null);
});

test("read-only roles fail before a catalog mutation reaches the repository", async () => {
  let called = false;
  const repository = makeRepository({
    async createProduct() {
      called = true;
      return {
        kind: "OK",
        value: { id: "66666666-6666-4666-8666-666666666666", revision: 0 },
      } as const;
    },
  });
  const analyst: AdminIdentity = { ...owner, role: "ANALYST" };

  await assert.rejects(
    () =>
      createAdminProduct(
        analyst,
        { name: "Product", slug: "product-two", description: "" },
        repository,
      ),
    (error: unknown) =>
      error instanceof AdminCatalogError && error.code === "FORBIDDEN",
  );
  assert.equal(called, false);
});

test("inventory conflicts are translated into safe admin errors", async () => {
  const repository = makeRepository({
    async updateInventory() {
      return { kind: "RESERVED_STOCK" } as const;
    },
  });

  await assert.rejects(
    () =>
      updateAdminInventory(
        owner,
        {
          productId: "33333333-3333-4333-8333-333333333333",
          variantId: "44444444-4444-4444-8444-444444444444",
          expectedRevision: 5,
          trackStock: false,
          available: 0,
        },
        repository,
      ),
    (error: unknown) =>
      error instanceof AdminCatalogError && error.code === "RESERVED_STOCK",
  );
});
