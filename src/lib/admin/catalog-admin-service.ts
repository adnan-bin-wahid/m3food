import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminCatalogRepository,
  AdminCatalogSnapshot,
  CatalogMutationResult,
} from "./catalog-admin-repository";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase kebab-case slug.");

const optionalDescription = z
  .string()
  .trim()
  .max(5000)
  .transform((value) => value || null);

const optionalLabel = z
  .string()
  .trim()
  .max(160)
  .transform((value) => value || null);

export const adminProductCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    slug: slugSchema,
    description: optionalDescription,
  })
  .strict();

export const adminProductUpdateSchema = adminProductCreateSchema.extend({
  productId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

const variantBase = z.object({
  sku: z.string().trim().min(1).max(100),
  label: optionalLabel,
  priceMinor: z.number().int().nonnegative(),
  compareAtPriceMinor: z.number().int().nonnegative().nullable(),
  unitCostMinor: z.number().int().nonnegative().nullable().default(null),
  isActive: z.boolean(),
});

function refineVariantPrice(
  value: { priceMinor: number; compareAtPriceMinor: number | null },
  context: z.RefinementCtx,
) {
  if (
    value.compareAtPriceMinor !== null &&
    value.compareAtPriceMinor < value.priceMinor
  ) {
    context.addIssue({
      code: "custom",
      path: ["compareAtPriceMinor"],
      message: "Compare-at price cannot be lower than the selling price.",
    });
  }
}

export const adminVariantCreateSchema = variantBase.extend({
  productId: z.string().uuid(),
  trackStock: z.boolean(),
  available: z.number().int().nonnegative(),
}).superRefine((value, context) => {
  refineVariantPrice(value, context);
  if (!value.trackStock && value.available !== 0) {
    context.addIssue({
      code: "custom",
      path: ["available"],
      message: "Untracked inventory must use zero available stock.",
    });
  }
});

export const adminVariantUpdateSchema = variantBase.extend({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
}).superRefine(refineVariantPrice);

export const adminDefaultVariantSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
}).strict();

export const adminInventoryUpdateSchema = z
  .object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    expectedRevision: z.number().int().nonnegative(),
    trackStock: z.boolean(),
    available: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.trackStock && value.available !== 0) {
      context.addIssue({
        code: "custom",
        path: ["available"],
        message: "Untracked inventory must use zero available stock.",
      });
    }
  });


export function parseAdminMoneyToMinor(value: unknown): number {
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number.parseInt(whole, 10) * 100 + Number.parseInt((fraction + "00").slice(0, 2), 10);
  return Number.isSafeInteger(minor) && minor <= 2_147_483_647 ? minor : Number.NaN;
}

export function parseOptionalAdminMoneyToMinor(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return parseAdminMoneyToMinor(value);
}

export class AdminCatalogError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "DUPLICATE_SLUG"
      | "DUPLICATE_SKU"
      | "NO_ACTIVE_VARIANT"
      | "DEFAULT_REQUIRED"
      | "RESERVED_STOCK"
      | "INVALID_STOCK",
    message: string,
  ) {
    super(message);
    this.name = "AdminCatalogError";
  }
}

export function canManageCatalog(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}

export interface AdminCatalogSummary {
  productCount: number;
  activeProductCount: number;
  variantCount: number;
  activeVariantCount: number;
  lowStockVariantCount: number;
  outOfStockVariantCount: number;
}

export function summarizeAdminCatalog(
  catalog: AdminCatalogSnapshot,
): AdminCatalogSummary {
  const variants = catalog.products.flatMap((product) => product.variants);
  const trackedActiveVariants = variants.filter(
    (variant) => variant.isActive && variant.trackStock,
  );

  return {
    productCount: catalog.products.length,
    activeProductCount: catalog.products.filter(
      (product) => product.status === "ACTIVE",
    ).length,
    variantCount: variants.length,
    activeVariantCount: variants.filter((variant) => variant.isActive).length,
    lowStockVariantCount: trackedActiveVariants.filter((variant) => {
      const sellable = variant.available - variant.reserved;
      return sellable > 0 && sellable <= 5;
    }).length,
    outOfStockVariantCount: trackedActiveVariants.filter(
      (variant) => variant.available - variant.reserved <= 0,
    ).length,
  };
}

export async function getAdminCatalog(
  admin: AdminIdentity,
  repository: AdminCatalogRepository,
) {
  const catalog = await repository.getCatalog(admin.storeId);
  if (!catalog) {
    throw new AdminCatalogError("NOT_FOUND", "Store catalog is unavailable.");
  }

  return {
    ...catalog,
    summary: summarizeAdminCatalog(catalog),
    canManage: canManageCatalog(admin.role),
  };
}

