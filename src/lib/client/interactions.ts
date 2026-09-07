import { buildAttribution, getFirstPartyTrackingKeys } from "./checkout";
import type { BrowserInteractionEventName } from "../analytics/interaction-contracts";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface BrowserInteractionEnvironment {
  pageUrl: string;
  referrer: string;
  localStorage: StorageLike;
  sessionStorage: StorageLike;
  createUuid(): string;
  fetch(input: string, init: RequestInit): Promise<{ ok: boolean }>;
}

export interface TrackBrowserInteractionInput {
  storeSlug: string;
  eventName: BrowserInteractionEventName;
  analyticsAllowed: boolean;
  privacyPolicyVersion: string;
  eventId?: string;
  elementKey?: string;
  elementLabel?: string;
  sectionKey?: string;
  targetUrl?: string;
  scrollDepth?: number;
}

export async function trackBrowserInteraction(
  input: TrackBrowserInteractionInput,
  environment: BrowserInteractionEnvironment,
) {
  const { visitorKey, sessionKey } = getFirstPartyTrackingKeys(
    environment.localStorage,
    environment.sessionStorage,
    environment.createUuid,
    input.analyticsAllowed,
  );
  try {
    const response = await environment.fetch("/api/v1/interactions", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        storeSlug: input.storeSlug,
        eventId: input.eventId ?? `interaction_${environment.createUuid()}`,
        eventName: input.eventName,
        elementKey: input.elementKey,
        elementLabel: input.elementLabel,
        sectionKey: input.sectionKey,
        targetUrl: input.targetUrl,
        scrollDepth: input.scrollDepth,
        consent: {
          analyticsAllowed: input.analyticsAllowed,
          privacyPolicyVersion: input.privacyPolicyVersion,
        },
        attribution: buildAttribution(
          environment.pageUrl,
          environment.referrer,
          visitorKey,
          sessionKey,
          { includeClickIds: input.analyticsAllowed },
        ),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
