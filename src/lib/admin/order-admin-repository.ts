import type { OrderStatus } from "../commerce/order-status";

export interface AdminOrderListQuery {
  query: string;
  status: OrderStatus | null;
  page: number;
  pageSize: number;
}

export interface AdminOrderSummary {
  publicId: string;
  customerName: string;
  customerPhone: string;
  district: string;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalMinor: number;
  currency: string;
  timezone: string;
  source: string;
  createdAt: Date;
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  variantLabel: string | null;
  sku: string | null;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface AdminOrderHistoryEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedByAdminEmail: string | null;
  createdAt: Date;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerEmail: string | null;
  addressLine1: string;
  addressLine2: string | null;
  area: string | null;
  note: string | null;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  paymentMethod: "COD" | "MANUAL";
  updatedAt: Date;
  items: AdminOrderItem[];
  history: AdminOrderHistoryEntry[];
  payment: {
    method: "COD" | "MANUAL";
    status: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    amountMinor: number;
    currency: string;
    providerReference: string | null;
  } | null;
  attribution: {
    source: string;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
    landingPage: string | null;
    referrer: string | null;
  } | null;
  consent: {
    privacyPolicyVersion: string;
    analyticsAllowed: boolean;
    emailMarketingAllowed: boolean;
    smsMarketingAllowed: boolean;
    whatsappMarketingAllowed: boolean;
    capturedAt: Date;
  } | null;
}

export interface AdminOrderTransitionInput {
  storeId: string;
  publicId: string;
  expectedStatus: OrderStatus;
  toStatus: OrderStatus;
  note: string | null;
  actor: { id: string; email: string };
  now: Date;
}

export type AdminOrderTransitionResult =
  | { kind: "UPDATED"; publicId: string; status: OrderStatus }
  | { kind: "NOT_FOUND" }
  | { kind: "CONFLICT"; currentStatus: OrderStatus }
  | { kind: "INVENTORY_CONFLICT" };

export interface AdminOrderRepository {
  listOrders(
    storeId: string,
    query: AdminOrderListQuery,
  ): Promise<{ orders: AdminOrderSummary[]; total: number }>;
  getOrderDetail(storeId: string, publicId: string): Promise<AdminOrderDetail | null>;
  transitionOrder(
    input: AdminOrderTransitionInput,
  ): Promise<AdminOrderTransitionResult>;
}
