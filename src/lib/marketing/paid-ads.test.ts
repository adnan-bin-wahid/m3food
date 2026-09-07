import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePaidAdDelivery,
  paidAdAccountCreateSchema,
  paidAdDailyMetricUpsertSchema,
} from "./paid-ads";

test("paid ad account input normalizes currency and validates timezone", () => {
  const input = paidAdAccountCreateSchema.parse({
    provider: "META",
    externalAccountId: " act_123 ",
    name: " Main Meta ",
    currency: "bdt",
    timezone: "Asia/Dhaka",
  });

  assert.equal(input.externalAccountId, "act_123");
  assert.equal(input.name, "Main Meta");
  assert.equal(input.currency, "BDT");
});

test("daily paid delivery metrics reject malformed dates and negative values", () => {
  assert.throws(() =>
    paidAdDailyMetricUpsertSchema.parse({
      mappingId: "11111111-1111-4111-8111-111111111111",
      metricDate: "2026-02-30",
      spendMinor: 100,
      impressions: 10,
      clicks: 1,
    }),
  );

  assert.throws(() =>
    paidAdDailyMetricUpsertSchema.parse({
      mappingId: "11111111-1111-4111-8111-111111111111",
      metricDate: "2026-09-08",
      spendMinor: -1,
      impressions: 10,
      clicks: 1,
    }),
  );
});

test("paid delivery calculations are finite when impressions or clicks are zero", () => {
  const zero = calculatePaidAdDelivery({
    spendMinor: 5000,
    impressions: 0,
    clicks: 0,
  });
  assert.equal(zero.ctrPercent, 0);
  assert.equal(zero.cpcMinor, 0);
  assert.equal(zero.cpmMinor, 0);

  const normal = calculatePaidAdDelivery({
    spendMinor: 10000,
    impressions: 1000,
    clicks: 50,
  });
  assert.equal(normal.ctrPercent, 5);
  assert.equal(normal.cpcMinor, 200);
  assert.equal(normal.cpmMinor, 10000);
});
