import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminOrderProfitabilityRepository,
  AdminOrderProfitabilitySnapshot,
} from "./order-profitability-repository";
import {
  AdminOrderProfitabilityError,
  canManageOrderCosts,
  parseOptionalOrderCostToMinor,
  summarizeOrderProfitability,
  updateAdminOrderFulfillmentCost,
} from "./order-profitability-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

const delivered: AdminOrderProfitabilitySnapshot = {
  orderId: "33333333-3333-4333-8333-333333333333",
  publicId: "ORD-20260908-TEST0001",
  status: "DELIVERED",
  currency: "BDT",
  revenueMinor: 250_00,
  fulfillmentCostMinor: 80_00,
  fulfillmentCostRevision: 2,
  items: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      productName: "Product",
      sku: "SKU-1",
      quantity: 2,
      totalCostMinor: 140_00,
    },
  ],
};

function repository(
  overrides: Partial<AdminOrderProfitabilityRepository> = {},
): AdminOrderProfitabilityRepository {
  return {
    async getProfitability() {
      return delivered;
    },
    async updateFulfillmentCost() {
      return { kind: "UPDATED", revision: 3 };
    },
    ...overrides,
  };
}

test("order cost writes allow operational roles but not analysts", () => {
  assert.equal(canManageOrderCosts("OWNER"), true);
  assert.equal(canManageOrderCosts("ADMIN"), true);
  assert.equal(canManageOrderCosts("ORDER_MANAGER"), true);
  assert.equal(canManageOrderCosts("ANALYST"), false);
});

test("fulfillment money parsing keeps unknown distinct from explicit zero", () => {
  assert.equal(parseOptionalOrderCostToMinor(""), null);
  assert.equal(parseOptionalOrderCostToMinor("0"), 0);
  assert.equal(parseOptionalOrderCostToMinor("80.50"), 8050);
  assert.equal(Number.isNaN(parseOptionalOrderCostToMinor("-1")), true);
  assert.equal(Number.isNaN(parseOptionalOrderCostToMinor("1.234")), true);
});

test("delivered order recognizes contribution from first-party revenue minus immutable costs", () => {
  const summary = summarizeOrderProfitability(delivered);

  assert.equal(summary.cogsMinor, 140_00);
  assert.equal(summary.grossProfitMinor, 110_00);
  assert.equal(summary.projectedContributionMinor, 30_00);
  assert.equal(summary.recognizedContributionMinor, 30_00);
  assert.equal(summary.projectedMarginPercent, 12);
  assert.equal(summary.recognizedMarginPercent, 12);
  assert.equal(summary.recognition, "REALIZED");
});

test("unknown item COGS never becomes zero profit cost", () => {
  const summary = summarizeOrderProfitability({
    ...delivered,
    items: [
      {
        ...delivered.items[0]!,
        totalCostMinor: null,
      },
    ],
  });

  assert.equal(summary.cogsMinor, null);
  assert.equal(summary.grossProfitMinor, null);
  assert.equal(summary.projectedContributionMinor, null);
  assert.equal(summary.recognizedContributionMinor, null);
  assert.equal(summary.itemCostsComplete, false);
});

test("open orders are provisional even when all costs are known", () => {
  const summary = summarizeOrderProfitability({
    ...delivered,
    status: "SHIPPED",
  });

  assert.equal(summary.projectedContributionMinor, 30_00);
  assert.equal(summary.recognizedContributionMinor, null);
  assert.equal(summary.recognition, "PROVISIONAL");
});

test("cancelled and returned orders reverse revenue and recognize recorded fulfillment loss", () => {
  for (const status of ["CANCELLED", "RETURNED"] as const) {
    const summary = summarizeOrderProfitability({
      ...delivered,
      status,
    });

    assert.equal(summary.recognizedContributionMinor, -80_00);
    assert.equal(summary.recognition, "REVERSED");
  }
});

test("fulfillment cost mutation is store scoped, optimistic and audited by actor input", async () => {
  const captured: Array<
    Parameters<
      AdminOrderProfitabilityRepository["updateFulfillmentCost"]
    >[0]
  > = [];

  const result = await updateAdminOrderFulfillmentCost(
    owner,
    {
      publicId: delivered.publicId,
      expectedRevision: 2,
      fulfillmentCostMinor: 80_00,
    },
    repository({
      async updateFulfillmentCost(input) {
        captured.push(input);
        return { kind: "UPDATED", revision: 3 };
      },
    }),
    new Date("2026-09-08T04:00:00.000Z"),
  );

  assert.equal(result.revision, 3);

  const mutation = captured[0];

  assert.ok(mutation);
  assert.equal(mutation.storeId, owner.storeId);
  assert.equal(mutation.fulfillmentCostMinor, 80_00);
  assert.deepEqual(mutation.actor, {
    id: owner.id,
    email: owner.email,
  });
});

test("analyst and stale writes fail closed", async () => {
  let called = false;

  await assert.rejects(
    () =>
      updateAdminOrderFulfillmentCost(
        { ...owner, role: "ANALYST" },
        {
          publicId: delivered.publicId,
          expectedRevision: 2,
          fulfillmentCostMinor: 80_00,
        },
        repository({
          async updateFulfillmentCost() {
            called = true;
            return { kind: "UPDATED", revision: 3 };
          },
        }),
      ),
    (error: unknown) =>
      error instanceof AdminOrderProfitabilityError &&
      error.code === "FORBIDDEN",
  );

  assert.equal(called, false);

  await assert.rejects(
    () =>
      updateAdminOrderFulfillmentCost(
        owner,
        {
          publicId: delivered.publicId,
          expectedRevision: 2,
          fulfillmentCostMinor: 80_00,
        },
        repository({
          async updateFulfillmentCost() {
            return { kind: "CONFLICT", currentRevision: 3 };
          },
        }),
      ),
    (error: unknown) =>
      error instanceof AdminOrderProfitabilityError &&
      error.code === "CONFLICT",
  );
});
