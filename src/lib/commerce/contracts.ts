import { z } from "zod";

const optionalTrackingValue = z.string().trim().max(2048).optional();

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

export const landingOrderInputSchema = z.object({
  storeSlug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
  customer: z.object({
    name: z.string().trim().min(2).max(255),
    phone: z.string().trim().min(7).max(32),
    email: z.email().optional(),
  }),
  shippingAddress: z.object({
    addressLine1: z.string().trim().min(3).max(1000),
    addressLine2: z.string().trim().max(1000).optional(),
    area: z.string().trim().max(160).optional(),
    district: z.string().trim().min(2).max(160),
  }),
  note: z.string().trim().max(1000).optional(),
  idempotencyKey: z.string().trim().min(16).max(120),
  attribution: attributionInputSchema,
});

export type LandingOrderInput = z.infer<typeof landingOrderInputSchema>;
export type AttributionInput = z.infer<typeof attributionInputSchema>;
