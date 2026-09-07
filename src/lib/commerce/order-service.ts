import { createHash, randomBytes, randomUUID } from "node:crypto";
import { landingOrderInputSchema, type LandingOrderInput } from "./contracts";
import { CommerceError } from "./commerce-error";
import { multiplyMinorAmount } from "./money";
import type {
  ExistingLandingOrder,
  LandingOrderRepository,
  LandingOrderTransaction,
  NewLandingOrderGraph,
} from "./order-repository";

export interface LandingOrderMarketingDelivery {
  pixelId: string;
  analyticsAllowed: boolean;
  eventId: string;
  occurredAt: Date;
  pageUrl?: string;
  visitorKey: string;
  fbclid?: string;
  email?: string;
  phone: string;
  valueMinor: number;
  currency: string;
  contentId: string;
  contentName: string;
  quantity: number;
}

export interface LandingOrderResult extends ExistingLandingOrder {
  created: boolean;
  marketing?: LandingOrderMarketingDelivery;
}

export interface OrderServiceDependencies {
  now: () => Date;
  createUuid: () => string;
  createPublicId: (now: Date) => string;
}

const defaultDependencies: OrderServiceDependencies = {
  now: () => new Date(),
  createUuid: () => randomUUID(),
  createPublicId: (now) => {
    const day = now.toISOString().slice(0, 10).replaceAll("-", "");
    return `ORD-${day}-${randomBytes(4).toString("hex").toUpperCase()}`;
  },
};

export function fingerprintLandingOrder(input: LandingOrderInput): string {
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, entry]) => entry !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, entry]) => [key, canonicalize(entry)]),
      );
    }
    return value;
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(input)))
    .digest("hex");
}

function resolveExistingOrder(
  existing: ExistingLandingOrder,
  requestHash: string,
): LandingOrderResult {
  if (existing.requestHash !== requestHash) {
    throw new CommerceError(
      "IDEMPOTENCY_CONFLICT",
      "This idempotency key was already used with a different order payload.",
    );
  }

  return { ...existing, created: false };
}

async function createInsideTransaction(
  transaction: LandingOrderTransaction,
  input: LandingOrderInput,
  requestHash: string,
  dependencies: OrderServiceDependencies,
): Promise<LandingOrderResult> {
  const existing = await transaction.findExistingOrder(
    input.storeSlug,
    input.idempotencyKey,
  );
  if (existing) {
    return resolveExistingOrder(existing, requestHash);
  }

  const variant = await transaction.findPurchasableVariant(
    input.storeSlug,
    input.variantId,
  );
  if (!variant) {
    throw new CommerceError(
      "VARIANT_NOT_AVAILABLE",
      "The requested store, product, or variant is not available.",
    );
  }

  const subtotalMinor = multiplyMinorAmount(
    variant.unitPriceMinor,
    input.quantity,
  );
  const now = dependencies.now();
  const customerId = await transaction.upsertCustomer(
    variant.storeId,
    input.customer,
    now,
  );
  const tracking = await transaction.upsertTrackingIdentity(
    variant.storeId,
    input.attribution,
    now,
  );

  if (variant.trackStock) {
    const reserved = await transaction.reserveStock(
      variant,
      input.quantity,
      now,
    );
    if (!reserved) {
      throw new CommerceError(
        "OUT_OF_STOCK",
        "The requested quantity is not currently available.",
      );
    }
  }

  const orderId = dependencies.createUuid();
  const graph: NewLandingOrderGraph = {
    order: {
      id: orderId,
      publicId: dependencies.createPublicId(now),
      storeId: variant.storeId,
      customerId,
      visitorId: tracking.visitorId,
      sessionId: tracking.sessionId,
      currency: variant.currency,
      subtotalMinor,
      totalMinor: subtotalMinor,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      customerEmail: input.customer.email,
      addressLine1: input.shippingAddress.addressLine1,
      addressLine2: input.shippingAddress.addressLine2,
      area: input.shippingAddress.area,
      district: input.shippingAddress.district,
      note: input.note,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      createdAt: now,
    },
    item: {
      id: dependencies.createUuid(),
      productId: variant.productId,
      variantId: variant.variantId,
      productName: variant.productName,
      variantLabel: variant.variantLabel,
      sku: variant.sku,
      quantity: input.quantity,
      unitPriceMinor: variant.unitPriceMinor,
      totalMinor: subtotalMinor,
    },
    payment: {
      id: dependencies.createUuid(),
      amountMinor: subtotalMinor,
    },
    consent: input.consent,
    attribution: input.attribution,
    purchaseEvent: {
      id: dependencies.createUuid(),
      eventId: `purchase:${orderId}`,
      occurredAt: now,
    },
  };

  const order = await transaction.insertOrderGraph(graph);
  return {
    ...order,
    created: true,
    marketing: {
      pixelId: variant.metaPixelId,
      analyticsAllowed: input.consent.analyticsAllowed,
      eventId: order.publicId,
      occurredAt: now,
      pageUrl: input.attribution.landingPage,
      visitorKey: input.attribution.visitorKey,
      fbclid: input.attribution.fbclid,
      email: input.customer.email,
      phone: input.customer.phone,
      valueMinor: order.totalMinor,
      currency: order.currency,
      contentId: variant.sku,
      contentName: variant.productName,
      quantity: input.quantity,
    },
  };
}

export async function createLandingOrder(
  rawInput: unknown,
  repository: LandingOrderRepository,
  dependencyOverrides: Partial<OrderServiceDependencies> = {},
): Promise<LandingOrderResult> {
  const input = landingOrderInputSchema.parse(rawInput);
  const requestHash = fingerprintLandingOrder(input);
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };

  try {
    return await repository.withTransaction((transaction) =>
      createInsideTransaction(transaction, input, requestHash, dependencies),
    );
  } catch (error) {
    if (!repository.isIdempotencyConflict(error)) {
      throw error;
    }

    const existing = await repository.findExistingOrder(
      input.storeSlug,
      input.idempotencyKey,
    );
    if (!existing) {
      throw error;
    }

    return resolveExistingOrder(existing, requestHash);
  }
}
