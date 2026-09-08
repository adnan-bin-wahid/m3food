import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminPaymentSettlementRepository,
  AdminPaymentSettlementSnapshot,
  UpdatePaymentSettlementInput,
  UpdatePaymentSettlementResult,
} from "./payment-settlement-repository";
import {
  AdminPaymentSettlementError,
  canManagePaymentSettlement,
  getAdminPaymentSettlement,
  getAllowedPaymentTransitions,
  updateAdminPaymentSettlement,
} from "./payment-settlement-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

function snapshot(
  overrides: Partial<AdminPaymentSettlementSnapshot> = {},
): AdminPaymentSettlementSnapshot {
  return {
    orderId: "33333333-3333-4333-8333-333333333333",
    publicId: "ORD-TEST-001",
    orderPaymentStatus: "UNPAID",
    paymentId: "44444444-4444-4444-8444-444444444444",
    method: "COD",
    status: "UNPAID",
    amountMinor: 25000,
    currency: "BDT",
    providerReference: null,
    revision: 0,
    updatedAt: new Date("2026-09-08T10:00:00.000Z"),
    ...overrides,
  };
}

class FakeRepository
  implements AdminPaymentSettlementRepository
{
  current: AdminPaymentSettlementSnapshot | null = snapshot();
  updateResult: UpdatePaymentSettlementResult = {
    kind: "UPDATED",
    revision: 1,
    status: "PAID",
    providerReference: null,
  };
  updates: UpdatePaymentSettlementInput[] = [];

  async getSettlement() {
    return this.current;
  }

  async updateSettlement(input: UpdatePaymentSettlementInput) {
    this.updates.push(input);
    return this.updateResult;
  }
}

test("payment transition matrix preserves settlement lifecycle", () => {
  assert.deepEqual(getAllowedPaymentTransitions("UNPAID"), [
    "PENDING",
    "PAID",
    "FAILED",
  ]);
  assert.deepEqual(getAllowedPaymentTransitions("PENDING"), [
    "UNPAID",
    "PAID",
    "FAILED",
  ]);
  assert.deepEqual(getAllowedPaymentTransitions("FAILED"), [
    "UNPAID",
    "PENDING",
    "PAID",
  ]);
  assert.deepEqual(getAllowedPaymentTransitions("PAID"), [
    "REFUNDED",
  ]);
  assert.deepEqual(getAllowedPaymentTransitions("REFUNDED"), []);
});

test("OWNER ADMIN and ORDER_MANAGER may reconcile; ANALYST is read only", () => {
  assert.equal(canManagePaymentSettlement("OWNER"), true);
  assert.equal(canManagePaymentSettlement("ADMIN"), true);
  assert.equal(canManagePaymentSettlement("ORDER_MANAGER"), true);
  assert.equal(canManagePaymentSettlement("ANALYST"), false);
});

test("admin settlement view exposes transitions and consistency", async () => {
  const repository = new FakeRepository();
  const result = await getAdminPaymentSettlement(
    owner,
    "ORD-TEST-001",
    repository,
  );
  assert.ok(result);
  assert.equal(result.statusConsistent, true);
  assert.equal(result.canManage, true);
  assert.deepEqual(result.allowedTransitions, [
    "PENDING",
    "PAID",
    "FAILED",
  ]);

  repository.current = snapshot({ orderPaymentStatus: "PENDING" });
  const inconsistent = await getAdminPaymentSettlement(
    owner,
    "ORD-TEST-001",
    repository,
  );
  assert.equal(inconsistent?.statusConsistent, false);
});

test("analyst mutation is forbidden before repository access", async () => {
  const repository = new FakeRepository();
  const analyst = { ...owner, role: "ANALYST" as const };

  await assert.rejects(
    updateAdminPaymentSettlement(
      analyst,
      {
        publicId: "ORD-TEST-001",
        expectedRevision: 0,
        toStatus: "PAID",
      },
      repository,
    ),
    (error: unknown) =>
      error instanceof AdminPaymentSettlementError &&
      error.code === "FORBIDDEN",
  );
  assert.equal(repository.updates.length, 0);
});

test("stale revision fails closed", async () => {
  const repository = new FakeRepository();
  repository.current = snapshot({ revision: 4 });

  await assert.rejects(
    updateAdminPaymentSettlement(
      owner,
      {
        publicId: "ORD-TEST-001",
        expectedRevision: 3,
        toStatus: "PAID",
      },
      repository,
    ),
    (error: unknown) =>
      error instanceof AdminPaymentSettlementError &&
      error.code === "CONFLICT",
  );
  assert.equal(repository.updates.length, 0);
});

test("invalid transition is rejected without mutation", async () => {
  const repository = new FakeRepository();
  repository.current = snapshot({
    status: "PAID",
    orderPaymentStatus: "PAID",
    revision: 2,
  });

  await assert.rejects(
    updateAdminPaymentSettlement(
      owner,
      {
        publicId: "ORD-TEST-001",
        expectedRevision: 2,
        toStatus: "FAILED",
      },
      repository,
    ),
    (error: unknown) =>
      error instanceof AdminPaymentSettlementError &&
      error.code === "INVALID_TRANSITION",
  );
  assert.equal(repository.updates.length, 0);
});

test("valid transition normalizes optional reference and note", async () => {
  const repository = new FakeRepository();
  repository.updateResult = {
    kind: "UPDATED",
    revision: 1,
    status: "PAID",
    providerReference: "COD-7788",
  };

  const now = new Date("2026-09-08T12:00:00.000Z");
  const result = await updateAdminPaymentSettlement(
    owner,
    {
      publicId: "ORD-TEST-001",
      expectedRevision: 0,
      toStatus: "PAID",
      providerReference: "  COD-7788  ",
      note: "  Cash collected  ",
    },
    repository,
    now,
  );

  assert.equal(result.kind, "UPDATED");
  assert.equal(repository.updates.length, 1);
  assert.deepEqual(repository.updates[0], {
    storeId: owner.storeId,
    publicId: "ORD-TEST-001",
    expectedPaymentId: "44444444-4444-4444-8444-444444444444",
    expectedRevision: 0,
    expectedStatus: "UNPAID",
    toStatus: "PAID",
    providerReference: "COD-7788",
    note: "Cash collected",
    actor: { id: owner.id, email: owner.email },
    now,
  });
});

test("repository race conflict is surfaced", async () => {
  const repository = new FakeRepository();
  repository.updateResult = {
    kind: "CONFLICT",
    currentPaymentId: "44444444-4444-4444-8444-444444444444",
    currentRevision: 1,
    currentStatus: "PENDING",
  };

  await assert.rejects(
    updateAdminPaymentSettlement(
      owner,
      {
        publicId: "ORD-TEST-001",
        expectedRevision: 0,
        toStatus: "PAID",
      },
      repository,
    ),
    (error: unknown) =>
      error instanceof AdminPaymentSettlementError &&
      error.code === "CONFLICT",
  );
});
