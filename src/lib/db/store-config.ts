import { readFile } from "node:fs/promises";
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase kebab-case slug.");

const variantSchema = z
  .object({
    sku: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(160).nullable().default(null),
    priceMinor: z.number().int().nonnegative(),
    compareAtPriceMinor: z.number().int().nonnegative().nullable().default(null),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    trackStock: z.boolean().default(true),
    available: z.number().int().nonnegative().default(0),
  })
  .superRefine((variant, context) => {
    if (
      variant.compareAtPriceMinor !== null &&
      variant.compareAtPriceMinor < variant.priceMinor
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceMinor"],
        message: "Compare-at price cannot be lower than the selling price.",
      });
    }

    if (!variant.trackStock && variant.available !== 0) {
      context.addIssue({
        code: "custom",
        path: ["available"],
        message: "Untracked inventory must use zero as its available quantity.",
      });
    }
  });

const productSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    slug: slugSchema,
    description: z.string().trim().min(1).nullable().default(null),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
    variants: z.array(variantSchema).min(1),
  })
  .superRefine((product, context) => {
    const defaultCount = product.variants.filter(
      (variant) => variant.isDefault,
    ).length;

    if (defaultCount !== 1) {
      context.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Every product must have exactly one default variant.",
      });
    }
  });

export const storeConfigSchema = z
  .object({
    store: z.object({
      name: z.string().trim().min(1).max(160),
      slug: slugSchema,
      primaryDomain: z.string().trim().min(1).max(255).nullable().default(null),
      currency: z
        .string()
        .trim()
        .length(3)
        .transform((value) => value.toUpperCase()),
      timezone: z.string().trim().min(1).max(64),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
    }),
    products: z.array(productSchema).min(1),
  })
  .superRefine((config, context) => {
    const productSlugs = new Set<string>();
    const skus = new Set<string>();

    config.products.forEach((product, productIndex) => {
      if (productSlugs.has(product.slug)) {
        context.addIssue({
          code: "custom",
          path: ["products", productIndex, "slug"],
          message: "Product slugs must be unique within a store.",
        });
      }
      productSlugs.add(product.slug);

      product.variants.forEach((variant, variantIndex) => {
        if (skus.has(variant.sku)) {
          context.addIssue({
            code: "custom",
            path: ["products", productIndex, "variants", variantIndex, "sku"],
            message: "Variant SKUs must be unique within a store.",
          });
        }
        skus.add(variant.sku);
      });
    });
  });

export type StoreConfig = z.infer<typeof storeConfigSchema>;

export async function loadStoreConfig(filePath: string): Promise<StoreConfig> {
  const contents = await readFile(filePath, "utf8");
  return storeConfigSchema.parse(JSON.parse(contents) as unknown);
}
