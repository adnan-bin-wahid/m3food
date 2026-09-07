export interface CatalogVariant {
  id: string;
  sku: string;
  label: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  isDefault: boolean;
  inStock: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  variants: CatalogVariant[];
}

export interface StoreCatalog {
  store: {
    name: string;
    slug: string;
    currency: string;
    metaPixelId?: string;
    ga4MeasurementId?: string;
    gtmContainerId?: string;
    clarityProjectId?: string;
  };
  products: CatalogProduct[];
}

export interface CatalogRepository {
  findActiveCatalog(storeSlug: string): Promise<StoreCatalog | null>;
}
