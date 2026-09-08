import type { OrderStatus } from "../commerce/order-status";
import type { PaymentSettlementStatus } from "./payment-settlement-repository";

export type FinancialLifecycleStatus =
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type FinancialPaymentRecognition =
  | "PAID_DELIVERED"
  | "REFUNDED_DELIVERED"
  | "REVERSED_RESOLVED"
  | "UNSETTLED"
  | "OUTSIDE_FINANCIAL_LIFECYCLE";

export function classifyFinancialPaymentRecognition(
  status: OrderStatus,
  paymentStatus: PaymentSettlementStatus,
): FinancialPaymentRecognition {
  if (status === "DELIVERED") {
    if (paymentStatus === "PAID") return "PAID_DELIVERED";
    if (paymentStatus === "REFUNDED") return "REFUNDED_DELIVERED";
    return "UNSETTLED";
  }

  if (status === "CANCELLED" || status === "RETURNED") {
    if (paymentStatus === "PAID" || paymentStatus === "PENDING") {
      return "UNSETTLED";
    }

    return "REVERSED_RESOLVED";
  }

  return "OUTSIDE_FINANCIAL_LIFECYCLE";
}

export function isFinancialSettlementResolved(
  recognition: FinancialPaymentRecognition,
) {
  return (
    recognition === "PAID_DELIVERED" ||
    recognition === "REFUNDED_DELIVERED" ||
    recognition === "REVERSED_RESOLVED"
  );
}
