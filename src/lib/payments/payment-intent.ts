import { z } from "zod";

export const PAYMENT_PROVIDERS = ["SSL_COMMERZ"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS);

export const paymentSelectionSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("COD"),
  }),
  z.object({
    method: z.literal("ONLINE"),
    provider: paymentProviderSchema,
  }),
]);

export type PaymentSelection = z.infer<typeof paymentSelectionSchema>;

export const PAYMENT_INTENT_STATUSES = [
  "CREATED",
  "INITIATING",
  "REQUIRES_ACTION",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type PaymentIntentStatus =
  (typeof PAYMENT_INTENT_STATUSES)[number];

export function normalizePaymentSelection(
  selection?: PaymentSelection,
): PaymentSelection {
  return selection ?? { method: "COD" };
}

export function resolveInitialPaymentState(
  selection?: PaymentSelection,
) {
  const normalized = normalizePaymentSelection(selection);

  if (normalized.method === "COD") {
    return {
      selection: normalized,
      paymentMethod: "COD" as const,
      paymentStatus: "UNPAID" as const,
      paymentIntentStatus: null,
      provider: null,
    };
  }

  return {
    selection: normalized,
    paymentMethod: "ONLINE" as const,
    paymentStatus: "PENDING" as const,
    paymentIntentStatus: "CREATED" as const,
    provider: normalized.provider,
  };
}
