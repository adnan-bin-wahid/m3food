import { z } from "zod";
import {
  analyticsEventConsentSchema,
  attributionInputSchema,
  storeSlugSchema,
} from "../commerce/contracts";

export const browserInteractionEventNameSchema = z.enum([
  "SESSION_START",
  "SECTION_VIEW",
  "CTA_VIEW",
  "CTA_CLICK",
  "SCROLL_DEPTH",
  "WHATSAPP_CLICK",
  "MESSENGER_CLICK",
]);

const optionalShort = z.string().trim().min(1).max(255).optional();
const optionalUrl = z.string().trim().min(1).max(2048).optional();

export const browserInteractionEventInputSchema = z
  .object({
    storeSlug: storeSlugSchema,
    eventId: z.string().trim().min(16).max(120),
    eventName: browserInteractionEventNameSchema,
    elementKey: z.string().trim().min(1).max(160).optional(),
    elementLabel: optionalShort,
    sectionKey: z.string().trim().min(1).max(160).optional(),
    targetUrl: optionalUrl,
    scrollDepth: z.number().int().min(1).max(100).optional(),
    attribution: attributionInputSchema,
    consent: analyticsEventConsentSchema,
  })
  .superRefine((value, context) => {
    if (["CTA_VIEW", "CTA_CLICK", "WHATSAPP_CLICK", "MESSENGER_CLICK"].includes(value.eventName) && !value.elementKey) {
      context.addIssue({
        code: "custom",
        path: ["elementKey"],
        message: "CTA interaction events require an element key.",
      });
    }
    if (value.eventName === "SECTION_VIEW" && !value.sectionKey) {
      context.addIssue({
        code: "custom",
        path: ["sectionKey"],
        message: "Section view events require a section key.",
      });
    }
    if (value.eventName === "SCROLL_DEPTH" && value.scrollDepth === undefined) {
      context.addIssue({
        code: "custom",
        path: ["scrollDepth"],
        message: "Scroll depth events require a depth percentage.",
      });
    }
  });

export type BrowserInteractionEventName = z.infer<typeof browserInteractionEventNameSchema>;
export type BrowserInteractionEventInput = z.infer<typeof browserInteractionEventInputSchema>;
