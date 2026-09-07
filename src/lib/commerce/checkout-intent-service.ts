import { z } from "zod";
import { attributionInputSchema, privacyPolicyVersionSchema, storeSlugSchema } from "./contracts";
import type {
  CheckoutIntentRepository,
  CheckoutIntentInput,
} from "./checkout-intent-repository";

const optionalEmail = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.email().optional(),
);
const optionalPhone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(7).max(32).optional(),
);

export const checkoutIntentInputSchema = z.object({
  storeSlug: storeSlugSchema,
  intentKey: z.string().trim().min(16).max(120),
  productId: z.uuid(),
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
  contact: z.object({
    phone: optionalPhone,
    email: optionalEmail,
  }).refine((value) => Boolean(value.phone || value.email), {
    message: "A phone number or email address is required.",
  }),
  attribution: attributionInputSchema,
  consent: z.object({
    privacyPolicyVersion: privacyPolicyVersionSchema,
    privacyAcknowledged: z.literal(true),
    emailMarketingAllowed: z.boolean().default(false),
    smsMarketingAllowed: z.boolean().default(false),
    whatsappMarketingAllowed: z.boolean().default(false),
  }),
}).superRefine((input, context) => {
  const emailRecoverable = input.consent.emailMarketingAllowed && Boolean(input.contact.email);
  const phoneRecoverable =
    (input.consent.smsMarketingAllowed || input.consent.whatsappMarketingAllowed) &&
    Boolean(input.contact.phone);
  if (!emailRecoverable && !phoneRecoverable) {
    context.addIssue({
      code: "custom",
      path: ["consent"],
      message: "A consented recovery channel with matching contact information is required.",
    });
  }
});

export class CheckoutIntentError extends Error {
  constructor(
    public readonly code: "NOT_AVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "CheckoutIntentError";
  }
}

export async function captureCheckoutIntent(
  rawInput: unknown,
  repository: CheckoutIntentRepository,
  now = new Date(),
) {
  const input = checkoutIntentInputSchema.parse(rawInput) as CheckoutIntentInput;
  const result = await repository.upsertIntent({ ...input, now });
  if (result.kind === "STORE_OR_VARIANT_NOT_FOUND") {
    throw new CheckoutIntentError(
      "NOT_AVAILABLE",
      "The store, product, or variant is not available.",
    );
  }
  return result;
}
