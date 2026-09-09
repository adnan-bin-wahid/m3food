import assert from "node:assert/strict";
import test from "node:test";
import { assessOrderRisk } from "./order-risk";

const clean = {
  totalOrders: 0,
  delivered: 0,
  cancelled: 0,
  returned: 0,
  recent1h: 0,
  recent24h: 0,
  sameAddress24h: 0,
  exactDuplicate10m: false,
};

test("new verified customers start low risk", () => {
  const risk = assessOrderRisk(clean);
  assert.equal(risk.level, "LOW");
  assert.equal(risk.manualReviewRequired, false);
});

test("repeat activity becomes medium risk", () => {
  const risk = assessOrderRisk({
    ...clean,
    totalOrders: 2,
    recent1h: 1,
    recent24h: 2,
    sameAddress24h: 1,
  });
  assert.equal(risk.level, "MEDIUM");
  assert.equal(risk.manualReviewRequired, false);
  assert.ok(risk.reasons.length > 0);
});

test("bad history or burst ordering becomes high risk", () => {
  const risk = assessOrderRisk({
    ...clean,
    totalOrders: 8,
    delivered: 1,
    cancelled: 4,
    returned: 2,
    recent1h: 3,
    recent24h: 5,
    sameAddress24h: 2,
  });
  assert.equal(risk.level, "HIGH");
  assert.equal(risk.manualReviewRequired, true);
  assert.ok(risk.snapshot.failedOutcomeRate! >= 0.6);
});
