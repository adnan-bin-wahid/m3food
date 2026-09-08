import type { OrderStatus } from "../commerce/order-status";
import type { PaymentSettlementStatus } from "./payment-settlement-repository";

export const PAYMENT_RECONCILIATION_ISSUES = [
  "DELIVERED_UNSETTLED",
  "REVERSED_AWAITING_REFUND",
  "STATUS_MISMATCH",
  "MISSING_PAYMENT",
] as const;

export type PaymentReconciliationIssue =
  (typeof PAYMENT_RECONCILIATION_ISSUES)[number];

export interface PaymentReconciliationCandidate {
  publicId: string;
  customerName: string;
  customerPhone: string;
  orderStatus: OrderStatus;
  orderPaymentMethod: "COD" | "MANUAL" | "ONLINE";
  orderPaymentStatus: PaymentSettlementStatus;
  orderTotalMinor: number;
  currency: string;
  timezone: string;
  orderCreatedAt: Date;
  orderUpdatedAt: Date;
  paymentId: string | null;
  paymentMethod: "COD" | "MANUAL" | "ONLINE" | null;
  paymentStatus: PaymentSettlementStatus | null;
  paymentAmountMinor: number | null;
  providerReference: string | null;
  paymentRevision: number | null;
  paymentUpdatedAt: Date | null;
  attentionSince: Date;
}

export interface AdminPaymentReconciliationRepository {
  listCandidates(
    storeId: string,
  ): Promise<PaymentReconciliationCandidate[]>;
}
