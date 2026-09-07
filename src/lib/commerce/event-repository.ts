import type { BrowserCommerceEventInput, BrowserCommerceEventName } from "./contracts";

export interface RecordedCommerceEventDelivery {
  pixelId: string;
  eventName: BrowserCommerceEventName;
  eventId: string;
  occurredAt: Date;
  pageUrl?: string;
  visitorKey: string;
  fbclid?: string;
  valueMinor: number | null;
  currency: string | null;
  contentId: string | null;
  contentName: string | null;
  quantity: number;
  analyticsAllowed: boolean;
}

export interface RecordedCommerceEvent {
  eventId: string;
  created: boolean;
  delivery?: RecordedCommerceEventDelivery;
}

export interface BrowserEventRequestContext {
  userAgent?: string;
  ipHash?: string;
  clientIp?: string;
}

export interface CommerceEventRepository {
  recordBrowserEvent(
    input: BrowserCommerceEventInput,
    occurredAt: Date,
    requestContext: BrowserEventRequestContext,
  ): Promise<RecordedCommerceEvent>;
}
