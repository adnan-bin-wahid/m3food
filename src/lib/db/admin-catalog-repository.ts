import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import type {
  AdminCatalogProduct,
  AdminCatalogProductDetail,
  AdminCatalogRepository,
  CatalogMutationResult,
  CreateProductInput,
  CreateVariantInput,
  SetDefaultVariantInput,
  UpdateInventoryInput,
  UpdateProductInput,
  UpdateVariantInput,
} from "../admin/catalog-admin-repository";
import { getDatabase, type Database } from "./index";
import {
  catalogChangeHistory,
  inventory,
  products,
  productVariants,
  stores,
} from "./schema";

function uniqueViolation(error: unknown, constraint: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; constraint_name?: unknown; constraint?: unknown };
  return (
    candidate.code === "23505" &&
    (candidate.constraint_name === constraint || candidate.constraint === constraint)
  );
}

function productSnapshot(row: {
  id: string;
  revision: number;
  name: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}) {
  return {
    id: row.id,
    revision: row.revision,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
  };
}

function variantSnapshot(row: {
  id: string;
  revision: number;
  sku: string;
  label: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  unitCostMinor: number | null;
  isDefault: boolean;
  isActive: boolean;
}) {
  return {
    id: row.id,
    revision: row.revision,
    sku: row.sku,
    label: row.label,
    priceMinor: row.priceMinor,
    compareAtPriceMinor: row.compareAtPriceMinor,
    unitCostMinor: row.unitCostMinor,
    isDefault: row.isDefault,
    isActive: row.isActive,
  };
}

function inventorySnapshot(row: {
  revision: number;
  trackStock: boolean;
  available: number;
  reserved: number;
}) {
  return {
    revision: row.revision,
    trackStock: row.trackStock,
    available: row.available,
    reserved: row.reserved,
  };
}

