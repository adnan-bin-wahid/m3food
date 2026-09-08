import { createHash } from "node:crypto";
import type {
  PaymentIntentStatus,
  PaymentProvider,
} from "./payment-intent";

export interface PaymentProviderInitiationInput {
  paymentIntentId: string;
  orderPublicId: string;
  amountMinor: number;
  currency: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  returnUrls: {
    success: string;
    fail: string;
    cancel: string;
  };
}

export interface PaymentProviderInitiationResult {
  providerSessionId: string;
  redirectUrl: string;
  providerReference?: string;
  expiresAt?: Date;
  rawResponse?: unknown;
}

export type VerifiedProviderPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type PaymentProviderVerificationResult =
  | {
      verified: false;
      eventKey: string;
      reason: string;
      rawPayload?: unknown;
    }
  | {
      verified: true;
      eventKey: string;
      intentStatus: Exclude<
        PaymentIntentStatus,
        "CREATED" | "INITIATING"
      >;
      paymentStatus: VerifiedProviderPaymentStatus;
      providerReference?: string;
      verifiedAt: Date;
      rawPayload?: unknown;
    };

export interface PaymentAdapter {
  readonly provider: PaymentProvider;

  initiate(
    input: PaymentProviderInitiationInput,
  ): Promise<PaymentProviderInitiationResult>;

  verifyCallback(input: {
    headers: Headers;
    rawBody: string;
  }): Promise<PaymentProviderVerificationResult>;
}

export function hashPaymentProviderPayload(
  rawBody: string | Uint8Array,
) {
  return createHash("sha256").update(rawBody).digest("hex");
}
