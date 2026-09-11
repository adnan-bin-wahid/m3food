import assert from "node:assert/strict";
import test from "node:test";
import { CommerceError } from "./commerce-error";
import type { LandingOrderInput } from "./contracts";
import {
  createLandingOrder,
  fingerprintLandingOrder,
  type OrderServiceDependencies,
} from "./order-service";
import type {
  ExistingLandingOrder,
  LandingOrderRepository,
  LandingOrderTransaction,
  NewLandingOrderGraph,
  PurchasableVariant,
} from "./order-repository";

const now = new Date("2026-09-03T12:00:00.000Z");

const validInput: LandingOrderInput = {
  storeSlug: "demo-store",
  variantId: "11111111-1111-4111-8111-111111111111",
  quantity: 2,
  customer: {
    name: "Demo Customer",
    phone: "01700000000",
    email: "customer@example.com",
  },
  shippingAddress: {
    addressLine1: "House 1, Road 2",
    area: "Dhanmondi",
    district: "Dhaka",
  },
  note: "Call before delivery",
  phoneVerificationToken: "phone_verification_token_test_12345678901234567890",
  idempotencyKey: "checkout_attempt_123456",
  consent: {
    privacyPolicyVersion: "2026-09-04",
    analyticsAllowed: true,
    emailMarketingAllowed: false,
    smsMarketingAllowed: true,
    whatsappMarketingAllowed: true,
  },
  attribution: {
    visitorKey: "visitor_1234567890",
    sessionKey: "session_1234567890",
    landingPage: "https://shop.example.com/offer",
    utmSource: "facebook",
    utmCampaign: "launch",
    fbclid: "click-id",
  },
};

const variant: PurchasableVariant = {
  storeId: "22222222-2222-4222-8222-222222222222",
  currency: "BDT",
  metaPixelId: "123456789",
  productId: "33333333-3333-4333-8333-333333333333",
  productName: "Reusable Demo Product",
  variantId: validInput.variantId,
  variantLabel: "Standard",
  sku: "DEMO-001",
  unitPriceMinor: 125_00,
  unitCostMinor: 70_00,
  trackStock: true,
  available: 10,
  reserved: 1,
};

const fixedIds = [
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
  "77777777-7777-4777-8777-777777777777",
];

function createDependencies(): Partial<OrderServiceDependencies> {
  const ids = [...fixedIds];
  return {
    now: () => now,
    createUuid: () => {
      const id = ids.shift();
      if (!id) throw new Error("Test UUIDs exhausted.");
      return id;
    },
    createPublicId: () => "ORD-20260903-ABCDEF12",
    verifyPhoneToken: () => ({
      v: 1,
      challengeId: "10101010-1010-4010-8010-101010101010",
      storeSlug: "demo-store",
      phone: "01700000000",
      verifiedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    }),
  };
}

function orderFromGraph(graph: NewLandingOrderGraph): ExistingLandingOrder {
  return {
    id: graph.order.id,
    publicId: graph.order.publicId,
    requestHash: graph.order.requestHash,
    status: "PENDING",
    totalMinor: graph.order.totalMinor,
    currency: graph.order.currency,
    createdAt: graph.order.createdAt,
  };
}

class FakeRepository
  implements LandingOrderRepository, LandingOrderTransaction
{
  existing: ExistingLandingOrder | null = null;
  purchasableVariant: PurchasableVariant | null = variant;
  reservationSucceeds = true;
  customerId = "88888888-8888-4888-8888-888888888888";
  transactionError: unknown;
  insertedGraph: NewLandingOrderGraph | null = null;
  reserveCalls = 0;
  verificationConsumed = true;
  riskHistory = {
    totalOrders: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    recent1h: 0,
    recent24h: 0,
    sameAddress24h: 0,
    exactDuplicate10m: false,
  };

  async withTransaction<T>(
    operation: (transaction: LandingOrderTransaction) => Promise<T>,
  ): Promise<T> {
    if (this.transactionError) throw this.transactionError;
    return operation(this);
  }

  async findExistingOrder() {
    return this.existing;
  }

  async findPurchasableVariant() {
    return this.purchasableVariant;
  }

  async consumePhoneVerification() {
    return this.verificationConsumed;
  }

  async getOrderRiskHistory() {
    return this.riskHistory;
  }

  async upsertCustomer() {
    return this.customerId;
  }

  async upsertTrackingIdentity() {
    return {
      visitorId: "99999999-9999-4999-8999-999999999999",
      sessionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    };
  }

  async reserveStock() {
    this.reserveCalls += 1;
    return this.reservationSucceeds;
  }

  async insertOrderGraph(graph: NewLandingOrderGraph) {
    this.insertedGraph = graph;
    return orderFromGraph(graph);
  }

  isIdempotencyConflict(error: unknown) {
    return error === this.transactionError;
  }
}

