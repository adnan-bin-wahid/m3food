import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCampaignUtmUrl,
  campaignCreateSchema,
  normalizeCampaignKey,
  resolveRegisteredCampaignAttribution,
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


test("a direct final session is still a real last touch", () => {
  const touches = selectFirstLastCampaignTouches([
    { sessionKey: "paid", startedAt: new Date("2026-09-01T10:00:00Z"), utmCampaign: "launch", utmSource: "facebook" },
    { sessionKey: "direct", startedAt: new Date("2026-09-02T10:00:00Z"), landingPage: "https://example.test/" },
  ]);
  assert.equal(touches.firstTouch?.sessionKey, "paid");
  assert.equal(touches.lastTouch?.sessionKey, "direct");
  assert.equal(touches.lastTouch?.campaign, null);
});

test("registered campaign attribution resolves known IDs without inventing unknown campaigns", () => {
  const resolved = resolveRegisteredCampaignAttribution(
    [
      { sessionKey: "first", startedAt: new Date("2026-09-01T10:00:00Z"), utmCampaign: " Launch Campaign ", utmSource: "facebook" },
      { sessionKey: "last", startedAt: new Date("2026-09-02T10:00:00Z"), utmCampaign: "unknown-campaign", utmSource: "facebook" },
    ],
    [{ id: "11111111-1111-4111-8111-111111111111", campaignKey: "launch-campaign" }],
  );
  assert.equal(resolved.firstTouchCampaignId, "11111111-1111-4111-8111-111111111111");
  assert.equal(resolved.lastTouchCampaignId, null);
  assert.equal(resolved.firstTouch?.campaign, " Launch Campaign ");
  assert.equal(resolved.lastTouch?.campaign, "unknown-campaign");
});
