const META_EVENT_NAMES = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  ADD_TO_CART: "AddToCart",
  BEGIN_CHECKOUT: "InitiateCheckout",
  PURCHASE: "Purchase",
} as const;

type CommercePixelEventName = keyof typeof META_EVENT_NAMES;
type MetaQueue = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaQueue;
  loaded: boolean;
  version: string;
};

interface MetaBrowser {
  fbq?: MetaQueue;
  _fbq?: MetaQueue;
  __m3foodMetaPixelEvents?: Set<string>;
  __m3foodMetaPixelIds?: Set<string>;
}

interface MetaDocument {
  head: { appendChild(node: unknown): unknown };
  createElement(tag: string): Record<string, unknown>;
  getElementById(id: string): unknown;
}

interface MetaEnvironment {
  browser?: MetaBrowser;
  document?: MetaDocument;
}

interface MetaEventInput {
  pixelId: string;
  consent: string;
  eventName: CommercePixelEventName;
  data?: Record<string, unknown>;
  eventId?: string;
  dedupeKey?: string;
}

export function isValidMetaPixelId(value: unknown): value is string {
  return typeof value === "string" && /^\d{5,25}$/.test(value);
}

function ensureMetaQueue(browser: MetaBrowser, documentObject: MetaDocument) {
  if (browser.fbq) return browser.fbq;

  const queue = function (this: unknown, ...args: unknown[]) {
    if (queue.callMethod) queue.callMethod(...args);
    else queue.queue.push(args);
  } as MetaQueue;
  queue.queue = [];
  queue.push = queue;
  queue.loaded = true;
  queue.version = "2.0";
  browser.fbq = queue;
  browser._fbq = queue;

  if (!documentObject.getElementById("m3food-meta-pixel")) {
    const script = documentObject.createElement("script");
    script.id = "m3food-meta-pixel";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    documentObject.head.appendChild(script);
  }
  return queue;
}

function defaultBrowser(): MetaBrowser | undefined {
  return typeof window === "undefined" ? undefined : (window as unknown as MetaBrowser);
}

function defaultDocument(): MetaDocument | undefined {
  return typeof document === "undefined" ? undefined : (document as unknown as MetaDocument);
}

export function trackMetaPixelEvent(
  {
    pixelId,
    consent,
    eventName,
    data = {},
    eventId,
    dedupeKey,
  }: MetaEventInput,
  environment: MetaEnvironment = {},
) {
  const browser = environment.browser ?? defaultBrowser();
  const documentObject = environment.document ?? defaultDocument();
  const metaEventName = META_EVENT_NAMES[eventName];
  if (
    consent !== "accepted" ||
    !isValidMetaPixelId(pixelId) ||
    !metaEventName ||
    !browser ||
    !documentObject
  ) {
    return false;
  }

  browser.__m3foodMetaPixelEvents ??= new Set();
  const eventKey = `${pixelId}:${dedupeKey ?? `${eventName}:${eventId ?? ""}`}`;
  if (browser.__m3foodMetaPixelEvents.has(eventKey)) return false;

  const fbq = ensureMetaQueue(browser, documentObject);
  browser.__m3foodMetaPixelIds ??= new Set();
  if (!browser.__m3foodMetaPixelIds.has(pixelId)) {
    fbq("init", pixelId);
    browser.__m3foodMetaPixelIds.add(pixelId);
  }
  fbq("consent", "grant");
  fbq("trackSingle", pixelId, metaEventName, data, eventId ? { eventID: eventId } : {});
  browser.__m3foodMetaPixelEvents.add(eventKey);
  return true;
}

export function revokeMetaPixelConsent(environment: MetaEnvironment = {}) {
  const browser = environment.browser ?? defaultBrowser();
  if (!browser?.fbq) return false;
  browser.fbq("consent", "revoke");
  return true;
}
