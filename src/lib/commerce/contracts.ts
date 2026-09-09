import { z } from "zod";
import { bangladeshMobileSchema } from "./bd-phone";
import { paymentSelectionSchema } from "../payments/payment-intent";

const optionalTrackingValue = z.string().trim().max(2048).optional();

export const privacyPolicyVersionSchema = z.string().trim().min(1).max(32);

export const orderConsentInputSchema = z.object({
  privacyPolicyVersion: privacyPolicyVersionSchema,
  analyticsAllowed: z.boolean().default(false),
  emailMarketingAllowed: z.boolean().default(false),
  smsMarketingAllowed: z.boolean().default(false),
  whatsappMarketingAllowed: z.boolean().default(false),
});

export const analyticsEventConsentSchema = z.object({
  analyticsAllowed: z.boolean().default(false),
  privacyPolicyVersion: privacyPolicyVersionSchema,
});

export const attributionInputSchema = z.object({
  visitorKey: z.string().trim().min(16).max(80),
  sessionKey: z.string().trim().min(16).max(80),
  landingPage: optionalTrackingValue,
  referrer: optionalTrackingValue,
  utmSource: z.string().trim().max(255).optional(),
  utmMedium: z.string().trim().max(255).optional(),
  utmCampaign: z.string().trim().max(255).optional(),
  utmContent: z.string().trim().max(255).optional(),
  utmTerm: z.string().trim().max(255).optional(),
  fbclid: optionalTrackingValue,
  gclid: optionalTrackingValue,
});

export const storeSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const idempotencyKeySchema = z.string().trim().min(16).max(120);

export const browserCommerceEventNameSchema = z.enum([
  "PAGE_VIEW",
  "VIEW_CONTENT",
  "ADD_TO_CART",
  "BEGIN_CHECKOUT",
]);

export const browserCommerceEventInputSchema = z
  .object({
    storeSlug: storeSlugSchema,
    eventId: z.string().trim().min(16).max(120),
    eventName: browserCommerceEventNameSchema,
    productId: z.uuid().optional(),
    variantId: z.uuid().optional(),
    quantity: z.number().int().min(1).max(99).default(1),
    attribution: attributionInputSchema,
    consent: analyticsEventConsentSchema,
  })
  .superRefine((value, context) => {
    if (Boolean(value.productId) !== Boolean(value.variantId)) {
      context.addIssue({
        code: "custom",
        path: ["productId"],
        message: "Product and variant identifiers must be provided together.",
      });
    }
    if (value.eventName === "PAGE_VIEW") return;

    if (!value.productId) {
      context.addIssue({
        code: "custom",
        path: ["productId"],
        message: "Product is required for product commerce events.",
      });
    }
    if (!value.variantId) {
      context.addIssue({
        code: "custom",
        path: ["variantId"],
        message: "Variant is required for product commerce events.",
      });
    }
  });

export const landingOrderInputSchema = z.object({
  storeSlug: storeSlugSchema,
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
  customer: z.object({
    name: z.string().trim().min(2).max(255),
    phone: bangladeshMobileSchema,
    email: z.email().optional(),
  }),
  shippingAddress: z.object({
    addressLine1: z.string().trim().min(3).max(1000),
    addressLine2: z.string().trim().max(1000).optional(),
    area: z.string().trim().max(160).optional(),
    district: z.string().trim().min(2).max(160),
  }),
  note: z.string().trim().max(1000).optional(),
  phoneVerificationToken: z.string().trim().min(40).max(2048),
  payment: paymentSelectionSchema.optional(),
  idempotencyKey: idempotencyKeySchema,
  attribution: attributionInputSchema,
  consent: orderConsentInputSchema,
});

export const landingOrderRequestSchema = landingOrderInputSchema.omit({
  idempotencyKey: true,
});

export type LandingOrderInput = z.infer<typeof landingOrderInputSchema>;
export type LandingOrderRequest = z.infer<typeof landingOrderRequestSchema>;
export type AttributionInput = z.infer<typeof attributionInputSchema>;
export type OrderConsentInput = z.infer<typeof orderConsentInputSchema>;
export type BrowserCommerceEventInput = z.infer<
  typeof browserCommerceEventInputSchema
>;
export type BrowserCommerceEventName = z.infer<
  typeof browserCommerceEventNameSchema
>;
