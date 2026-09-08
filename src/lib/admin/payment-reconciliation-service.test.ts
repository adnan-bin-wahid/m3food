import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminPaymentReconciliationRepository,
  PaymentReconciliationCandidate,
} from "./payment-reconciliation-repository";
import {
  classifyPaymentReconciliationIssue,
  listAdminPaymentReconciliation,
  parseAdminPaymentReconciliationQuery,
} from "./payment-reconciliation-service";

const NOW = new Date("2026-09-08T12:00:00.000Z");

function identity(
  role: AdminIdentity["role"] = "OWNER",
): AdminIdentity {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "admin@example.com",
    displayName: "Admin",
    role,
    storeId: "22222222-2222-4222-8222-222222222222",
    storeSlug: "m3food",
  };
}

function candidate(
  overrides: Partial<PaymentReconciliationCandidate> = {},
): PaymentReconciliationCandidate {
  return {
    publicId: "M3-ORDER-1",
    customerName: "Customer One",
    customerPhone: "01700000000",
    orderStatus: "DELIVERED",
    orderPaymentMethod: "COD",
    orderPaymentStatus: "UNPAID",
    orderTotalMinor: 125000,
    currency: "BDT",
    timezone: "Asia/Dhaka",
    orderCreatedAt: new Date("2026-09-07T08:00:00.000Z"),
    orderUpdatedAt: new Date("2026-09-07T10:00:00.000Z"),
    paymentId: "33333333-3333-4333-8333-333333333333",
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    paymentAmountMinor: 125000,
    providerReference: null,
    paymentRevision: 0,
    paymentUpdatedAt: new Date("2026-09-07T10:00:00.000Z"),
    attentionSince: new Date("2026-09-07T10:00:00.000Z"),
    ...overrides,
  };
}

class FakeRepository
  implements AdminPaymentReconciliationRepository
{
  constructor(
    private readonly rows: PaymentReconciliationCandidate[],
  ) {}

  async listCandidates() {
    return this.rows;
  }
}

test("delivered unpaid order enters the reconciliation queue", () => {
  assert.equal(
    classifyPaymentReconciliationIssue(candidate()),
    "DELIVERED_UNSETTLED",
  );
});

test("cancelled paid order waits for refund reconciliation", () => {
  assert.equal(
    classifyPaymentReconciliationIssue(
      candidate({
        orderStatus: "CANCELLED",
        orderPaymentStatus: "PAID",
        paymentStatus: "PAID",
      }),
    ),
    "REVERSED_AWAITING_REFUND",
  );
});

test("order/latest-payment mismatch has integrity priority", () => {
  assert.equal(
    classifyPaymentReconciliationIssue(
      candidate({
        orderPaymentStatus: "PAID",
        paymentStatus: "UNPAID",
      }),
    ),
    "STATUS_MISMATCH",
  );
});

test("missing payment record is surfaced explicitly", () => {
  assert.equal(
    classifyPaymentReconciliationIssue(
      candidate({
        paymentId: null,
        paymentStatus: null,
        paymentMethod: null,
        paymentAmountMinor: null,
        paymentRevision: null,
        paymentUpdatedAt: null,
      }),
    ),
    "MISSING_PAYMENT",
  );
});

test("settled delivered order is excluded from reconciliation", () => {
  assert.equal(
    classifyPaymentReconciliationIssue(
      candidate({
        orderPaymentStatus: "PAID",
        paymentStatus: "PAID",
      }),
    ),
    null,
  );
});

test("query parsing fails closed to the default queue", () => {
  assert.deepEqual(
    parseAdminPaymentReconciliationQuery({
      q: "  abc  ",
      issue: "NOT_REAL",
      paymentStatus: "PAID",
      page: "2",
    }),
    {
      q: "",
      page: 1,
    },
  );
});

test("dashboard summary is global while filters affect the result set", async () => {
  const result = await listAdminPaymentReconciliation(
    identity(),
    {
      issue: "REVERSED_AWAITING_REFUND",
    },
    new FakeRepository([
      candidate({
        publicId: "M3-A",
        attentionSince: new Date("2026-09-07T00:00:00.000Z"),
      }),
      candidate({
        publicId: "M3-B",
        orderStatus: "RETURNED",
        orderPaymentStatus: "PENDING",
        paymentStatus: "PENDING",
        attentionSince: new Date("2026-09-08T08:00:00.000Z"),
      }),
    ]),
    NOW,
  );

  assert.equal(result.summary.totalUnresolved, 2);
  assert.equal(result.summary.deliveredUnsettled, 1);
  assert.equal(result.summary.reversedAwaitingRefund, 1);
  assert.equal(result.total, 1);
  assert.equal(result.rows[0]?.publicId, "M3-B");
  assert.equal(result.summary.oldestUnresolvedHours, 36);
});

test("search includes provider reference and customer identity", async () => {
  const result = await listAdminPaymentReconciliation(
    identity(),
    { q: "trx-777" },
    new FakeRepository([
      candidate({
        publicId: "M3-A",
        providerReference: "TRX-777",
      }),
      candidate({
        publicId: "M3-B",
        providerReference: "TRX-888",
      }),
    ]),
    NOW,
  );

  assert.equal(result.total, 1);
  assert.equal(result.rows[0]?.publicId, "M3-A");
});

test("analyst sees the queue but cannot reconcile", async () => {
  const result = await listAdminPaymentReconciliation(
    identity("ANALYST"),
    {},
    new FakeRepository([candidate()]),
    NOW,
  );

  assert.equal(result.rows.length, 1);
  assert.equal(result.canManage, false);
});
