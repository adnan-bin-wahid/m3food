import { and, eq, sql } from "drizzle-orm";
import type { Database } from "./index";
import {
  inventory,
  products,
  productVariants,
  stores,
} from "./schema";
import type { StoreConfig } from "./store-config";

const protectedTableNames = [
  "stores",
  "products",
  "product_variants",
  "inventory",
  "customers",
  "visitors",
  "visitor_sessions",
  "orders",
  "order_items",
  "order_status_history",
  "payments",
  "commerce_events",
  "order_attributions",
  "request_rate_limits",
] as const;

export interface StoreVerificationSummary {
  storeId: string;
  storeSlug: string;
  productCount: number;
  variantCount: number;
  rlsTableCount: number;
}

function expectEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `Store verification failed for ${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`,
    );
  }
}

export async function verifyStore(
  database: Database,
  config: StoreConfig,
): Promise<StoreVerificationSummary> {
  const [store] = await database
    .select()
    .from(stores)
    .where(eq(stores.slug, config.store.slug))
    .limit(1);

  if (!store) {
    throw new Error(`Store verification failed: ${config.store.slug} is missing.`);
  }

  expectEqual(store.name, config.store.name, "store.name");
  expectEqual(store.primaryDomain, config.store.primaryDomain, "store.primaryDomain");
  expectEqual(store.currency, config.store.currency, "store.currency");
  expectEqual(store.timezone, config.store.timezone, "store.timezone");
  expectEqual(store.status, config.store.status, "store.status");

  let variantCount = 0;

  for (const productConfig of config.products) {
    const [product] = await database
      .select()
      .from(products)
      .where(
        and(
          eq(products.storeId, store.id),
          eq(products.slug, productConfig.slug),
        ),
      )
      .limit(1);

    if (!product) {
      throw new Error(
        `Store verification failed: product ${productConfig.slug} is missing.`,
      );
    }

    expectEqual(product.name, productConfig.name, `${productConfig.slug}.name`);
    expectEqual(
      product.description,
      productConfig.description,
      `${productConfig.slug}.description`,
    );
    expectEqual(product.status, productConfig.status, `${productConfig.slug}.status`);

    for (const variantConfig of productConfig.variants) {
      const [variant] = await database
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.storeId, store.id),
            eq(productVariants.productId, product.id),
            eq(productVariants.sku, variantConfig.sku),
          ),
        )
        .limit(1);

      if (!variant) {
        throw new Error(
          `Store verification failed: variant ${variantConfig.sku} is missing.`,
        );
      }

      expectEqual(variant.label, variantConfig.label, `${variantConfig.sku}.label`);
      expectEqual(
        variant.priceMinor,
        variantConfig.priceMinor,
        `${variantConfig.sku}.priceMinor`,
      );
      expectEqual(
        variant.compareAtPriceMinor,
        variantConfig.compareAtPriceMinor,
        `${variantConfig.sku}.compareAtPriceMinor`,
      );
      expectEqual(
        variant.isDefault,
        variantConfig.isDefault,
        `${variantConfig.sku}.isDefault`,
      );
      expectEqual(
        variant.isActive,
        variantConfig.isActive,
        `${variantConfig.sku}.isActive`,
      );

      const [stock] = await database
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.storeId, store.id),
            eq(inventory.variantId, variant.id),
          ),
        )
        .limit(1);

      if (!stock) {
        throw new Error(
          `Store verification failed: inventory for ${variantConfig.sku} is missing.`,
        );
      }

      expectEqual(
        stock.trackStock,
        variantConfig.trackStock,
        `${variantConfig.sku}.trackStock`,
      );
      expectEqual(
        stock.available,
        variantConfig.available,
        `${variantConfig.sku}.available`,
      );
      variantCount += 1;
    }
  }

  const rlsRows = await database.execute(
    sql<{ tableName: string; rlsEnabled: boolean }>`
      select
        c.relname as "tableName",
        c.relrowsecurity as "rlsEnabled"
      from pg_catalog.pg_class c
      inner join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    `,
  );
  const rlsByTable = new Map(
    rlsRows.map((row) => [row.tableName, row.rlsEnabled]),
  );
  const unprotectedTables = protectedTableNames.filter(
    (tableName) => rlsByTable.get(tableName) !== true,
  );

  if (unprotectedTables.length > 0) {
    throw new Error(
      `RLS verification failed for: ${unprotectedTables.join(", ")}.`,
    );
  }

  return {
    storeId: store.id,
    storeSlug: store.slug,
    productCount: config.products.length,
    variantCount,
    rlsTableCount: protectedTableNames.length,
  };
}
