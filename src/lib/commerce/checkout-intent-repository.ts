import type { AttributionInput } from "./contracts";

export interface CheckoutIntentContact {
  phone?: string;
  email?: string;
}

export interface CheckoutIntentConsent {
  privacyPolicyVersion: string;
  privacyAcknowledged: true;
  emailMarketingAllowed: boolean;
  smsMarketingAllowed: boolean;
  whatsappMarketingAllowed: boolean;
}

export interface CheckoutIntentInput {
  storeSlug: string;
  intentKey: string;
  productId: string;
  variantId: string;
  quantity: number;
  contact: CheckoutIntentContact;
  attribution: AttributionInput;
  consent: CheckoutIntentConsent;
}

export interface PersistCheckoutIntentInput extends CheckoutIntentInput {
  now: Date;
}

export type CheckoutIntentPersistResult =
  | { kind: "OK"; updatedAt: Date }
  | { kind: "STORE_OR_VARIANT_NOT_FOUND" };

export interface CheckoutIntentRepository {
  upsertIntent(input: PersistCheckoutIntentInput): Promise<CheckoutIntentPersistResult>;
}
