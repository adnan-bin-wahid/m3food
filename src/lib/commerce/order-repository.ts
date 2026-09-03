import type { AttributionInput, LandingOrderInput } from "./contracts";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface ExistingLandingOrder {
  id: string;
  publicId: string;
  requestHash: string;
  status: OrderStatus;
  totalMinor: number;
  currency: string;
  createdAt: Date;
}

export interface PurchasableVariant {
  storeId: string;
  currency: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string | null;
  sku: string;
  unitPriceMinor: number;
  trackStock: boolean;
  available: number;
  reserved: number;
}

export interface TrackingIdentity {
  visitorId: string;
  sessionId: string;
}

export interface NewLandingOrderGraph {
  order: {
    id: string;
    publicId: string;
    storeId: string;
    customerId: string;
    visitorId: string;
    sessionId: string;
    currency: string;
    subtotalMinor: number;
    totalMinor: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    addressLine1: string;
    addressLine2?: string;
    area?: string;
    district: string;
    note?: string;
    idempotencyKey: string;
    requestHash: string;
    createdAt: Date;
  };
  item: {
    id: string;
    productId: string;
    variantId: string;
    productName: string;
    variantLabel: string | null;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    totalMinor: number;
  };
  payment: {
    id: string;
    amountMinor: number;
  };
  attribution: AttributionInput;
  purchaseEvent: {
    id: string;
    eventId: string;
    occurredAt: Date;
  };
}

export interface LandingOrderTransaction {
  findExistingOrder(
    storeSlug: string,
    idempotencyKey: string,
  ): Promise<ExistingLandingOrder | null>;
  findPurchasableVariant(
    storeSlug: string,
    variantId: string,
  ): Promise<PurchasableVariant | null>;
  upsertCustomer(
    storeId: string,
    customer: LandingOrderInput["customer"],
    now: Date,
  ): Promise<string>;
  upsertTrackingIdentity(
    storeId: string,
    attribution: AttributionInput,
    now: Date,
  ): Promise<TrackingIdentity>;
  reserveStock(
    variant: PurchasableVariant,
    quantity: number,
    now: Date,
  ): Promise<boolean>;
  insertOrderGraph(graph: NewLandingOrderGraph): Promise<ExistingLandingOrder>;
}

export interface LandingOrderRepository {
  withTransaction<T>(
    operation: (transaction: LandingOrderTransaction) => Promise<T>,
  ): Promise<T>;
  findExistingOrder(
    storeSlug: string,
    idempotencyKey: string,
  ): Promise<ExistingLandingOrder | null>;
  isIdempotencyConflict(error: unknown): boolean;
}
