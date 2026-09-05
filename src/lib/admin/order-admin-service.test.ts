import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type { AdminOrderRepository } from "./order-admin-repository";
import {
  AdminOrderError,
  canManageOrders,
  getAllowedOrderTransitions,
  getOrderInventoryEffect,
  parseAdminOrderQuery,
  transitionAdminOrder,
} from "./order-admin-service";

const owner: AdminIdentity = {
  id: "admin-1",
  storeId: "store-1",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

function repositoryWithTransition(
  transitionOrder: AdminOrderRepository["transitionOrder"],
): AdminOrderRepository {
  return {
    async listOrders() {
      return { orders: [], total: 0 };
    },
    async getOrderDetail() {
      return null;
    },
    transitionOrder,
  };
}

test("order filters are bounded and unknown values are ignored", () => {
  assert.deepEqual(parseAdminOrderQuery({ q: "  ORD-1  ", status: "PENDING", page: "2" }), {
    query: "ORD-1",
    status: "PENDING",
    page: 2,
    pageSize: 20,
  });
  assert.deepEqual(parseAdminOrderQuery({ status: "HACKED", page: "-10" }), {
    query: "",
    status: null,
    page: 1,
    pageSize: 20,
  });
});

test("only operational roles can mutate orders", () => {
  assert.equal(canManageOrders("OWNER"), true);
  assert.equal(canManageOrders("ADMIN"), true);
  assert.equal(canManageOrders("ORDER_MANAGER"), true);
  assert.equal(canManageOrders("ANALYST"), false);
});

test("the UI receives only valid forward lifecycle transitions", () => {
  assert.deepEqual(getAllowedOrderTransitions("PENDING"), ["CONFIRMED", "CANCELLED"]);
  assert.deepEqual(getAllowedOrderTransitions("DELIVERED"), ["RETURNED"]);
  assert.deepEqual(getAllowedOrderTransitions("CANCELLED"), []);
});

test("terminal fulfilment transitions have explicit inventory effects", () => {
  assert.equal(getOrderInventoryEffect("CONFIRMED"), "NONE");
  assert.equal(getOrderInventoryEffect("CANCELLED"), "RELEASE_RESERVATION");
  assert.equal(getOrderInventoryEffect("SHIPPED"), "COMMIT_RESERVATION");
  assert.equal(getOrderInventoryEffect("RETURNED"), "RESTOCK");
});

test("a valid transition is store scoped and carries an immutable actor snapshot", async () => {
  let received = null;
  const repository = repositoryWithTransition(async (input) => {
    received = input;
    return { kind: "UPDATED", publicId: input.publicId, status: input.toStatus };
  });
  const now = new Date("2026-09-04T14:00:00.000Z");
  const result = await transitionAdminOrder(
    owner,
    {
      publicId: "ORD-20260904-ABCDEF12",
      expectedStatus: "PENDING",
      toStatus: "CONFIRMED",
      note: "  Phone confirmed  ",
    },
    repository,
    now,
  );
  assert.equal(result.status, "CONFIRMED");
  assert.deepEqual(received, {
    storeId: "store-1",
    publicId: "ORD-20260904-ABCDEF12",
    expectedStatus: "PENDING",
    toStatus: "CONFIRMED",
    note: "Phone confirmed",
    actor: { id: "admin-1", email: "owner@example.com" },
    now,
  });
});

test("invalid, stale, unauthorized, and inventory-conflicting updates fail closed", async () => {
  const untouched = repositoryWithTransition(async () => {
    throw new Error("repository must not be called");
  });
  await assert.rejects(
    transitionAdminOrder(owner, {
      publicId: "ORD-20260904-ABCDEF12",
      expectedStatus: "PENDING",
      toStatus: "DELIVERED",
    }, untouched),
    (error: unknown) => error instanceof AdminOrderError && error.code === "INVALID_TRANSITION",
  );
  await assert.rejects(
    transitionAdminOrder({ ...owner, role: "ANALYST" }, {
      publicId: "ORD-20260904-ABCDEF12",
      expectedStatus: "PENDING",
      toStatus: "CONFIRMED",
    }, untouched),
    (error: unknown) => error instanceof AdminOrderError && error.code === "FORBIDDEN",
  );
  for (const [kind, code] of [
    ["CONFLICT", "STATUS_CONFLICT"],
    ["INVENTORY_CONFLICT", "INVENTORY_CONFLICT"],
  ] as const) {
    const repository = repositoryWithTransition(async () =>
      kind === "CONFLICT"
        ? { kind, currentStatus: "CONFIRMED" }
        : { kind },
    );
    await assert.rejects(
      transitionAdminOrder(owner, {
        publicId: "ORD-20260904-ABCDEF12",
        expectedStatus: "PENDING",
        toStatus: "CONFIRMED",
      }, repository),
      (error: unknown) => error instanceof AdminOrderError && error.code === code,
    );
  }
});
