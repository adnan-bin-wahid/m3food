import assert from "node:assert/strict";
import test from "node:test";
import { sendMetaCapiEvent } from "./meta-capi";

const environment = { META_CAPI_ACCESS_TOKEN: "token-secret", META_GRAPH_API_VERSION: "v99.0", META_CAPI_TEST_EVENT_CODE: undefined };

test("Meta CAPI never sends without consent or configuration", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response("{}", { status: 200 }); };
  assert.equal((await sendMetaCapiEvent({ pixelId: "123456789", analyticsAllowed: false, eventName: "PURCHASE", eventId: "ORD-1", occurredAt: new Date() }, environment, fetchImpl as typeof fetch)).reason, "CONSENT");
  assert.equal((await sendMetaCapiEvent({ pixelId: "", analyticsAllowed: true, eventName: "PURCHASE", eventId: "ORD-1", occurredAt: new Date() }, environment, fetchImpl as typeof fetch)).reason, "CONFIG");
  assert.equal(calls, 0);
});

test("Meta CAPI maps a purchase with shared event id and hashed identity", async () => {
  const captured: { request: { url: string; init: RequestInit } | null } = { request: null };
  const result = await sendMetaCapiEvent({
    pixelId: "123456789",
    analyticsAllowed: true,
    eventName: "PURCHASE",
    eventId: "ORD-20260907-ABC",
    occurredAt: new Date("2026-09-07T00:00:00Z"),
    pageUrl: "https://example.test/offer?fbclid=abc",
    clientIp: "203.0.113.10",
    userAgent: "test-agent",
    visitorKey: "visitor_1234567890123456",
    fbclid: "abc",
    email: "Person@Example.com",
    phone: "+880 1700 000000",
    valueMinor: 125000,
    currency: "BDT",
    contentId: "M3F-CMM-001",
    contentName: "Product",
    quantity: 1,
  }, environment, (async (url: string | URL | Request, init?: RequestInit) => {
    captured.request = { url: String(url), init: init ?? {} };
    return new Response('{"events_received":1}', { status: 200 });
  }) as typeof fetch);
  assert.equal(result.sent, true);
  assert.ok(captured.request);
  const request = captured.request;
  const body = JSON.parse(String(request.init.body));
  assert.equal(body.data[0].event_name, "Purchase");
  assert.equal(body.data[0].event_id, "ORD-20260907-ABC");
  assert.equal(body.data[0].custom_data.value, 1250);
  assert.equal(body.data[0].custom_data.currency, "BDT");
  assert.match(body.data[0].user_data.em[0], /^[a-f0-9]{64}$/);
  assert.match(body.data[0].user_data.ph[0], /^[a-f0-9]{64}$/);
});
