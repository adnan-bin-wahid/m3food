import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionOrder } from "./order-status";

test("the normal order lifecycle is allowed", () => {
  assert.equal(canTransitionOrder("PENDING", "CONFIRMED"), true);
  assert.equal(canTransitionOrder("CONFIRMED", "PROCESSING"), true);
  assert.equal(canTransitionOrder("PROCESSING", "SHIPPED"), true);
  assert.equal(canTransitionOrder("SHIPPED", "DELIVERED"), true);
});

test("terminal and backward transitions are rejected", () => {
  assert.equal(canTransitionOrder("DELIVERED", "PENDING"), false);
  assert.equal(canTransitionOrder("CANCELLED", "CONFIRMED"), false);
  assert.equal(canTransitionOrder("RETURNED", "SHIPPED"), false);
});
