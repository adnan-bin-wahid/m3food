"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getCurrentAdmin } from "../../../src/lib/auth/current-admin";
import {
  AdminCatalogError,
  createAdminProduct,
  createAdminVariant,
  parseAdminMoneyToMinor,
  parseOptionalAdminMoneyToMinor,
  setAdminDefaultVariant,
  updateAdminInventory,
  updateAdminProduct,
  updateAdminVariant,
} from "../../../src/lib/admin/catalog-admin-service";
import { DrizzleAdminCatalogRepository } from "../../../src/lib/db/admin-catalog-repository";

export interface CatalogActionState {
  ok: boolean;
  message: string;
}

const repository = () => new DrizzleAdminCatalogRepository();

function errorState(error: unknown, fallback: string): CatalogActionState {
  if (error instanceof AdminCatalogError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof ZodError) {
    return { ok: false, message: error.issues[0]?.message ?? "Check the form values." };
  }
  return { ok: false, message: fallback };
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function refreshProduct(productId: string, storeSlug: string) {
  revalidatePath("/admin/catalog");
  revalidatePath(`/admin/catalog/${productId}`);
  revalidatePath(`/api/v1/stores/${storeSlug}/catalog`);
  revalidatePath("/");
}

export async function createProductAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  let created;
  try {
    created = await createAdminProduct(
      admin,
      {
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Product could not be created.");
  }

  revalidatePath("/admin/catalog");
  redirect(`/admin/catalog/${created.id}`);
}

export async function updateProductAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const productId = String(formData.get("productId") ?? "");
  try {
    await updateAdminProduct(
      admin,
      {
        productId,
        expectedRevision: Number(formData.get("expectedRevision")),
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        status: formData.get("status"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Product could not be saved.");
  }
  refreshProduct(productId, admin.storeSlug);
  return { ok: true, message: "Product saved." };
}

export async function createVariantAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const productId = String(formData.get("productId") ?? "");
  try {
    await createAdminVariant(
      admin,
      {
        productId,
        sku: formData.get("sku"),
        label: formData.get("label"),
        priceMinor: parseAdminMoneyToMinor(formData.get("price")),
        compareAtPriceMinor: parseOptionalAdminMoneyToMinor(formData.get("compareAtPrice")),
        unitCostMinor: parseOptionalAdminMoneyToMinor(formData.get("unitCost")),
        isActive: checkbox(formData, "isActive"),
        trackStock: checkbox(formData, "trackStock"),
        available: Number(formData.get("available")),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Variant could not be created.");
  }
  refreshProduct(productId, admin.storeSlug);
  return { ok: true, message: "Variant created." };
}

export async function updateVariantAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const productId = String(formData.get("productId") ?? "");
  try {
    await updateAdminVariant(
      admin,
      {
        productId,
        variantId: formData.get("variantId"),
        expectedRevision: Number(formData.get("expectedRevision")),
        sku: formData.get("sku"),
        label: formData.get("label"),
        priceMinor: parseAdminMoneyToMinor(formData.get("price")),
        compareAtPriceMinor: parseOptionalAdminMoneyToMinor(formData.get("compareAtPrice")),
        unitCostMinor: parseOptionalAdminMoneyToMinor(formData.get("unitCost")),
        isActive: checkbox(formData, "isActive"),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Variant could not be saved.");
  }
  refreshProduct(productId, admin.storeSlug);
  return { ok: true, message: "Variant saved." };
}

export async function setDefaultVariantAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const productId = String(formData.get("productId") ?? "");
  try {
    await setAdminDefaultVariant(
      admin,
      {
        productId,
        variantId: formData.get("variantId"),
        expectedRevision: Number(formData.get("expectedRevision")),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Default variant could not be changed.");
  }
  refreshProduct(productId, admin.storeSlug);
  return { ok: true, message: "Default variant updated." };
}

export async function updateInventoryAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const productId = String(formData.get("productId") ?? "");
  try {
    await updateAdminInventory(
      admin,
      {
        productId,
        variantId: formData.get("variantId"),
        expectedRevision: Number(formData.get("expectedRevision")),
        trackStock: checkbox(formData, "trackStock"),
        available: Number(formData.get("available")),
      },
      repository(),
    );
  } catch (error) {
    return errorState(error, "Inventory could not be saved.");
  }
  refreshProduct(productId, admin.storeSlug);
  return { ok: true, message: "Inventory saved." };
}
