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
  store: { name: string; slug: string; currency: string; metaPixelId?: string; ga4MeasurementId?: string; gtmContainerId?: string; clarityProjectId?: string };
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
const ANONYMOUS_VISITOR_STORAGE_KEY = "commerce_anon_visitor_key";
const ANONYMOUS_SESSION_STORAGE_KEY = "commerce_anon_session_key";

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

export function getFirstPartyTrackingKeys(
  localStorage: StorageLike,
  sessionStorage: StorageLike,
  createUuid: () => string,
  analyticsAllowed: boolean,
) {
  if (analyticsAllowed) {
    return getBrowserTrackingKeys(localStorage, sessionStorage, createUuid);
  }

  return {
    visitorKey: getOrCreateTrackingKey(
      sessionStorage,
      ANONYMOUS_VISITOR_STORAGE_KEY,
      "visitor_session",
      createUuid,
    ),
    sessionKey: getOrCreateTrackingKey(
      sessionStorage,
      ANONYMOUS_SESSION_STORAGE_KEY,
      "session_anon",
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
  options: { includeClickIds?: boolean } = {},
) {
  const url = new URL(pageUrl);
  const search = url.searchParams;
  const includeClickIds = options.includeClickIds ?? true;
  const landingUrl = new URL(url.href);

  if (!includeClickIds) {
    landingUrl.searchParams.delete("fbclid");
    landingUrl.searchParams.delete("gclid");
  }

  return {
    visitorKey,
    sessionKey,
    landingPage: optionalValue(landingUrl.href, MAX_TRACKING_VALUE_LENGTH),
    referrer: optionalValue(referrer, MAX_TRACKING_VALUE_LENGTH),
    utmSource: optionalValue(search.get("utm_source"), 255),
    utmMedium: optionalValue(search.get("utm_medium"), 255),
    utmCampaign: optionalValue(search.get("utm_campaign"), 255),
    utmContent: optionalValue(search.get("utm_content"), 255),
    utmTerm: optionalValue(search.get("utm_term"), 255),
    fbclid: includeClickIds
      ? optionalValue(search.get("fbclid"), MAX_TRACKING_VALUE_LENGTH)
      : undefined,
    gclid: includeClickIds
      ? optionalValue(search.get("gclid"), MAX_TRACKING_VALUE_LENGTH)
      : undefined,
  };
}
