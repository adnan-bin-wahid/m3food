import type {
  AttributionInput,
  LandingOrderInput,
  OrderConsentInput,
} from "./contracts";

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
  storeId?: string;
  customerId?: string;
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
  metaPixelId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string | null;
  sku: string;
  unitPriceMinor: number;
  unitCostMinor: number | null;
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
    unitCostMinor: number | null;
    totalCostMinor: number | null;
  };
  payment: {
    id: string;
    amountMinor: number;
  };
  consent: OrderConsentInput;
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
