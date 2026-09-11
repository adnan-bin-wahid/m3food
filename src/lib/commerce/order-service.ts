import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  landingOrderInputSchema,
  type LandingOrderInput,
} from "./contracts";
import { CommerceError } from "./commerce-error";
import { multiplyMinorAmount } from "./money";
import { assessOrderRisk } from "./order-risk";
import { resolveInitialPaymentState } from "../payments/payment-intent";
import { getPhoneVerificationSecret } from "../config/server-env";
import {
  verifyPhoneVerificationToken,
  type PhoneVerificationTokenPayload,
} from "../security/phone-verification";
import { PHONE_OTP_REQUIRED } from "../config/features";
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
  preference?: { storeId: string; customerId: string };
  preferencesUrl?: string;
}

export interface OrderServiceDependencies {
  now: () => Date;
  createUuid: () => string;
  createPublicId: (now: Date) => string;
  verifyPhoneToken: (
    token: string,
    now: Date,
  ) => PhoneVerificationTokenPayload;
  phoneOtpRequired?: boolean;
}

const defaultDependencies: OrderServiceDependencies = {
  now: () => new Date(),
  createUuid: () => randomUUID(),
  createPublicId: (now) => {
    const day = now.toISOString().slice(0, 10).replaceAll("-", "");
    return `ORD-${day}-${randomBytes(4).toString("hex").toUpperCase()}`;
  },
  verifyPhoneToken: (token, now) =>
    verifyPhoneVerificationToken(
      token,
      getPhoneVerificationSecret(),
      now,
    ),
  phoneOtpRequired: PHONE_OTP_REQUIRED,
};

export function fingerprintLandingOrder(input: LandingOrderInput): string {
  const { phoneVerificationToken: _verificationToken, ...fingerprintInput } =
    input;
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
    .update(JSON.stringify(canonicalize(fingerprintInput)))
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

  return {
    ...existing,
    created: false,
    preference:
      existing.storeId && existing.customerId
        ? { storeId: existing.storeId, customerId: existing.customerId }
        : undefined,
  };
}

function verifyOrderPhone(
  token: string,
  phone: string,
  storeSlug: string,
  dependencies: OrderServiceDependencies,
  now: Date,
) {
  let payload: PhoneVerificationTokenPayload;
  try {
    payload = dependencies.verifyPhoneToken(
      token,
      now,
    );
  } catch {
    throw new CommerceError(
      "PHONE_VERIFICATION_REQUIRED",
      "A valid mobile verification is required before placing the order.",
    );
  }

  if (
    payload.storeSlug !== storeSlug ||
    payload.phone !== phone
  ) {
    throw new CommerceError(
      "PHONE_VERIFICATION_REQUIRED",
      "The verified mobile number does not match this order.",
    );
  }

  return payload;
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

  const now = dependencies.now();
  const phoneOtpRequired = dependencies.phoneOtpRequired ?? true;
  let verification: PhoneVerificationTokenPayload | null = null;

  if (phoneOtpRequired) {
    if (!input.phoneVerificationToken) {
      throw new CommerceError(
        "PHONE_VERIFICATION_REQUIRED",
        "A valid mobile verification is required before placing the order.",
      );
    }
    verification = verifyOrderPhone(
      input.phoneVerificationToken,
      input.customer.phone,
      input.storeSlug,
      dependencies,
      now,
    );

    const verificationConsumed =
      await transaction.consumePhoneVerification(
        variant.storeId,
        verification.challengeId,
        input.customer.phone,
        now,
      );

    if (!verificationConsumed) {
      throw new CommerceError(
        "PHONE_VERIFICATION_REQUIRED",
        "This mobile verification is expired, already used, or invalid.",
      );
    }
  } else if (input.phoneVerificationToken) {
    verification = verifyOrderPhone(
      input.phoneVerificationToken,
      input.customer.phone,
      input.storeSlug,
      dependencies,
      now,
    );
    const verificationConsumed =
      await transaction.consumePhoneVerification(
        variant.storeId,
        verification.challengeId,
        input.customer.phone,
        now,
      );
    if (!verificationConsumed) {
      throw new CommerceError(
        "PHONE_VERIFICATION_REQUIRED",
        "This mobile verification is expired, already used, or invalid.",
      );
    }
  }

  const history = await transaction.getOrderRiskHistory(
    variant.storeId,
    input.customer.phone,
    input.shippingAddress.addressLine1,
    input.variantId,
    input.quantity,
    now,
  );

  if (history.exactDuplicate10m) {
    throw new CommerceError(
      "RECENT_DUPLICATE_ORDER",
      "A matching recent order already exists for this mobile number.",
    );
  }

  const risk = assessOrderRisk(history);

  const subtotalMinor = multiplyMinorAmount(
    variant.unitPriceMinor,
    input.quantity,
  );
  const unitCostMinor = variant.unitCostMinor;
  const totalCostMinor =
    unitCostMinor === null
      ? null
      : multiplyMinorAmount(unitCostMinor, input.quantity);

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
  const paymentState = resolveInitialPaymentState(input.payment);
  const paymentId = dependencies.createUuid();
  const paymentIntentId =
    paymentState.paymentMethod === "ONLINE"
      ? dependencies.createUuid()
      : null;

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
      phoneVerificationChallengeId: verification?.challengeId ?? null,
      phoneVerifiedAt: verification ? new Date(verification.verifiedAt) : null,
      riskLevel: risk.level,
      riskReasons: risk.reasons,
      riskSnapshot: risk.snapshot,
      manualReviewRequired: risk.manualReviewRequired,
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
      unitCostMinor,
      totalCostMinor,
    },
    payment: {
      id: paymentId,
      method: paymentState.paymentMethod,
      status: paymentState.paymentStatus,
      amountMinor: subtotalMinor,
    },
    paymentIntent:
      paymentIntentId &&
      paymentState.provider &&
      paymentState.paymentIntentStatus
        ? {
            id: paymentIntentId,
            provider: paymentState.provider,
            status: paymentState.paymentIntentStatus,
            idempotencyKey: `order:${orderId}:${paymentState.provider}:initial`,
            amountMinor: subtotalMinor,
            currency: variant.currency,
            createdAt: now,
          }
        : undefined,
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
    preference: { storeId: variant.storeId, customerId },
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
  const dependencies = {
    ...defaultDependencies,
    ...dependencyOverrides,
  };

  try {
    return await repository.withTransaction((transaction) =>
      createInsideTransaction(
        transaction,
        input,
        requestHash,
        dependencies,
      ),
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
