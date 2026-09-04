import type { BrowserCommerceEventName } from "../commerce/contracts";
import {
  buildAttribution,
  getBrowserTrackingKeys,
  type PublicCatalogVariant,
} from "./checkout";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface ProductSelection {
  product: { id: string };
  variant: PublicCatalogVariant;
}

export interface BrowserAnalyticsEnvironment {
  pageUrl: string;
  referrer: string;
  localStorage: StorageLike;
  sessionStorage: StorageLike;
  createUuid(): string;
  fetch(input: string, init: RequestInit): Promise<{ ok: boolean }>;
}

export interface TrackBrowserCommerceEventInput {
  storeSlug: string;
  eventName: BrowserCommerceEventName;
  selection?: ProductSelection | null;
  quantity?: number;
  privacyPolicyVersion: string;
}

export async function trackBrowserCommerceEvent(
  input: TrackBrowserCommerceEventInput,
  environment: BrowserAnalyticsEnvironment,
) {
  const { visitorKey, sessionKey } = getBrowserTrackingKeys(
    environment.localStorage,
    environment.sessionStorage,
    environment.createUuid,
  );
  const selection = input.selection;

  try {
    const response = await environment.fetch("/api/v1/events", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        storeSlug: input.storeSlug,
        eventId: `event_${environment.createUuid()}`,
        eventName: input.eventName,
        productId: selection?.product.id,
        variantId: selection?.variant.id,
        quantity: input.quantity ?? 1,
        consent: {
          analyticsAllowed: true,
          privacyPolicyVersion: input.privacyPolicyVersion,
        },
        attribution: buildAttribution(
          environment.pageUrl,
          environment.referrer,
          visitorKey,
          sessionKey,
        ),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
