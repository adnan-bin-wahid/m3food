import assert from "node:assert/strict";
import test from "node:test";
import { buildSteadfastPayload, createSteadfastShipment, SteadfastError } from "./steadfast";

const order = {
  invoice: "ORD-20260907-ABC",
  recipientName: "Test Customer",
  recipientPhone: "01700000000",
  recipientAddress: "House 1, Khulna, Bangladesh",
  codAmountMinor: 125000,
  note: "Call first",
  itemDescription: "M3Food x 1",
  totalLot: 1,
};

test("Steadfast payload keeps COD amounts in currency units", () => {
  const payload = buildSteadfastPayload(order);
  assert.equal(payload.invoice, "ORD-20260907-ABC");
  assert.equal(payload.cod_amount, 1250);
  assert.equal(payload.delivery_type, 0);
});

test("Steadfast delivery fails closed when server credentials are absent", async () => {
  await assert.rejects(
    createSteadfastShipment(order, { STEADFAST_BASE_URL: "https://example.test/api/v1", STEADFAST_API_KEY: undefined, STEADFAST_SECRET_KEY: undefined }),
    (error) => error instanceof SteadfastError && error.code === "NOT_CONFIGURED",
  );
});

test("Steadfast response stores consignment and tracking identifiers", async () => {
  let body: any = null;
  const result = await createSteadfastShipment(order, {
    STEADFAST_BASE_URL: "https://example.test/api/v1",
    STEADFAST_API_KEY: "api-key",
    STEADFAST_SECRET_KEY: "secret-key",
  }, (async (_url: string | URL | Request, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ consignment: { consignment_id: 12345, tracking_code: "SFR123", status: "pending" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch);
  assert.equal(body.cod_amount, 1250);
  assert.equal(result.consignmentId, "12345");
  assert.equal(result.trackingCode, "SFR123");
  assert.equal(result.providerStatus, "pending");
});