test("a landing order writes an exact immutable order snapshot", async () => {
  const repository = new FakeRepository();
  const result = await createLandingOrder(
    validInput,
    repository,
    createDependencies(),
  );
  const graph = repository.insertedGraph;

  assert.equal(result.created, true);
  assert.equal(result.totalMinor, 250_00);
  assert.equal(result.marketing?.eventId, result.publicId);
  assert.equal(result.marketing?.pixelId, variant.metaPixelId);
  assert.equal(result.marketing?.analyticsAllowed, true);
  assert.deepEqual(result.preference, { storeId: variant.storeId, customerId: repository.customerId });
  assert.ok(graph);
  assert.equal(graph.order.subtotalMinor, 250_00);
  assert.equal(graph.item.unitPriceMinor, 125_00);
  assert.equal(graph.item.totalMinor, 250_00);
  assert.equal(graph.item.unitCostMinor, 70_00);
  assert.equal(graph.item.totalCostMinor, 140_00);
  assert.equal(graph.payment.amountMinor, 250_00);
  assert.equal(graph.payment.method, "COD");
  assert.equal(graph.payment.status, "UNPAID");
  assert.equal(graph.paymentIntent, undefined);
  assert.deepEqual(graph.consent, validInput.consent);
  assert.equal(graph.purchaseEvent.eventId, `purchase:${graph.order.id}`);
  assert.equal(repository.reserveCalls, 1);
});


test("an explicit online order creates a pending SSLCommerz payment intent", async () => {
  const repository = new FakeRepository();
  const ids = [
    "44444444-4444-4444-8444-444444444444",
    "55555555-5555-4555-8555-555555555555",
    "66666666-6666-4666-8666-666666666666",
    "77777777-7777-4777-8777-777777777777",
    "12121212-1212-4212-8212-121212121212",
  ];

  const result = await createLandingOrder(
    {
      ...validInput,
      payment: {
        method: "ONLINE",
        provider: "SSL_COMMERZ",
      },
    },
    repository,
    {
      now: () => now,
      createUuid: () => {
        const id = ids.shift();
        if (!id) throw new Error("Test UUIDs exhausted.");
        return id;
      },
      createPublicId: () => "ORD-20260903-ONLINE01",
      verifyPhoneToken: createDependencies().verifyPhoneToken!,
    },
  );

  const graph = repository.insertedGraph;
  assert.equal(result.created, true);
  assert.ok(graph);
  assert.equal(graph.payment.method, "ONLINE");
  assert.equal(graph.payment.status, "PENDING");
  assert.equal(graph.paymentIntent?.provider, "SSL_COMMERZ");
  assert.equal(graph.paymentIntent?.status, "CREATED");
  assert.equal(graph.paymentIntent?.amountMinor, 250_00);
});

test("a repeated request returns the original order without reserving twice", async () => {
  const repository = new FakeRepository();
  repository.existing = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    storeId: variant.storeId,
    customerId: repository.customerId,
    publicId: "ORD-EXISTING",
    requestHash: fingerprintLandingOrder(validInput),
    status: "PENDING",
    totalMinor: 250_00,
    currency: "BDT",
    createdAt: now,
  };

  const result = await createLandingOrder(validInput, repository);

  assert.equal(result.created, false);
  assert.equal(result.publicId, "ORD-EXISTING");
  assert.deepEqual(result.preference, { storeId: variant.storeId, customerId: repository.customerId });
  assert.equal(repository.reserveCalls, 0);
  assert.equal(repository.insertedGraph, null);
});

test("request fingerprints do not depend on object key insertion order", () => {
  const reordered = {
    attribution: { ...validInput.attribution },
    consent: { ...validInput.consent },
    idempotencyKey: validInput.idempotencyKey,
    phoneVerificationToken: validInput.phoneVerificationToken,
    shippingAddress: { ...validInput.shippingAddress },
    customer: { ...validInput.customer },
    quantity: validInput.quantity,
    variantId: validInput.variantId,
    storeSlug: validInput.storeSlug,
    note: validInput.note,
  } satisfies LandingOrderInput;

  assert.equal(
    fingerprintLandingOrder(reordered),
    fingerprintLandingOrder(validInput),
  );
});

