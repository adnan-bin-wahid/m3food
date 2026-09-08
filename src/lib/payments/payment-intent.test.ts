import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePaymentSelection,
  paymentSelectionSchema,
  resolveInitialPaymentState,
} from "./payment-intent";
import { hashPaymentProviderPayload } from "./provider-adapter";

test("COD remains the backward-compatible default payment selection", () => {
  assert.deepEqual(normalizePaymentSelection(), {
    method: "COD",
  });

  assert.deepEqual(resolveInitialPaymentState(), {
    selection: { method: "COD" },
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    paymentIntentStatus: null,
    provider: null,
  });
});

test("online checkout creates a pending payment and an untrusted payment intent", () => {
  const selection = paymentSelectionSchema.parse({
    method: "ONLINE",
    provider: "SSL_COMMERZ",
  });

  assert.deepEqual(resolveInitialPaymentState(selection), {
    selection,
    paymentMethod: "ONLINE",
    paymentStatus: "PENDING",
    paymentIntentStatus: "CREATED",
    provider: "SSL_COMMERZ",
  });
});

test("unsupported payment providers fail closed", () => {
  assert.equal(
    paymentSelectionSchema.safeParse({
      method: "ONLINE",
      provider: "UNKNOWN",
    }).success,
    false,
  );
});

test("provider payload hashes are stable for replay protection", () => {
  const first = hashPaymentProviderPayload(
    "tran_id=abc&status=VALID",
  );
  const second = hashPaymentProviderPayload(
    "tran_id=abc&status=VALID",
  );
  const changed = hashPaymentProviderPayload(
    "tran_id=abc&status=FAILED",
  );

  assert.equal(first.length, 64);
  assert.equal(first, second);
  assert.notEqual(first, changed);
});
