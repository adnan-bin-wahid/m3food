import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  CURRENT_PRIVACY_POLICY_VERSION,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "./consent";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(ANALYTICS_CONSENT_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("the current analytics preference is stored with policy version", () => {
  const storage = memoryStorage();
  writeAnalyticsConsent(storage, "accepted");

  assert.equal(readAnalyticsConsent(storage), "accepted");
  assert.match(
    storage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) ?? "",
    new RegExp(CURRENT_PRIVACY_POLICY_VERSION),
  );
});

test("missing, stale and malformed preferences require a new choice", () => {
  assert.equal(readAnalyticsConsent(memoryStorage()), "unknown");
  assert.equal(readAnalyticsConsent(memoryStorage("not-json")), "unknown");
  assert.equal(
    readAnalyticsConsent(
      memoryStorage(
        JSON.stringify({ preference: "accepted", policyVersion: "old" }),
      ),
    ),
    "unknown",
  );
});

test("clearing the preference returns consent to unknown", () => {
  const storage = memoryStorage();
  writeAnalyticsConsent(storage, "declined");
  writeAnalyticsConsent(storage, "unknown");
  assert.equal(readAnalyticsConsent(storage), "unknown");
});