export async function getAdminCatalogProduct(
  admin: AdminIdentity,
  productId: string,
  repository: AdminCatalogRepository,
) {
  const product = await repository.getProduct(admin.storeId, productId);
  if (!product) {
    throw new AdminCatalogError("NOT_FOUND", "Catalog product was not found.");
  }
  return { ...product, canManage: canManageCatalog(admin.role) };
}

function requireCatalogWrite(admin: AdminIdentity) {
  if (!canManageCatalog(admin.role)) {
    throw new AdminCatalogError("FORBIDDEN", "Your role has read-only catalog access.");
  }
}

function mapMutationFailure(result: CatalogMutationResult<unknown>): never {
  switch (result.kind) {
    case "NOT_FOUND":
      throw new AdminCatalogError("NOT_FOUND", "Catalog record was not found.");
    case "CONFLICT":
      throw new AdminCatalogError(
        "CONFLICT",
        "This record changed in another session. Reload before saving.",
      );
    case "DUPLICATE_SLUG":
      throw new AdminCatalogError(
        "DUPLICATE_SLUG",
        "Another product already uses this slug.",
      );
    case "DUPLICATE_SKU":
      throw new AdminCatalogError(
        "DUPLICATE_SKU",
        "Another variant already uses this SKU.",
      );
    case "NO_ACTIVE_VARIANT":
      throw new AdminCatalogError(
        "NO_ACTIVE_VARIANT",
        "Active products must have an active default variant.",
      );
    case "DEFAULT_REQUIRED":
      throw new AdminCatalogError(
        "DEFAULT_REQUIRED",
        "The default variant must stay active. Make another active variant the default first.",
      );
    case "RESERVED_STOCK":
      throw new AdminCatalogError(
        "RESERVED_STOCK",
        "This variant has reserved units from open orders. Stock tracking cannot be disabled yet.",
      );
    case "INVALID_STOCK":
      throw new AdminCatalogError(
        "INVALID_STOCK",
        "Available stock cannot be lower than currently reserved stock.",
      );
    case "OK":
      throw new Error("Expected a catalog mutation failure.");
  }
}

function actor(admin: AdminIdentity) {
  return { id: admin.id, email: admin.email };
}

export async function createAdminProduct(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCatalogRepository,
  now = new Date(),
) {
  requireCatalogWrite(admin);
  const input = adminProductCreateSchema.parse(rawInput);
  const result = await repository.createProduct({
    storeId: admin.storeId,
    ...input,
    actor: actor(admin),
    now,
  });
  if (result.kind !== "OK") mapMutationFailure(result);
  return result.value;
}

export async function updateAdminProduct(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCatalogRepository,
  now = new Date(),
) {
  requireCatalogWrite(admin);
  const input = adminProductUpdateSchema.parse(rawInput);
  const result = await repository.updateProduct({
    storeId: admin.storeId,
    ...input,
    actor: actor(admin),
    now,
  });
  if (result.kind !== "OK") mapMutationFailure(result);
  return result.value;
}

export async function createAdminVariant(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCatalogRepository,
  now = new Date(),
) {
  requireCatalogWrite(admin);
  const input = adminVariantCreateSchema.parse(rawInput);
  const result = await repository.createVariant({
    storeId: admin.storeId,
    ...input,
    actor: actor(admin),
    now,
  });
  if (result.kind !== "OK") mapMutationFailure(result);
  return result.value;
}

export async function updateAdminVariant(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCatalogRepository,
  now = new Date(),
) {
  requireCatalogWrite(admin);
  const input = adminVariantUpdateSchema.parse(rawInput);
  const result = await repository.updateVariant({
    storeId: admin.storeId,
    ...input,
    actor: actor(admin),
    now,
  });
  if (result.kind !== "OK") mapMutationFailure(result);
  return result.value;
}

export async function setAdminDefaultVariant(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCatalogRepository,
  now = new Date(),
) {
  requireCatalogWrite(admin);
  const input = adminDefaultVariantSchema.parse(rawInput);
  const result = await repository.setDefaultVariant({
    storeId: admin.storeId,
    ...input,
    actor: actor(admin),
    now,
  });
  if (result.kind !== "OK") mapMutationFailure(result);
  return result.value;
}

export async function updateAdminInventory(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminCatalogRepository,
  now = new Date(),
) {
  requireCatalogWrite(admin);
  const input = adminInventoryUpdateSchema.parse(rawInput);
  const result = await repository.updateInventory({
    storeId: admin.storeId,
    ...input,
    actor: actor(admin),
    now,
  });
  if (result.kind !== "OK") mapMutationFailure(result);
  return result.value;
}
