export const PAYMENT_SETTLEMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

export type PaymentSettlementStatus =
  (typeof PAYMENT_SETTLEMENT_STATUSES)[number];

export interface AdminPaymentSettlementSnapshot {
  orderId: string;
  publicId: string;
  orderPaymentStatus: PaymentSettlementStatus;
  paymentId: string;
  method: "COD" | "MANUAL" | "ONLINE";
  status: PaymentSettlementStatus;
  amountMinor: number;
  currency: string;
  providerReference: string | null;
  revision: number;
  updatedAt: Date;
}

export interface UpdatePaymentSettlementInput {
  storeId: string;
  publicId: string;
  expectedPaymentId: string;
  expectedRevision: number;
  expectedStatus: PaymentSettlementStatus;
  toStatus: PaymentSettlementStatus;
  providerReference: string | null;
  note: string | null;
  actor: { id: string; email: string };
  now: Date;
}

export type UpdatePaymentSettlementResult =
  | {
      kind: "UPDATED";
      revision: number;
      status: PaymentSettlementStatus;
      providerReference: string | null;
    }
  | { kind: "NOT_FOUND" }
  | {
      kind: "CONFLICT";
      currentPaymentId: string | null;
      currentRevision: number | null;
      currentStatus: PaymentSettlementStatus | null;
    };

export interface AdminPaymentSettlementRepository {
  getSettlement(
    storeId: string,
    publicId: string,
  ): Promise<AdminPaymentSettlementSnapshot | null>;

  updateSettlement(
    input: UpdatePaymentSettlementInput,
  ): Promise<UpdatePaymentSettlementResult>;
}
