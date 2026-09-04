import type { BrowserCommerceEventInput } from "./contracts";

export interface RecordedCommerceEvent {
  eventId: string;
  created: boolean;
}

export interface BrowserEventRequestContext {
  userAgent?: string;
  ipHash?: string;
}

export interface CommerceEventRepository {
  recordBrowserEvent(
    input: BrowserCommerceEventInput,
    occurredAt: Date,
    requestContext: BrowserEventRequestContext,
  ): Promise<RecordedCommerceEvent>;
}
