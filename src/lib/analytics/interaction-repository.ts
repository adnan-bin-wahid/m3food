import type { BrowserInteractionEventInput } from "./interaction-contracts";

export interface BrowserInteractionRequestContext {
  userAgent?: string;
  ipHash?: string;
}

export interface RecordedInteractionEvent {
  eventId: string;
  created: boolean;
}

export interface InteractionEventRepository {
  recordInteractionEvent(
    input: BrowserInteractionEventInput,
    occurredAt: Date,
    requestContext: BrowserInteractionRequestContext,
  ): Promise<RecordedInteractionEvent>;
}
