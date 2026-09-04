export interface PublicCatalogVariant {
  id: string;
  sku: string;
  label: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  isDefault: boolean;
  inStock: boolean;
}

export interface PublicCatalog {
  store: { name: string; slug: string; currency: string };
  products: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    variants: PublicCatalogVariant[];
  }>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const MAX_TRACKING_VALUE_LENGTH = 2048;
const VISITOR_STORAGE_KEY = "commerce_visitor_key";
const SESSION_STORAGE_KEY = "commerce_session_key";

function optionalValue(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

export function selectDefaultVariant(catalog: PublicCatalog) {
  const variants = catalog.products.flatMap((product) =>
    product.variants.map((variant) => ({ product, variant })),
  );
  return (
    variants.find(({ variant }) => variant.isDefault) ?? variants[0] ?? null
  );
}

export function getOrCreateTrackingKey(
  storage: StorageLike,
  storageKey: string,
  prefix: string,
  createUuid: () => string,
) {
  try {
    const existing = storage.getItem(storageKey);
    if (existing && existing.length >= 16 && existing.length <= 80) {
      return existing;
    }

    const created = `${prefix}_${createUuid()}`;
    storage.setItem(storageKey, created);
    return created;
  } catch {
    return `${prefix}_${createUuid()}`;
  }
}

export function getBrowserTrackingKeys(
  localStorage: StorageLike,
  sessionStorage: StorageLike,
  createUuid: () => string,
) {
  return {
    visitorKey: getOrCreateTrackingKey(
      localStorage,
      VISITOR_STORAGE_KEY,
      "visitor",
      createUuid,
    ),
    sessionKey: getOrCreateTrackingKey(
      sessionStorage,
      SESSION_STORAGE_KEY,
      "session",
      createUuid,
    ),
  };
}

export function clearBrowserTrackingKeys(
  localStorage: StorageLike,
  sessionStorage: StorageLike,
) {
  try {
    localStorage.removeItem?.(VISITOR_STORAGE_KEY);
    sessionStorage.removeItem?.(SESSION_STORAGE_KEY);
  } catch {
    // Browser privacy modes can deny storage access.
  }
}

export function buildAttribution(
  pageUrl: string,
  referrer: string,
  visitorKey: string,
  sessionKey: string,
) {
  const url = new URL(pageUrl);
  const search = url.searchParams;

  return {
    visitorKey,
    sessionKey,
    landingPage: optionalValue(url.href, MAX_TRACKING_VALUE_LENGTH),
    referrer: optionalValue(referrer, MAX_TRACKING_VALUE_LENGTH),
    utmSource: optionalValue(search.get("utm_source"), 255),
    utmMedium: optionalValue(search.get("utm_medium"), 255),
    utmCampaign: optionalValue(search.get("utm_campaign"), 255),
    utmContent: optionalValue(search.get("utm_content"), 255),
    utmTerm: optionalValue(search.get("utm_term"), 255),
    fbclid: optionalValue(search.get("fbclid"), MAX_TRACKING_VALUE_LENGTH),
    gclid: optionalValue(search.get("gclid"), MAX_TRACKING_VALUE_LENGTH),
  };
}
