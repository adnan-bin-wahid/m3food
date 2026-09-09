import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeBangladeshMobile,
  toBangladeshE164,
} from "./bd-phone";

test("Bangladesh mobile numbers normalize to one canonical local form", () => {
  assert.equal(normalizeBangladeshMobile("01712-345678"), "01712345678");
  assert.equal(normalizeBangladeshMobile("+880 1712 345678"), "01712345678");
  assert.equal(normalizeBangladeshMobile("8801712345678"), "01712345678");
  assert.equal(normalizeBangladeshMobile("০১৭১২৩৪৫৬৭৮"), "01712345678");
  assert.equal(toBangladeshE164("01712345678"), "+8801712345678");
});

test("invalid Bangladesh mobile numbers fail closed", () => {
  assert.throws(() => normalizeBangladeshMobile("1234567"));
  assert.throws(() => normalizeBangladeshMobile("01112345678"));
  assert.throws(() => normalizeBangladeshMobile("+441234567890"));
});
