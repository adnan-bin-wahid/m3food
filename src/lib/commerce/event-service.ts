import {
  browserCommerceEventInputSchema,
  type BrowserCommerceEventInput,
} from "./contracts";
import type {
  BrowserEventRequestContext,
  CommerceEventRepository,
  RecordedCommerceEvent,
} from "./event-repository";

export function recordBrowserCommerceEvent(
  rawInput: unknown,
  repository: CommerceEventRepository,
  occurredAt = new Date(),
  requestContext: BrowserEventRequestContext = {},
): Promise<RecordedCommerceEvent> {
  const input: BrowserCommerceEventInput =
    browserCommerceEventInputSchema.parse(rawInput);
  return repository.recordBrowserEvent(input, occurredAt, requestContext);
}
