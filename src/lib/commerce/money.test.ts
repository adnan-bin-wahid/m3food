import assert from "node:assert/strict";
import test from "node:test";
import { assertMinorAmount, multiplyMinorAmount } from "./money";

test("minor-unit multiplication stays exact", () => {
  assert.equal(multiplyMinorAmount(125_000, 3), 375_000);
});

test("negative and fractional minor-unit amounts are rejected", () => {
  assert.throws(() => assertMinorAmount(-1), RangeError);
  assert.throws(() => assertMinorAmount(10.5), RangeError);
});

test("invalid quantities are rejected", () => {
  assert.throws(() => multiplyMinorAmount(100, 0), RangeError);
  assert.throws(() => multiplyMinorAmount(100, 1.5), RangeError);
});
