import { and, asc, desc, eq, sql } from "drizzle-orm";
import type {
  CatalogProduct,
  CatalogRepository,
  StoreCatalog,
} from "../commerce/catalog-repository";
import { getDatabase, type Database } from "./index";
import {
  inventory,
  products,
  productVariants,
  stores,
} from "./schema";

export class DrizzleCatalogRepository implements CatalogRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async findActiveCatalog(storeSlug: string): Promise<StoreCatalog | null> {
    const rows = await this.database
      .select({
        storeName: stores.name,
        storeSlug: stores.slug,
        currency: stores.currency,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productDescription: products.description,
        variantId: productVariants.id,
        sku: productVariants.sku,
        label: productVariants.label,
        priceMinor: productVariants.priceMinor,
        compareAtPriceMinor: productVariants.compareAtPriceMinor,
        isDefault: productVariants.isDefault,
        inStock: sql<boolean>`case
          when coalesce(${inventory.trackStock}, false) = false then true
          else coalesce(${inventory.available}, 0) - coalesce(${inventory.reserved}, 0) > 0
        end`,
      })
      .from(stores)
      .innerJoin(
        products,
        and(eq(products.storeId, stores.id), eq(products.status, "ACTIVE")),
      )
      .innerJoin(
        productVariants,
        and(
          eq(productVariants.storeId, stores.id),
          eq(productVariants.productId, products.id),
          eq(productVariants.isActive, true),
        ),
      )
      .leftJoin(
        inventory,
        and(
          eq(inventory.storeId, stores.id),
          eq(inventory.variantId, productVariants.id),
        ),
      )
      .where(and(eq(stores.slug, storeSlug), eq(stores.status, "ACTIVE")))
      .orderBy(
        asc(products.createdAt),
        desc(productVariants.isDefault),
        asc(productVariants.createdAt),
      );

    const first = rows[0];
    if (!first) return null;

    const productsById = new Map<string, CatalogProduct>();
    for (const row of rows) {
      let product = productsById.get(row.productId);
      if (!product) {
        product = {
          id: row.productId,
          name: row.productName,
          slug: row.productSlug,
          description: row.productDescription,
          variants: [],
        };
        productsById.set(row.productId, product);
      }

      product.variants.push({
        id: row.variantId,
        sku: row.sku,
        label: row.label,
        priceMinor: row.priceMinor,
        compareAtPriceMinor: row.compareAtPriceMinor,
        isDefault: row.isDefault,
        inStock: row.inStock,
      });
    }

    return {
      store: {
        name: first.storeName,
        slug: first.storeSlug,
        currency: first.currency,
      },
      products: [...productsById.values()],
    };
  }
}
