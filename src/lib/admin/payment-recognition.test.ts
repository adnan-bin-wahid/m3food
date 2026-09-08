import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyFinancialPaymentRecognition,
  isFinancialSettlementResolved,
} from "./payment-recognition";

test("delivered revenue is financially settled only by PAID or REFUNDED", () => {
  assert.equal(
    classifyFinancialPaymentRecognition("DELIVERED", "PAID"),
    "PAID_DELIVERED",
  );
  assert.equal(
    classifyFinancialPaymentRecognition("DELIVERED", "REFUNDED"),
    "REFUNDED_DELIVERED",
  );

  for (const status of ["UNPAID", "PENDING", "FAILED"] as const) {
    assert.equal(
      classifyFinancialPaymentRecognition("DELIVERED", status),
      "UNSETTLED",
    );
  }
});

test("cancelled and returned orders require no outstanding paid or pending settlement", () => {
  for (const lifecycle of ["CANCELLED", "RETURNED"] as const) {
    for (const payment of ["UNPAID", "FAILED", "REFUNDED"] as const) {
      assert.equal(
        classifyFinancialPaymentRecognition(lifecycle, payment),
        "REVERSED_RESOLVED",
      );
    }

    for (const payment of ["PAID", "PENDING"] as const) {
      assert.equal(
        classifyFinancialPaymentRecognition(lifecycle, payment),
        "UNSETTLED",
      );
    }
  }
});

test("open order lifecycle is outside realized financial recognition", () => {
  for (const status of [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
  ] as const) {
    assert.equal(
      classifyFinancialPaymentRecognition(status, "PAID"),
      "OUTSIDE_FINANCIAL_LIFECYCLE",
    );
  }
});

test("resolved helper accepts only financially closed settlement outcomes", () => {
  assert.equal(isFinancialSettlementResolved("PAID_DELIVERED"), true);
  assert.equal(isFinancialSettlementResolved("REFUNDED_DELIVERED"), true);
  assert.equal(isFinancialSettlementResolved("REVERSED_RESOLVED"), true);
  assert.equal(isFinancialSettlementResolved("UNSETTLED"), false);
  assert.equal(
    isFinancialSettlementResolved("OUTSIDE_FINANCIAL_LIFECYCLE"),
    false,
  );
});
