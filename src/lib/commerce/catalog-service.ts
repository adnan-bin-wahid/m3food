import { CommerceError } from "./commerce-error";
import type { CatalogRepository, StoreCatalog } from "./catalog-repository";
import { storeSlugSchema } from "./contracts";

export async function getStoreCatalog(
  rawStoreSlug: unknown,
  repository: CatalogRepository,
): Promise<StoreCatalog> {
  const storeSlug = storeSlugSchema.parse(rawStoreSlug);
  const catalog = await repository.findActiveCatalog(storeSlug);

  if (!catalog) {
    throw new CommerceError(
      "STORE_NOT_AVAILABLE",
      "The requested store or its catalog is not available.",
    );
  }

  return catalog;
}
