import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import {
  getAdminCatalog,
  getAdminCatalogProduct,
} from "../src/lib/admin/catalog-admin-service";
import { DrizzleAdminCatalogRepository } from "../src/lib/db/admin-catalog-repository";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { catalogChangeHistory, stores } from "../src/lib/db/schema";

async function main() {
  loadEnvConfig(process.cwd());
  const storeSlug = process.env.ADMIN_BOOTSTRAP_STORE_SLUG ?? "m3food";
  const database = getDatabase();
  const [store] = await database
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, storeSlug))
    .limit(1);
  if (!store) throw new Error("The live catalog store is unavailable.");

  const identity = {
    id: "00000000-0000-4000-8000-000000000001",
    storeId: store.id,
    storeSlug,
    email: "verification@example.invalid",
    displayName: "Verification",
    role: "OWNER" as const,
  };
  const repository = new DrizzleAdminCatalogRepository(database);
  const result = await getAdminCatalog(identity, repository);

  const variantCount = result.products.reduce(
    (total, product) => total + product.variants.length,
    0,
  );
  if (variantCount !== result.summary.variantCount) {
    throw new Error("Catalog variant summary does not reconcile.");
  }
  if (result.store.slug !== storeSlug || !result.canManage) {
    throw new Error("Catalog store scope or OWNER capability is invalid.");
  }
  for (const product of result.products) {
    if (!Number.isInteger(product.revision) || product.revision < 0) {
      throw new Error("Product revision column is invalid.");
    }
    for (const variant of product.variants) {
      if (!Number.isInteger(variant.revision) || variant.revision < 0) {
        throw new Error("Variant revision column is invalid.");
      }
      if (!Number.isInteger(variant.inventoryRevision) || variant.inventoryRevision < 0) {
        throw new Error("Inventory revision column is invalid.");
      }
      if (variant.trackStock && variant.available < variant.reserved) {
        throw new Error("Tracked inventory has negative sellable stock.");
      }
    }
  }

  if (result.products[0]) {
    const detail = await getAdminCatalogProduct(
      identity,
      result.products[0].id,
      repository,
    );
    if (detail.id !== result.products[0].id || !Array.isArray(detail.history)) {
      throw new Error("Catalog product detail or audit history read model is invalid.");
    }
  }

  await database
    .select({ id: catalogChangeHistory.id })
    .from(catalogChangeHistory)
    .where(eq(catalogChangeHistory.storeId, store.id))
    .limit(1);

  console.log("LIVE ADMIN CATALOG VERIFIED");
  console.log(`Store: ${result.store.slug}`);
  console.log(`Products: ${result.summary.productCount}`);
  console.log(`Variants: ${result.summary.variantCount}`);
  console.log(`Low stock: ${result.summary.lowStockVariantCount}`);
  console.log(`Out of stock: ${result.summary.outOfStockVariantCount}`);
  console.log("Revision-protected catalog schema: verified");
  console.log("Catalog audit history table: verified");
  console.log("Store-scoped catalog read model: verified");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Catalog verification failed.");
    process.exitCode = 1;
  })
  .finally(closeDatabase);
