import type { OrderStatus } from "../commerce/order-status";
import type { PaymentSettlementStatus } from "./payment-settlement-repository";

export interface AdminOrderCostItem {
  id: string;
  productName: string;
  sku: string | null;
  quantity: number;
  totalCostMinor: number | null;
}

export interface AdminOrderProfitabilitySnapshot {
  orderId: string;
  publicId: string;
  status: OrderStatus;
  paymentStatus: PaymentSettlementStatus;
  currency: string;
  revenueMinor: number;
  fulfillmentCostMinor: number | null;
  fulfillmentCostRevision: number;
  items: AdminOrderCostItem[];
}

export interface UpdateOrderFulfillmentCostInput {
  storeId: string;
  publicId: string;
  expectedRevision: number;
  fulfillmentCostMinor: number | null;
  actor: { id: string; email: string };
  now: Date;
}

export type UpdateOrderFulfillmentCostResult =
  | { kind: "UPDATED"; revision: number }
  | { kind: "NOT_FOUND" }
  | { kind: "CONFLICT"; currentRevision: number };

export interface AdminOrderProfitabilityRepository {
  getProfitability(
    storeId: string,
    publicId: string,
  ): Promise<AdminOrderProfitabilitySnapshot | null>;

  updateFulfillmentCost(
    input: UpdateOrderFulfillmentCostInput,
  ): Promise<UpdateOrderFulfillmentCostResult>;
}
