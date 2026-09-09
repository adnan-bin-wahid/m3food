import type {
  AttributionInput,
  LandingOrderInput,
  OrderConsentInput,
} from "./contracts";
import type {
  OrderRiskHistory,
  OrderRiskLevel,
  OrderRiskSnapshot,
} from "./order-risk";
import type {
  PaymentIntentStatus,
  PaymentProvider,
} from "../payments/payment-intent";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type OrderPaymentMethod = "COD" | "MANUAL" | "ONLINE";
export type OrderPaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface PaymentIntentSummary {
  id: string;
  provider: PaymentProvider;
  status: PaymentIntentStatus;
}

export interface ExistingLandingOrder {
  id: string;
  storeId?: string;
  customerId?: string;
  publicId: string;
  requestHash: string;
  status: OrderStatus;
  paymentMethod?: OrderPaymentMethod;
  paymentStatus?: OrderPaymentStatus;
  paymentIntent?: PaymentIntentSummary;
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
    phoneVerificationChallengeId: string;
    phoneVerifiedAt: Date;
    riskLevel: OrderRiskLevel;
    riskReasons: string[];
    riskSnapshot: OrderRiskSnapshot;
    manualReviewRequired: boolean;
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
    method: OrderPaymentMethod;
    status: OrderPaymentStatus;
    amountMinor: number;
  };
  paymentIntent?: {
    id: string;
    provider: PaymentProvider;
    status: PaymentIntentStatus;
    idempotencyKey: string;
    amountMinor: number;
    currency: string;
    createdAt: Date;
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
  consumePhoneVerification(
    storeId: string,
    challengeId: string,
    phone: string,
    now: Date,
  ): Promise<boolean>;
  getOrderRiskHistory(
    storeId: string,
    phone: string,
    addressLine1: string,
    variantId: string,
    quantity: number,
    now: Date,
  ): Promise<OrderRiskHistory>;
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
