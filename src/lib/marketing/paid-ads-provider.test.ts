import assert from "node:assert/strict";
import test from "node:test";
import {
  decimalMajorToMinor,
  microsToMinor,
  parseProviderCount,
} from "./paid-ads-provider";

test("Meta-style decimal spend converts to minor units without floating point drift", () => {
  assert.equal(decimalMajorToMinor("1250.00"), 125000);
  assert.equal(decimalMajorToMinor("1.005"), 101);
  assert.equal(decimalMajorToMinor("0"), 0);
});

test("Google cost micros convert deterministically to two-decimal minor units", () => {
  assert.equal(microsToMinor("1250000000"), 125000);
  assert.equal(microsToMinor("10050"), 1);
  assert.equal(microsToMinor("15000"), 2);
});

test("provider counts reject negative, fractional and unsafe values", () => {
  assert.equal(parseProviderCount("10000"), 10000);
  assert.throws(() => parseProviderCount("-1"));
  assert.throws(() => parseProviderCount("1.5"));
});
