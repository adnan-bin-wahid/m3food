type ClarityQueue = ((...args: unknown[]) => unknown) & { q?: unknown[][] };

interface ClarityBrowser {
  clarity?: ClarityQueue;
  __effyClarityProjects?: Set<string>;
}

interface ClarityDocument {
  head: { appendChild(node: unknown): unknown };
  createElement(tag: string): Record<string, any>;
  getElementById(id: string): unknown;
}

interface ClarityEnvironment {
  browser?: ClarityBrowser;
  document?: ClarityDocument;
}

export interface ClarityLoadInput {
  projectId: string;
  consent: string;
  visitorKey: string;
  sessionKey: string;
  pageId: string;
}

export function isValidClarityProjectId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{5,64}$/.test(value);
}

function defaultBrowser(): ClarityBrowser | undefined {
  return typeof window === "undefined" ? undefined : (window as unknown as ClarityBrowser);
}

function defaultDocument(): ClarityDocument | undefined {
  return typeof document === "undefined" ? undefined : (document as unknown as ClarityDocument);
}

function ensureClarityQueue(browser: ClarityBrowser) {
  if (browser.clarity) return browser.clarity;
  const clarity = function (...args: unknown[]) {
    (clarity.q ??= []).push(args);
  } as ClarityQueue;
  clarity.q = [];
  browser.clarity = clarity;
  return clarity;
}

export function loadClarity(
  input: ClarityLoadInput,
  environment: ClarityEnvironment = {},
) {
  const browser = environment.browser ?? defaultBrowser();
  const documentObject = environment.document ?? defaultDocument();
  if (
    input.consent !== "accepted" ||
    !isValidClarityProjectId(input.projectId) ||
    !browser ||
    !documentObject
  ) {
    return false;
  }

  const clarity = ensureClarityQueue(browser);
  browser.__effyClarityProjects ??= new Set();
  if (!browser.__effyClarityProjects.has(input.projectId)) {
    const scriptId = `effy-clarity-${input.projectId}`;
    if (!documentObject.getElementById(scriptId)) {
      const script = documentObject.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${encodeURIComponent(input.projectId)}`;
      documentObject.head.appendChild(script);
    }
    browser.__effyClarityProjects.add(input.projectId);
  }

  clarity("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: "granted",
  });
  clarity("identify", input.visitorKey, input.sessionKey, input.pageId);
  clarity("set", "effy_visitor", input.visitorKey);
  clarity("set", "effy_session", input.sessionKey);
  return true;
}

export function trackClarityEvent(
  eventName: string,
  consent: string,
  environment: ClarityEnvironment = {},
) {
  const browser = environment.browser ?? defaultBrowser();
  if (consent !== "accepted" || !browser?.clarity || !eventName.trim()) return false;
  browser.clarity("event", eventName.slice(0, 255));
  return true;
}

export function revokeClarityConsent(environment: ClarityEnvironment = {}) {
  const browser = environment.browser ?? defaultBrowser();
  if (!browser?.clarity) return false;
  browser.clarity("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: "denied",
  });
  // Microsoft documents this call specifically for clearing existing Clarity cookies.
  browser.clarity("consent", false);
  return true;
}
