import assert from "node:assert/strict";
import test from "node:test";
import { deriveAttributionSource } from "./attribution";
import type { AttributionInput } from "./contracts";

const base: AttributionInput = {
  visitorKey: "visitor_1234567890",
  sessionKey: "session_1234567890",
};

test("explicit UTM source has the highest attribution priority", () => {
  assert.equal(
    deriveAttributionSource({ ...base, utmSource: "newsletter", fbclid: "fb" }),
    "newsletter",
  );
});

test("click IDs, referrer and direct traffic have deterministic fallbacks", () => {
  assert.equal(deriveAttributionSource({ ...base, fbclid: "fb" }), "facebook");
  assert.equal(deriveAttributionSource({ ...base, gclid: "google" }), "google");
  assert.equal(
    deriveAttributionSource({ ...base, referrer: "https://example.com" }),
    "referral",
  );
  assert.equal(deriveAttributionSource(base), "direct");
});
