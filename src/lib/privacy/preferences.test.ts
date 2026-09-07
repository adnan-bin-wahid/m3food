import assert from "node:assert/strict";
import test from "node:test";
import type { MarketingPreferenceRepository } from "./preferences";
import {
  createMarketingPreferenceToken,
  parseMarketingPreferenceToken,
  updateMarketingPreference,
} from "./preferences";

const secret = "this-is-a-long-server-only-rate-limit-secret-123456";
const identity = {
  storeId: "11111111-1111-4111-8111-111111111111",
  customerId: "22222222-2222-4222-8222-222222222222",
};

test("preference tokens are signed and reject tampering", () => {
  const token = createMarketingPreferenceToken(identity, secret);
  assert.deepEqual(parseMarketingPreferenceToken(token, secret), identity);
  assert.equal(parseMarketingPreferenceToken(`${token}x`, secret), null);
  assert.equal(parseMarketingPreferenceToken(token, `${secret}x`), null);
});

test("self-service preference updates are store and customer scoped", async () => {
  let updated = false;
  const repository: MarketingPreferenceRepository = {
    async getPreference() { return null; },
    async updatePreference(input) {
      updated = true;
      assert.equal(input.storeId, identity.storeId);
      assert.equal(input.customerId, identity.customerId);
      assert.equal(input.whatsappMarketingAllowed, false);
      return {
        ...identity,
        storeName: "M3Food",
        customerName: "Test",
        email: "test@example.com",
        phone: "01700000000",
        emailMarketingAllowed: true,
        smsMarketingAllowed: false,
        whatsappMarketingAllowed: false,
        privacyPolicyVersion: input.privacyPolicyVersion,
        updatedAt: input.now,
      };
    },
  };
  const token = createMarketingPreferenceToken(identity, secret);
  const result = await updateMarketingPreference(token, {
    emailMarketingAllowed: true,
    smsMarketingAllowed: false,
    whatsappMarketingAllowed: false,
    privacyPolicyVersion: "2026-09-07",
  }, secret, repository, new Date("2026-09-07T10:00:00Z"));
  assert.equal(updated, true);
  assert.equal(result?.emailMarketingAllowed, true);
});
