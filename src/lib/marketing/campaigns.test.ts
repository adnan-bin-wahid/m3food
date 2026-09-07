import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCampaignUtmUrl,
  campaignCreateSchema,
  normalizeCampaignKey,
  selectFirstLastCampaignTouches,
} from "./campaigns";

test("campaign keys are stable lowercase UTM-safe identities", () => {
  assert.equal(normalizeCampaignKey(" Eid Sale / Meta 2026 "), "eid-sale-meta-2026");
  assert.equal(normalizeCampaignKey("Launch__One"), "launch-one");

  const parsed = campaignCreateSchema.parse({
    name: "Eid Sale",
    campaignKey: " Eid Sale ",
    source: " Facebook ",
    medium: " Paid Social ",
    content: "",
    term: "",
    landingUrl: "https://example.test/offer",
    notes: "",
    status: "ACTIVE",
  });

  assert.equal(parsed.campaignKey, "eid-sale");
  assert.equal(parsed.source, "facebook");
  assert.equal(parsed.medium, "paid-social");
  assert.equal(parsed.content, null);
});

test("UTM builder preserves unrelated query parameters and writes campaign dimensions", () => {
  const url = buildCampaignUtmUrl(
    "https://example.test/offer?coupon=SAVE",
    {
      campaignKey: "eid-sale",
      source: "facebook",
      medium: "paid-social",
      content: "video-01",
      term: null,
    },
  );

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("coupon"), "SAVE");
  assert.equal(parsed.searchParams.get("utm_source"), "facebook");
  assert.equal(parsed.searchParams.get("utm_medium"), "paid-social");
  assert.equal(parsed.searchParams.get("utm_campaign"), "eid-sale");
  assert.equal(parsed.searchParams.get("utm_content"), "video-01");
  assert.equal(parsed.searchParams.has("utm_term"), false);
});

test("first and last touch semantics are chronological and deterministic", () => {
  const touches = selectFirstLastCampaignTouches([
    {
      sessionKey: "session-3",
      startedAt: new Date("2026-09-07T12:00:00Z"),
      utmSource: "facebook",
      utmMedium: "paid-social",
      utmCampaign: "retargeting",
    },
    {
      sessionKey: "session-1",
      startedAt: new Date("2026-09-01T10:00:00Z"),
      utmSource: "facebook",
      utmMedium: "paid-social",
      utmCampaign: "launch",
    },
    {
      sessionKey: "session-2",
      startedAt: new Date("2026-09-04T10:00:00Z"),
      landingPage: "https://example.test/",
    },
  ]);

  assert.equal(touches.firstTouch?.campaign, "launch");
  assert.equal(touches.firstTouch?.sessionKey, "session-1");
  assert.equal(touches.lastTouch?.campaign, "retargeting");
  assert.equal(touches.lastTouch?.sessionKey, "session-3");
});