export class DrizzleAdminCatalogRepository implements AdminCatalogRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async getCatalog(storeId: string) {
    const [storeRows, productRows, variantRows] = await Promise.all([
      this.database
        .select({
          name: stores.name,
          slug: stores.slug,
          currency: stores.currency,
          timezone: stores.timezone,
        })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1),
      this.database
        .select({
          id: products.id,
          revision: products.revision,
          name: products.name,
          slug: products.slug,
          description: products.description,
          status: products.status,
        })
        .from(products)
        .where(eq(products.storeId, storeId))
        .orderBy(asc(products.createdAt), asc(products.id)),
      this.database
        .select({
          id: productVariants.id,
          revision: productVariants.revision,
          productId: productVariants.productId,
          sku: productVariants.sku,
          label: productVariants.label,
          priceMinor: productVariants.priceMinor,
          compareAtPriceMinor: productVariants.compareAtPriceMinor,
          unitCostMinor: productVariants.unitCostMinor,
          isDefault: productVariants.isDefault,
          isActive: productVariants.isActive,
          trackStock: inventory.trackStock,
          available: inventory.available,
          reserved: inventory.reserved,
          inventoryRevision: inventory.revision,
        })
        .from(productVariants)
        .innerJoin(
          products,
          and(
            eq(products.id, productVariants.productId),
            eq(products.storeId, storeId),
          ),
        )
        .leftJoin(
          inventory,
          and(
            eq(inventory.variantId, productVariants.id),
            eq(inventory.storeId, storeId),
          ),
        )
        .where(eq(productVariants.storeId, storeId))
        .orderBy(
          desc(productVariants.isDefault),
          asc(productVariants.createdAt),
          asc(productVariants.id),
        ),
    ]);

    const store = storeRows[0];
    if (!store) return null;

    const variantsByProduct = new Map<
      string,
      AdminCatalogProduct["variants"]
    >();
    for (const row of variantRows) {
      const variants = variantsByProduct.get(row.productId) ?? [];
      variants.push({
        id: row.id,
        revision: row.revision,
        sku: row.sku,
        label: row.label,
        priceMinor: row.priceMinor,
        compareAtPriceMinor: row.compareAtPriceMinor,
        unitCostMinor: row.unitCostMinor,
        isDefault: row.isDefault,
        isActive: row.isActive,
        trackStock: row.trackStock ?? false,
        available: row.available ?? 0,
        reserved: row.reserved ?? 0,
        inventoryRevision: row.inventoryRevision ?? 0,
      });
      variantsByProduct.set(row.productId, variants);
    }

    return {
      store,
      products: productRows.map((product) => ({
        ...product,
        variants: variantsByProduct.get(product.id) ?? [],
      })),
    };
  }

  async getProduct(
    storeId: string,
    productId: string,
  ): Promise<AdminCatalogProductDetail | null> {
    const [storeRows, productRows, variantRows, history] = await Promise.all([
      this.database
        .select({
          name: stores.name,
          slug: stores.slug,
          currency: stores.currency,
          timezone: stores.timezone,
        })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1),
      this.database
        .select({
          id: products.id,
          revision: products.revision,
          name: products.name,
          slug: products.slug,
          description: products.description,
          status: products.status,
        })
        .from(products)
        .where(and(eq(products.storeId, storeId), eq(products.id, productId)))
        .limit(1),
      this.database
        .select({
          id: productVariants.id,
          revision: productVariants.revision,
          sku: productVariants.sku,
          label: productVariants.label,
          priceMinor: productVariants.priceMinor,
          compareAtPriceMinor: productVariants.compareAtPriceMinor,
          unitCostMinor: productVariants.unitCostMinor,
          isDefault: productVariants.isDefault,
          isActive: productVariants.isActive,
          trackStock: inventory.trackStock,
          available: inventory.available,
          reserved: inventory.reserved,
          inventoryRevision: inventory.revision,
        })
        .from(productVariants)
        .leftJoin(
          inventory,
          and(
            eq(inventory.storeId, storeId),
            eq(inventory.variantId, productVariants.id),
          ),
        )
        .where(
          and(
            eq(productVariants.storeId, storeId),
            eq(productVariants.productId, productId),
          ),
        )
        .orderBy(
          desc(productVariants.isDefault),
          asc(productVariants.createdAt),
          asc(productVariants.id),
        ),
      this.database
        .select({
          id: catalogChangeHistory.id,
          action: catalogChangeHistory.action,
          changedByAdminEmail: catalogChangeHistory.changedByAdminEmail,
          beforeState: catalogChangeHistory.beforeState,
          afterState: catalogChangeHistory.afterState,
          createdAt: catalogChangeHistory.createdAt,
        })
        .from(catalogChangeHistory)
        .where(
          and(
            eq(catalogChangeHistory.storeId, storeId),
            eq(catalogChangeHistory.productId, productId),
          ),
        )
        .orderBy(desc(catalogChangeHistory.createdAt))
        .limit(30),
    ]);

    const store = storeRows[0];
    const product = productRows[0];
    if (!store || !product) return null;

    return {
      ...product,
      store,
      variants: variantRows.map((row) => ({
        id: row.id,
        revision: row.revision,
        sku: row.sku,
        label: row.label,
        priceMinor: row.priceMinor,
        compareAtPriceMinor: row.compareAtPriceMinor,
        unitCostMinor: row.unitCostMinor,
        isDefault: row.isDefault,
        isActive: row.isActive,
        trackStock: row.trackStock ?? false,
        available: row.available ?? 0,
        reserved: row.reserved ?? 0,
        inventoryRevision: row.inventoryRevision ?? 0,
      })),
      history,
    };
  }

  async createProduct(
    input: CreateProductInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>> {
    try {
      return await this.database.transaction(async (transaction) => {
        const [created] = await transaction
          .insert(products)
          .values({
            storeId: input.storeId,
            name: input.name,
            slug: input.slug,
            description: input.description,
            status: "DRAFT",
            revision: 0,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning({
            id: products.id,
            revision: products.revision,
            name: products.name,
            slug: products.slug,
            description: products.description,
            status: products.status,
          });
        if (!created) return { kind: "NOT_FOUND" } as const;

        await transaction.insert(catalogChangeHistory).values({
          storeId: input.storeId,
          productId: created.id,
          action: "PRODUCT_CREATED",
          changedByAdminUserId: input.actor.id,
          changedByAdminEmail: input.actor.email,
          beforeState: null,
          afterState: productSnapshot(created),
          createdAt: input.now,
        });
        return {
          kind: "OK",
          value: { id: created.id, revision: created.revision },
        } as const;
      });
    } catch (error) {
      if (uniqueViolation(error, "products_store_slug_uniq")) {
        return { kind: "DUPLICATE_SLUG" };
      }
      throw error;
    }
  }

  async updateProduct(
    input: UpdateProductInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>> {
    try {
      return await this.database.transaction(async (transaction) => {
        const [current] = await transaction
          .select({
            id: products.id,
            revision: products.revision,
            name: products.name,
            slug: products.slug,
            description: products.description,
            status: products.status,
          })
          .from(products)
          .where(
            and(eq(products.storeId, input.storeId), eq(products.id, input.productId)),
          )
          .limit(1)
          .for("update");
        if (!current) return { kind: "NOT_FOUND" } as const;
        if (current.revision !== input.expectedRevision) {
          return { kind: "CONFLICT" } as const;
        }

        if (input.status === "ACTIVE") {
          const active = await transaction
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.storeId, input.storeId),
                eq(productVariants.productId, input.productId),
                eq(productVariants.isActive, true),
                eq(productVariants.isDefault, true),
              ),
            )
            .limit(1);
          if (!active.length) return { kind: "NO_ACTIVE_VARIANT" } as const;
        }

        const [updated] = await transaction
          .update(products)
          .set({
            name: input.name,
            slug: input.slug,
            description: input.description,
            status: input.status,
            revision: sql`${products.revision} + 1`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(products.storeId, input.storeId),
              eq(products.id, input.productId),
              eq(products.revision, input.expectedRevision),
            ),
          )
          .returning({
            id: products.id,
            revision: products.revision,
            name: products.name,
            slug: products.slug,
            description: products.description,
            status: products.status,
          });
        if (!updated) return { kind: "CONFLICT" } as const;

        await transaction.insert(catalogChangeHistory).values({
          storeId: input.storeId,
          productId: current.id,
          action: "PRODUCT_UPDATED",
          changedByAdminUserId: input.actor.id,
          changedByAdminEmail: input.actor.email,
          beforeState: productSnapshot(current),
          afterState: productSnapshot(updated),
          createdAt: input.now,
        });
        return {
          kind: "OK",
          value: { id: updated.id, revision: updated.revision },
        } as const;
      });
    } catch (error) {
      if (uniqueViolation(error, "products_store_slug_uniq")) {
        return { kind: "DUPLICATE_SLUG" };
      }
      throw error;
    }
  }

  async createVariant(
    input: CreateVariantInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>> {
    try {
      return await this.database.transaction(async (transaction) => {
        const productRows = await transaction
          .select({ id: products.id })
          .from(products)
          .where(
            and(eq(products.storeId, input.storeId), eq(products.id, input.productId)),
          )
          .limit(1)
          .for("update");
        if (!productRows.length) return { kind: "NOT_FOUND" } as const;

        const existing = await transaction
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.storeId, input.storeId),
              eq(productVariants.productId, input.productId),
            ),
          )
          .limit(1);
        const isDefault = existing.length === 0;

        const [created] = await transaction
          .insert(productVariants)
          .values({
            storeId: input.storeId,
            productId: input.productId,
            sku: input.sku,
            label: input.label,
            priceMinor: input.priceMinor,
            compareAtPriceMinor: input.compareAtPriceMinor,
            unitCostMinor: input.unitCostMinor,
            isDefault,
            isActive: input.isActive,
            revision: 0,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning({
            id: productVariants.id,
            revision: productVariants.revision,
            sku: productVariants.sku,
            label: productVariants.label,
            priceMinor: productVariants.priceMinor,
            compareAtPriceMinor: productVariants.compareAtPriceMinor,
            unitCostMinor: productVariants.unitCostMinor,
            isDefault: productVariants.isDefault,
            isActive: productVariants.isActive,
          });
        if (!created) return { kind: "NOT_FOUND" } as const;

        const [createdInventory] = await transaction
          .insert(inventory)
          .values({
            storeId: input.storeId,
            variantId: created.id,
            trackStock: input.trackStock,
            available: input.available,
            reserved: 0,
            revision: 0,
            updatedAt: input.now,
          })
          .returning({
            revision: inventory.revision,
            trackStock: inventory.trackStock,
            available: inventory.available,
            reserved: inventory.reserved,
          });

        await transaction.insert(catalogChangeHistory).values({
          storeId: input.storeId,
          productId: input.productId,
          variantId: created.id,
          action: "VARIANT_CREATED",
          changedByAdminUserId: input.actor.id,
          changedByAdminEmail: input.actor.email,
          beforeState: null,
          afterState: {
            ...variantSnapshot(created),
            inventory: createdInventory ? inventorySnapshot(createdInventory) : null,
          },
          createdAt: input.now,
        });
        return {
          kind: "OK",
          value: { id: created.id, revision: created.revision },
        } as const;
      });
    } catch (error) {
      if (uniqueViolation(error, "product_variants_store_sku_uniq")) {
        return { kind: "DUPLICATE_SKU" };
      }
      throw error;
    }
  }

  async updateVariant(
    input: UpdateVariantInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>> {
    try {
      return await this.database.transaction(async (transaction) => {
        const [current] = await transaction
          .select({
            id: productVariants.id,
            revision: productVariants.revision,
            sku: productVariants.sku,
            label: productVariants.label,
            priceMinor: productVariants.priceMinor,
            compareAtPriceMinor: productVariants.compareAtPriceMinor,
            unitCostMinor: productVariants.unitCostMinor,
            isDefault: productVariants.isDefault,
            isActive: productVariants.isActive,
            productStatus: products.status,
          })
          .from(productVariants)
          .innerJoin(
            products,
            and(
              eq(products.id, productVariants.productId),
              eq(products.storeId, input.storeId),
            ),
          )
          .where(
            and(
              eq(productVariants.storeId, input.storeId),
              eq(productVariants.productId, input.productId),
              eq(productVariants.id, input.variantId),
            ),
          )
          .limit(1)
          .for("update");
        if (!current) return { kind: "NOT_FOUND" } as const;
        if (current.revision !== input.expectedRevision) {
          return { kind: "CONFLICT" } as const;
        }
        if (current.isDefault && current.isActive && !input.isActive) {
          return { kind: "DEFAULT_REQUIRED" } as const;
        }
        if (current.productStatus === "ACTIVE" && current.isActive && !input.isActive) {
          const otherActive = await transaction
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.storeId, input.storeId),
                eq(productVariants.productId, input.productId),
                eq(productVariants.isActive, true),
                ne(productVariants.id, input.variantId),
              ),
            )
            .limit(1);
          if (!otherActive.length) return { kind: "NO_ACTIVE_VARIANT" } as const;
        }

        const [updated] = await transaction
          .update(productVariants)
          .set({
            sku: input.sku,
            label: input.label,
            priceMinor: input.priceMinor,
            compareAtPriceMinor: input.compareAtPriceMinor,
            unitCostMinor: input.unitCostMinor,
            isActive: input.isActive,
            revision: sql`${productVariants.revision} + 1`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(productVariants.storeId, input.storeId),
              eq(productVariants.productId, input.productId),
              eq(productVariants.id, input.variantId),
              eq(productVariants.revision, input.expectedRevision),
            ),
          )
          .returning({
            id: productVariants.id,
            revision: productVariants.revision,
            sku: productVariants.sku,
            label: productVariants.label,
            priceMinor: productVariants.priceMinor,
            compareAtPriceMinor: productVariants.compareAtPriceMinor,
            unitCostMinor: productVariants.unitCostMinor,
            isDefault: productVariants.isDefault,
            isActive: productVariants.isActive,
          });
        if (!updated) return { kind: "CONFLICT" } as const;

        await transaction.insert(catalogChangeHistory).values({
          storeId: input.storeId,
          productId: input.productId,
          variantId: input.variantId,
          action: "VARIANT_UPDATED",
          changedByAdminUserId: input.actor.id,
          changedByAdminEmail: input.actor.email,
          beforeState: variantSnapshot(current),
          afterState: variantSnapshot(updated),
          createdAt: input.now,
        });
        return {
          kind: "OK",
          value: { id: updated.id, revision: updated.revision },
        } as const;
      });
    } catch (error) {
      if (uniqueViolation(error, "product_variants_store_sku_uniq")) {
        return { kind: "DUPLICATE_SKU" };
      }
      throw error;
    }
  }

  async setDefaultVariant(
    input: SetDefaultVariantInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>> {
    return this.database.transaction(async (transaction) => {
      const [target] = await transaction
        .select({
          id: productVariants.id,
          revision: productVariants.revision,
          sku: productVariants.sku,
          label: productVariants.label,
          priceMinor: productVariants.priceMinor,
          compareAtPriceMinor: productVariants.compareAtPriceMinor,
          unitCostMinor: productVariants.unitCostMinor,
          isDefault: productVariants.isDefault,
          isActive: productVariants.isActive,
        })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.storeId, input.storeId),
            eq(productVariants.productId, input.productId),
            eq(productVariants.id, input.variantId),
          ),
        )
        .limit(1)
        .for("update");
      if (!target) return { kind: "NOT_FOUND" } as const;
      if (target.revision !== input.expectedRevision) {
        return { kind: "CONFLICT" } as const;
      }
      if (!target.isActive) return { kind: "DEFAULT_REQUIRED" } as const;
      if (target.isDefault) {
        return {
          kind: "OK",
          value: { id: target.id, revision: target.revision },
        } as const;
      }

      await transaction
        .update(productVariants)
        .set({
          isDefault: false,
          revision: sql`${productVariants.revision} + 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(productVariants.storeId, input.storeId),
            eq(productVariants.productId, input.productId),
            eq(productVariants.isDefault, true),
          ),
        );

      const [updated] = await transaction
        .update(productVariants)
        .set({
          isDefault: true,
          revision: sql`${productVariants.revision} + 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(productVariants.storeId, input.storeId),
            eq(productVariants.productId, input.productId),
            eq(productVariants.id, input.variantId),
            eq(productVariants.revision, input.expectedRevision),
          ),
        )
        .returning({
          id: productVariants.id,
          revision: productVariants.revision,
          sku: productVariants.sku,
          label: productVariants.label,
          priceMinor: productVariants.priceMinor,
          compareAtPriceMinor: productVariants.compareAtPriceMinor,
          unitCostMinor: productVariants.unitCostMinor,
          isDefault: productVariants.isDefault,
          isActive: productVariants.isActive,
        });
      if (!updated) return { kind: "CONFLICT" } as const;

      await transaction.insert(catalogChangeHistory).values({
        storeId: input.storeId,
        productId: input.productId,
        variantId: input.variantId,
        action: "DEFAULT_VARIANT_CHANGED",
        changedByAdminUserId: input.actor.id,
        changedByAdminEmail: input.actor.email,
        beforeState: variantSnapshot(target),
        afterState: variantSnapshot(updated),
        createdAt: input.now,
      });
      return {
        kind: "OK",
        value: { id: updated.id, revision: updated.revision },
      } as const;
    });
  }

  async updateInventory(
    input: UpdateInventoryInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>> {
    return this.database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({
          id: inventory.id,
          revision: inventory.revision,
          trackStock: inventory.trackStock,
          available: inventory.available,
          reserved: inventory.reserved,
        })
        .from(inventory)
        .innerJoin(
          productVariants,
          and(
            eq(productVariants.id, inventory.variantId),
            eq(productVariants.storeId, input.storeId),
            eq(productVariants.productId, input.productId),
          ),
        )
        .where(
          and(
            eq(inventory.storeId, input.storeId),
            eq(inventory.variantId, input.variantId),
          ),
        )
        .limit(1)
        .for("update");
      if (!current) return { kind: "NOT_FOUND" } as const;
      if (current.revision !== input.expectedRevision) {
        return { kind: "CONFLICT" } as const;
      }
      if (!input.trackStock && current.reserved > 0) {
        return { kind: "RESERVED_STOCK" } as const;
      }
      if (input.trackStock && input.available < current.reserved) {
        return { kind: "INVALID_STOCK" } as const;
      }

      const [updated] = await transaction
        .update(inventory)
        .set({
          trackStock: input.trackStock,
          available: input.trackStock ? input.available : 0,
          revision: sql`${inventory.revision} + 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(inventory.id, current.id),
            eq(inventory.storeId, input.storeId),
            eq(inventory.revision, input.expectedRevision),
          ),
        )
        .returning({
          id: inventory.id,
          revision: inventory.revision,
          trackStock: inventory.trackStock,
          available: inventory.available,
          reserved: inventory.reserved,
        });
      if (!updated) return { kind: "CONFLICT" } as const;

      await transaction.insert(catalogChangeHistory).values({
        storeId: input.storeId,
        productId: input.productId,
        variantId: input.variantId,
        action: "INVENTORY_UPDATED",
        changedByAdminUserId: input.actor.id,
        changedByAdminEmail: input.actor.email,
        beforeState: inventorySnapshot(current),
        afterState: inventorySnapshot(updated),
        createdAt: input.now,
      });
      return {
        kind: "OK",
        value: { id: updated.id, revision: updated.revision },
      } as const;
    });
  }
}
