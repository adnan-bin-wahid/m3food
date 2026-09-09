const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePublicStoreSlug(value: string | undefined) {
  const slug = value?.trim().replace(/_/g, "-");

  if (!slug) {
    throw new Error(
      "NEXT_PUBLIC_STORE_SLUG is required. Configure the active client store slug before running the storefront.",
    );
  }

  if (slug.length > 120 || !STORE_SLUG_PATTERN.test(slug)) {
    throw new Error(
      "NEXT_PUBLIC_STORE_SLUG must be a lowercase kebab-case slug with at most 120 characters.",
    );
  }

  return slug;
}

export function getPublicStoreSlug(
  value: string | undefined = process.env.NEXT_PUBLIC_STORE_SLUG || "niyamah-attires",
) {
  return normalizePublicStoreSlug(value);
}
