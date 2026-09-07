export type AdminCatalogProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface AdminCatalogVariant {
  id: string;
  revision: number;
  sku: string;
  label: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  isDefault: boolean;
  isActive: boolean;
  trackStock: boolean;
  available: number;
  reserved: number;
  inventoryRevision: number;
}

export interface AdminCatalogProduct {
  id: string;
  revision: number;
  name: string;
  slug: string;
  description: string | null;
  status: AdminCatalogProductStatus;
  variants: AdminCatalogVariant[];
}

export interface AdminCatalogSnapshot {
  store: {
    name: string;
    slug: string;
    currency: string;
    timezone: string;
  };
  products: AdminCatalogProduct[];
}

export interface AdminCatalogHistoryEntry {
  id: string;
  action: string;
  changedByAdminEmail: string;
  beforeState: unknown;
  afterState: unknown;
  createdAt: Date;
}

export interface AdminCatalogProductDetail extends AdminCatalogProduct {
  store: AdminCatalogSnapshot["store"];
  history: AdminCatalogHistoryEntry[];
}

export interface CatalogActor {
  id: string;
  email: string;
}

export type CatalogMutationFailure =
  | { kind: "NOT_FOUND" }
  | { kind: "CONFLICT" }
  | { kind: "DUPLICATE_SLUG" }
  | { kind: "DUPLICATE_SKU" }
  | { kind: "NO_ACTIVE_VARIANT" }
  | { kind: "DEFAULT_REQUIRED" }
  | { kind: "RESERVED_STOCK" }
  | { kind: "INVALID_STOCK" };

export type CatalogMutationResult<T> =
  | { kind: "OK"; value: T }
  | CatalogMutationFailure;

export interface CreateProductInput {
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  actor: CatalogActor;
  now: Date;
}

export interface UpdateProductInput extends CreateProductInput {
  productId: string;
  expectedRevision: number;
  status: AdminCatalogProductStatus;
}

export interface CreateVariantInput {
  storeId: string;
  productId: string;
  sku: string;
  label: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  isActive: boolean;
  trackStock: boolean;
  available: number;
  actor: CatalogActor;
  now: Date;
}

export interface UpdateVariantInput {
  storeId: string;
  productId: string;
  variantId: string;
  expectedRevision: number;
  sku: string;
  label: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  isActive: boolean;
  actor: CatalogActor;
  now: Date;
}

export interface SetDefaultVariantInput {
  storeId: string;
  productId: string;
  variantId: string;
  expectedRevision: number;
  actor: CatalogActor;
  now: Date;
}

export interface UpdateInventoryInput {
  storeId: string;
  productId: string;
  variantId: string;
  expectedRevision: number;
  trackStock: boolean;
  available: number;
  actor: CatalogActor;
  now: Date;
}

export interface AdminCatalogRepository {
  getCatalog(storeId: string): Promise<AdminCatalogSnapshot | null>;
  getProduct(
    storeId: string,
    productId: string,
  ): Promise<AdminCatalogProductDetail | null>;
  createProduct(
    input: CreateProductInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>>;
  updateProduct(
    input: UpdateProductInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>>;
  createVariant(
    input: CreateVariantInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>>;
  updateVariant(
    input: UpdateVariantInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>>;
  setDefaultVariant(
    input: SetDefaultVariantInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>>;
  updateInventory(
    input: UpdateInventoryInput,
  ): Promise<CatalogMutationResult<{ id: string; revision: number }>>;
}
