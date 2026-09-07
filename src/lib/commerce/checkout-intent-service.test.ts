import assert from "node:assert/strict";
import test from "node:test";
import type { CheckoutIntentRepository } from "./checkout-intent-repository";
import { captureCheckoutIntent, checkoutIntentInputSchema } from "./checkout-intent-service";

const base = {
  storeSlug: "m3food",
  intentKey: "checkout_intent_1234567890",
  productId: "11111111-1111-4111-8111-111111111111",
  variantId: "22222222-2222-4222-8222-222222222222",
  quantity: 1,
  contact: { phone: "01700000000", email: "person@example.com" },
  attribution: {
    visitorKey: "visitor_1234567890123456",
    sessionKey: "session_1234567890123456",
    utmSource: "facebook",
  },
  consent: {
    privacyPolicyVersion: "2026-09-07",
    privacyAcknowledged: true as const,
    emailMarketingAllowed: true,
    smsMarketingAllowed: false,
    whatsappMarketingAllowed: true,
  },
};

test("checkout recovery requires privacy acknowledgement and a consented matching contact method", () => {
  assert.equal(checkoutIntentInputSchema.safeParse({ ...base, contact: {} }).success, false);
  assert.equal(checkoutIntentInputSchema.safeParse({ ...base, consent: { ...base.consent, privacyAcknowledged: false } }).success, false);
  assert.equal(checkoutIntentInputSchema.safeParse({ ...base, consent: { ...base.consent, emailMarketingAllowed: false, smsMarketingAllowed: false, whatsappMarketingAllowed: false } }).success, false);
  assert.equal(checkoutIntentInputSchema.safeParse({ ...base, contact: { email: "person@example.com" }, consent: { ...base.consent, emailMarketingAllowed: false, smsMarketingAllowed: true, whatsappMarketingAllowed: false } }).success, false);
  assert.equal(checkoutIntentInputSchema.safeParse(base).success, true);
});

test("checkout intent capture passes bounded identity and channel consent to the repository", async () => {
  let called = false;
  const repository: CheckoutIntentRepository = {
    async upsertIntent(input) {
      called = true;
      assert.equal(input.storeSlug, "m3food");
      assert.equal(input.contact.phone, "01700000000");
      assert.equal(input.consent.whatsappMarketingAllowed, true);
      assert.equal(input.now.toISOString(), "2026-09-07T10:00:00.000Z");
      return { kind: "OK", updatedAt: input.now };
    },
  };
  const result = await captureCheckoutIntent(base, repository, new Date("2026-09-07T10:00:00.000Z"));
  assert.equal(called, true);
  assert.equal(result.kind, "OK");
});
