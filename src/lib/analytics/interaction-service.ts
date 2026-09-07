import {
  browserInteractionEventInputSchema,
  type BrowserInteractionEventInput,
} from "./interaction-contracts";
import type {
  BrowserInteractionRequestContext,
  InteractionEventRepository,
  RecordedInteractionEvent,
} from "./interaction-repository";

export async function recordBrowserInteractionEvent(
  rawInput: unknown,
  repository: InteractionEventRepository,
  occurredAt = new Date(),
  requestContext: BrowserInteractionRequestContext = {},
): Promise<RecordedInteractionEvent> {
  const input: BrowserInteractionEventInput = browserInteractionEventInputSchema.parse(rawInput);
  return repository.recordInteractionEvent(input, occurredAt, requestContext);
}
