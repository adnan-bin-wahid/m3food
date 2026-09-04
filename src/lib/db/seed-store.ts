import type { Database } from "./index";
import {
  inventory,
  products,
  productVariants,
  stores,
} from "./schema";
import type { StoreConfig } from "./store-config";

export interface StoreSeedSummary {
  storeId: string;
  storeSlug: string;
  productCount: number;
  variantCount: number;
}

export function seedStore(
  database: Database,
  config: StoreConfig,
): Promise<StoreSeedSummary> {
  return database.transaction(async (transaction) => {
    const now = new Date();
    const [store] = await transaction
      .insert(stores)
      .values({ ...config.store, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: stores.slug,
        set: {
          name: config.store.name,
          primaryDomain: config.store.primaryDomain,
          currency: config.store.currency,
          timezone: config.store.timezone,
          status: config.store.status,
          updatedAt: now,
        },
      })
      .returning({ id: stores.id });

    if (!store) throw new Error("Store upsert returned no row.");

    let variantCount = 0;

    for (const productConfig of config.products) {
      const { variants: variantConfigs, ...productValues } = productConfig;
      const [product] = await transaction
        .insert(products)
        .values({
          ...productValues,
          storeId: store.id,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [products.storeId, products.slug],
          set: {
            name: productConfig.name,
            description: productConfig.description,
            status: productConfig.status,
            updatedAt: now,
          },
        })
        .returning({ id: products.id });

      if (!product) throw new Error("Product upsert returned no row.");

      for (const variantConfig of variantConfigs) {
        const { trackStock, available, ...variantValues } = variantConfig;
        const [variant] = await transaction
          .insert(productVariants)
          .values({
            ...variantValues,
            storeId: store.id,
            productId: product.id,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [productVariants.storeId, productVariants.sku],
            set: {
              productId: product.id,
              label: variantConfig.label,
              priceMinor: variantConfig.priceMinor,
              compareAtPriceMinor: variantConfig.compareAtPriceMinor,
              isDefault: variantConfig.isDefault,
              isActive: variantConfig.isActive,
              updatedAt: now,
            },
          })
          .returning({ id: productVariants.id });

        if (!variant) throw new Error("Variant upsert returned no row.");

        await transaction
          .insert(inventory)
          .values({
            storeId: store.id,
            variantId: variant.id,
            trackStock,
            available,
            reserved: 0,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [inventory.storeId, inventory.variantId],
            set: { trackStock, available, updatedAt: now },
          });

        variantCount += 1;
      }
    }

    return {
      storeId: store.id,
      storeSlug: config.store.slug,
      productCount: config.products.length,
      variantCount,
    };
  });
}
