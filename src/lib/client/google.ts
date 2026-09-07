type GoogleCommerceEventName = "PAGE_VIEW" | "VIEW_CONTENT" | "ADD_TO_CART" | "BEGIN_CHECKOUT" | "PURCHASE";

type DataLayer = unknown[] & { push: (...items: unknown[]) => number };
type GoogleBrowser = {
  dataLayer?: DataLayer;
  gtag?: (...args: unknown[]) => void;
  __m3foodGoogleEvents?: Set<string>;
  __m3foodGa4Ids?: Set<string>;
  __m3foodGtmIds?: Set<string>;
};

type GoogleDocument = {
  head: { appendChild(node: unknown): unknown };
  body?: { appendChild(node: unknown): unknown };
  createElement(tag: string): Record<string, any>;
  getElementById(id: string): unknown;
};

interface GoogleEnvironment {
  browser?: GoogleBrowser;
  document?: GoogleDocument;
}

interface GoogleEventInput {
  measurementId?: string;
  containerId?: string;
  consent: string;
  eventName: GoogleCommerceEventName;
  eventId?: string;
  dedupeKey?: string;
  pageUrl?: string;
  referrer?: string;
  currency?: string;
  value?: number;
  transactionId?: string;
  item?: { id: string; name: string; price: number; quantity: number };
}

const GA4_EVENTS: Record<GoogleCommerceEventName, string> = {
  PAGE_VIEW: "page_view",
  VIEW_CONTENT: "view_item",
  ADD_TO_CART: "add_to_cart",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
};

export function isValidGa4MeasurementId(value: unknown): value is string {
  return typeof value === "string" && /^G-[A-Z0-9]{4,30}$/.test(value);
}

export function isValidGtmContainerId(value: unknown): value is string {
  return typeof value === "string" && /^GTM-[A-Z0-9]{4,28}$/.test(value);
}

function defaultBrowser(): GoogleBrowser | undefined {
  return typeof window === "undefined" ? undefined : (window as unknown as GoogleBrowser);
}

function defaultDocument(): GoogleDocument | undefined {
  return typeof document === "undefined" ? undefined : (document as unknown as GoogleDocument);
}

function ensureDataLayer(browser: GoogleBrowser) {
  browser.dataLayer ??= [] as unknown as DataLayer;
  return browser.dataLayer;
}

function ensureGtag(browser: GoogleBrowser) {
  const dataLayer = ensureDataLayer(browser);
  browser.gtag ??= (...args: unknown[]) => { dataLayer.push(args); };
  return browser.gtag;
}

function ensureGa4(browser: GoogleBrowser, documentObject: GoogleDocument, measurementId: string) {
  const gtag = ensureGtag(browser);
  browser.__m3foodGa4Ids ??= new Set();
  if (browser.__m3foodGa4Ids.has(measurementId)) return gtag;

  const scriptId = `m3food-ga4-${measurementId}`;
  if (!documentObject.getElementById(scriptId)) {
    const script = documentObject.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    documentObject.head.appendChild(script);
  }
  gtag("js", new Date());
  gtag("config", measurementId, { send_page_view: false });
  browser.__m3foodGa4Ids.add(measurementId);
  return gtag;
}

function ensureGtm(browser: GoogleBrowser, documentObject: GoogleDocument, containerId: string) {
  const dataLayer = ensureDataLayer(browser);
  browser.__m3foodGtmIds ??= new Set();
  if (browser.__m3foodGtmIds.has(containerId)) return dataLayer;
  const scriptId = `m3food-gtm-${containerId}`;
  if (!documentObject.getElementById(scriptId)) {
    dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = documentObject.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    documentObject.head.appendChild(script);
  }
  browser.__m3foodGtmIds.add(containerId);
  return dataLayer;
}

function eventParameters(input: GoogleEventInput) {
  const params: Record<string, unknown> = {
    event_id: input.eventId,
    page_location: input.pageUrl,
    page_referrer: input.referrer || undefined,
  };
  if (input.currency) params.currency = input.currency;
  if (typeof input.value === "number") params.value = input.value;
  if (input.transactionId) params.transaction_id = input.transactionId;
  if (input.item) {
    params.items = [{
      item_id: input.item.id,
      item_name: input.item.name,
      price: input.item.price,
      quantity: input.item.quantity,
    }];
  }
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}

export function trackGoogleCommerceEvent(input: GoogleEventInput, environment: GoogleEnvironment = {}) {
  const browser = environment.browser ?? defaultBrowser();
  const documentObject = environment.document ?? defaultDocument();
  if (input.consent !== "accepted" || !browser || !documentObject) return false;
  const ga4 = isValidGa4MeasurementId(input.measurementId) ? input.measurementId : undefined;
  const gtm = isValidGtmContainerId(input.containerId) ? input.containerId : undefined;
  if (!ga4 && !gtm) return false;

  browser.__m3foodGoogleEvents ??= new Set();
  const key = `${ga4 ?? ""}:${gtm ?? ""}:${input.dedupeKey ?? `${input.eventName}:${input.eventId ?? ""}`}`;
  if (browser.__m3foodGoogleEvents.has(key)) return false;

  const eventName = GA4_EVENTS[input.eventName];
  const params = eventParameters(input);
  if (ga4) {
    const gtag = ensureGa4(browser, documentObject, ga4);
    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    gtag("event", eventName, params);
  }
  if (gtm) {
    const dataLayer = ensureGtm(browser, documentObject, gtm);
    dataLayer.push({ event: `effy_${eventName}`, ecommerce: params });
  }
  browser.__m3foodGoogleEvents.add(key);
  return true;
}

export function revokeGoogleConsent(environment: GoogleEnvironment = {}) {
  const browser = environment.browser ?? defaultBrowser();
  if (!browser) return false;
  const gtag = ensureGtag(browser);
  gtag("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  return true;
}
