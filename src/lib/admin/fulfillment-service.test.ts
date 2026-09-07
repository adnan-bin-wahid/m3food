import assert from "node:assert/strict";
import test from "node:test";
import type { AdminFulfillmentRepository } from "./fulfillment-repository";
import { AdminFulfillmentError, submitOrderToSteadfast } from "./fulfillment-service";

const admin = { id: "admin-1", storeId: "store-1", storeSlug: "m3food", email: "owner@example.com", displayName: "Owner", role: "OWNER" as const };
const env = { STEADFAST_BASE_URL: "https://example.test/api/v1", STEADFAST_API_KEY: "key", STEADFAST_SECRET_KEY: "secret" };

function repo(overrides: Partial<AdminFulfillmentRepository> = {}): AdminFulfillmentRepository {
  return {
    async getOrderCandidate() {
      return { orderId: "order-1", publicId: "ORD-1", status: "CONFIRMED", currency: "BDT", totalMinor: 125000, customerName: "Test", customerPhone: "01700000000", addressLine1: "Khulna", addressLine2: null, area: null, district: "Khulna", note: null, itemDescription: "Product × 1", totalLot: 1, shipment: null };
    },
    async claimSubmission(input) { assert.equal(input.storeId, "store-1"); return "ACQUIRED"; },
    async markSubmitted(input) { assert.equal(input.trackingCode, "SFR-1"); },
    async markFailed() { throw new Error("should not fail"); },
    ...overrides,
  };
}

test("operational admins can submit one claimed Steadfast shipment", async () => {
  const result = await submitOrderToSteadfast(admin, "ORD-1", repo(), env, {
    now: () => new Date("2026-09-07T10:00:00Z"),
    createShipment: async () => ({ consignmentId: "123", trackingCode: "SFR-1", providerStatus: "pending", raw: { ok: true } }),
  });
  assert.equal(result.kind, "SUBMITTED");
});

test("a concurrent in-progress claim never calls the courier twice", async () => {
  let called = false;
  await assert.rejects(
    submitOrderToSteadfast(admin, "ORD-1", repo({ async claimSubmission() { return "BUSY"; } }), env, {
      createShipment: async () => { called = true; throw new Error("must not run"); },
    }),
    (error) => error instanceof AdminFulfillmentError && error.code === "IN_PROGRESS",
  );
  assert.equal(called, false);
});

test("submitted shipments are idempotently returned without a provider call", async () => {
  let called = false;
  const submitted = { id: "shipment-1", provider: "STEADFAST", status: "SUBMITTED", requestFingerprint: "f", consignmentId: "123", trackingCode: "SFR-1", providerStatus: "pending", lastError: null, submittedAt: new Date(), updatedAt: new Date() };
  const repository = repo({ async getOrderCandidate() { return { orderId: "order-1", publicId: "ORD-1", status: "CONFIRMED", currency: "BDT", totalMinor: 125000, customerName: "Test", customerPhone: "01700000000", addressLine1: "Khulna", addressLine2: null, area: null, district: "Khulna", note: null, itemDescription: "Product × 1", totalLot: 1, shipment: submitted }; } });
  const result = await submitOrderToSteadfast(admin, "ORD-1", repository, env, { createShipment: async () => { called = true; throw new Error("must not run"); } });
  assert.equal(result.kind, "ALREADY_SUBMITTED");
  assert.equal(called, false);
});

test("unconfirmed orders cannot be sent to Steadfast", async () => {
  await assert.rejects(
    submitOrderToSteadfast(admin, "ORD-1", repo({ async getOrderCandidate() { return { orderId: "order-1", publicId: "ORD-1", status: "PENDING", currency: "BDT", totalMinor: 125000, customerName: "Test", customerPhone: "01700000000", addressLine1: "Khulna", addressLine2: null, area: null, district: "Khulna", note: null, itemDescription: "Product × 1", totalLot: 1, shipment: null }; } }), env),
    (error) => error instanceof AdminFulfillmentError && error.code === "INVALID_ORDER",
  );
});
