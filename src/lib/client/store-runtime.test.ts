import assert from "node:assert/strict";
import test from "node:test";
import {
  getPublicStoreSlug,
  normalizePublicStoreSlug,
} from "./store-runtime";

test("public store slug is normalized for reusable client deployments", () => {
  assert.equal(normalizePublicStoreSlug("  client-store  "), "client-store");
  assert.equal(getPublicStoreSlug("another-client"), "another-client");
});

test("missing public store slug fails closed instead of silently selecting M3Food", () => {
  assert.throws(
    () => normalizePublicStoreSlug(undefined),
    /NEXT_PUBLIC_STORE_SLUG is required/,
  );
});

test("invalid or oversized public store slugs are rejected", () => {
  assert.throws(() => normalizePublicStoreSlug("Client Store"), /lowercase kebab-case/);
  assert.throws(() => normalizePublicStoreSlug("x".repeat(121)), /at most 120/);
});