test("reusing an idempotency key with another payload is rejected", async () => {
  const repository = new FakeRepository();
  repository.existing = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    publicId: "ORD-EXISTING",
    requestHash: fingerprintLandingOrder({ ...validInput, quantity: 1 }),
    status: "PENDING",
    totalMinor: 125_00,
    currency: "BDT",
    createdAt: now,
  };

  await assert.rejects(
    () => createLandingOrder(validInput, repository),
    (error: unknown) =>
      error instanceof CommerceError && error.code === "IDEMPOTENCY_CONFLICT",
  );
});

test("a failed conditional stock reservation aborts the order", async () => {
  const repository = new FakeRepository();
  repository.reservationSucceeds = false;

  await assert.rejects(
    () => createLandingOrder(validInput, repository, createDependencies()),
    (error: unknown) =>
      error instanceof CommerceError && error.code === "OUT_OF_STOCK",
  );
  assert.equal(repository.insertedGraph, null);
});

test("inactive or unknown store/product/variant is not purchasable", async () => {
  const repository = new FakeRepository();
  repository.purchasableVariant = null;

  await assert.rejects(
    () => createLandingOrder(validInput, repository),
    (error: unknown) =>
      error instanceof CommerceError && error.code === "VARIANT_NOT_AVAILABLE",
  );
});

test("an untracked variant does not require an inventory row", async () => {
  const repository = new FakeRepository();
  repository.purchasableVariant = {
    ...variant,
    trackStock: false,
    available: 0,
  };

  const result = await createLandingOrder(
    validInput,
    repository,
    createDependencies(),
  );

  assert.equal(result.created, true);
  assert.equal(repository.reserveCalls, 0);
});

test("a concurrent duplicate insert resolves to the original order", async () => {
  const repository = new FakeRepository();
  repository.transactionError = new Error("unique violation");
  repository.existing = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    publicId: "ORD-RACE-WINNER",
    requestHash: fingerprintLandingOrder(validInput),
    status: "PENDING",
    totalMinor: 250_00,
    currency: "BDT",
    createdAt: now,
  };

  const result = await createLandingOrder(validInput, repository);
  assert.equal(result.created, false);
  assert.equal(result.publicId, "ORD-RACE-WINNER");
});

test("a consumed or mismatched phone verification fails before order creation", async () => {
  const repository = new FakeRepository();
  repository.verificationConsumed = false;
  await assert.rejects(
    () => createLandingOrder(validInput, repository, createDependencies()),
    (error: unknown) =>
      error instanceof CommerceError &&
      error.code === "PHONE_VERIFICATION_REQUIRED",
  );
  assert.equal(repository.insertedGraph, null);
});

test("an exact recent repeat is blocked before a second order is persisted", async () => {
  const repository = new FakeRepository();
  repository.riskHistory.exactDuplicate10m = true;
  await assert.rejects(
    () => createLandingOrder(validInput, repository, createDependencies()),
    (error: unknown) =>
      error instanceof CommerceError &&
      error.code === "RECENT_DUPLICATE_ORDER",
  );
  assert.equal(repository.insertedGraph, null);
});

test("high-risk history is snapshotted for mandatory manual review", async () => {
  const repository = new FakeRepository();
  repository.riskHistory = {
    totalOrders: 8,
    delivered: 1,
    cancelled: 4,
    returned: 2,
    recent1h: 3,
    recent24h: 5,
    sameAddress24h: 2,
    exactDuplicate10m: false,
  };
  await createLandingOrder(validInput, repository, createDependencies());
  assert.equal(repository.insertedGraph?.order.riskLevel, "HIGH");
  assert.equal(repository.insertedGraph?.order.manualReviewRequired, true);
  assert.equal(repository.insertedGraph?.order.phoneVerifiedAt?.toISOString(), now.toISOString());
});

test("when phoneOtpRequired is false, an order can be created without phoneVerificationToken", async () => {
  const repository = new FakeRepository();
  const { phoneVerificationToken: _token, ...withoutToken } = validInput;
  const result = await createLandingOrder(
    withoutToken,
    repository,
    { ...createDependencies(), phoneOtpRequired: false },
  );
  assert.equal(result.created, true);
  assert.equal(repository.insertedGraph?.order.phoneVerificationChallengeId, null);
  assert.equal(repository.insertedGraph?.order.phoneVerifiedAt, null);
});

