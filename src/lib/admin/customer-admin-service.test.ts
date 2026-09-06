import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type { AdminCustomerRepository } from "./customer-admin-repository";
import {
  AdminCustomerError,
  addAdminCustomerNote,
  addAdminCustomerTag,
  canExportCustomerAudience,
  canManageCustomerOperations,
  customerNoteSchema,
  customerTagSchema,
  getAdminMarketingAudience,
  parseAdminCustomerQuery,
  removeAdminCustomerTag,
} from "./customer-admin-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

function repository(overrides: Partial<AdminCustomerRepository> = {}): AdminCustomerRepository {
  return {
    async listCustomers() { return null; },
    async getCustomer() { return null; },
    async addTag() { return { kind: "OK" }; },
    async removeTag() { return { kind: "OK" }; },
    async addNote() { return { kind: "OK" }; },
    async listMarketingAudience() { return []; },
    ...overrides,
  };
}

test("customer query parsing bounds filters and pagination", () => {
  assert.deepEqual(
    parseAdminCustomerQuery({ q: "  saleque  ", segment: "REPEAT", channel: "SMS", page: "3" }),
    { query: "saleque", segment: "REPEAT", channel: "SMS", page: 3, pageSize: 20 },
  );
  assert.equal(parseAdminCustomerQuery({ segment: "BAD", channel: "BAD", page: "-4" }).segment, "ALL");
  assert.equal(parseAdminCustomerQuery({ page: "-4" }).page, 1);
});

test("customer operational writes allow order managers but not analysts", () => {
  assert.equal(canManageCustomerOperations("OWNER"), true);
  assert.equal(canManageCustomerOperations("ADMIN"), true);
  assert.equal(canManageCustomerOperations("ORDER_MANAGER"), true);
  assert.equal(canManageCustomerOperations("ANALYST"), false);
});

test("marketing export is restricted to owner and admin", () => {
  assert.equal(canExportCustomerAudience("OWNER"), true);
  assert.equal(canExportCustomerAudience("ADMIN"), true);
  assert.equal(canExportCustomerAudience("ORDER_MANAGER"), false);
  assert.equal(canExportCustomerAudience("ANALYST"), false);
});

test("tags are normalized and notes are bounded", () => {
  assert.equal(customerTagSchema.parse("  VIP   Customer "), "vip customer");
  assert.equal(customerTagSchema.safeParse(" ").success, false);
  assert.equal(customerNoteSchema.safeParse("x".repeat(1001)).success, false);
});

test("customer tag mutation is store scoped and carries immutable actor identity", async () => {
  const capture: { value: Parameters<AdminCustomerRepository["addTag"]>[0] | null } = { value: null };
  await addAdminCustomerTag(
    owner,
    { customerId: "33333333-3333-4333-8333-333333333333", tag: " VIP " },
    repository({
      async addTag(input) {
        capture.value = input;
        return { kind: "OK" };
      },
    }),
    new Date("2026-09-07T00:00:00Z"),
  );
  assert.ok(capture.value);
  assert.equal(capture.value.storeId, owner.storeId);
  assert.equal(capture.value.tag, "vip");
  assert.deepEqual(capture.value.actor, { id: owner.id, email: owner.email });
});

test("analyst customer writes fail before repository mutation", async () => {
  let called = false;
  const analyst: AdminIdentity = { ...owner, role: "ANALYST" };
  await assert.rejects(
    () => addAdminCustomerNote(
      analyst,
      { customerId: "33333333-3333-4333-8333-333333333333", note: "Call tomorrow" },
      repository({ async addNote() { called = true; return { kind: "OK" }; } }),
    ),
    (error: unknown) => error instanceof AdminCustomerError && error.code === "FORBIDDEN",
  );
  assert.equal(called, false);
});

test("duplicate tags and missing removals fail closed", async () => {
  await assert.rejects(
    () => addAdminCustomerTag(
      owner,
      { customerId: "33333333-3333-4333-8333-333333333333", tag: "vip" },
      repository({ async addTag() { return { kind: "DUPLICATE" }; } }),
    ),
    (error: unknown) => error instanceof AdminCustomerError && error.code === "DUPLICATE",
  );
  await assert.rejects(
    () => removeAdminCustomerTag(
      owner,
      { customerId: "33333333-3333-4333-8333-333333333333", tag: "vip" },
      repository({ async removeTag() { return { kind: "NOT_FOUND" }; } }),
    ),
    (error: unknown) => error instanceof AdminCustomerError && error.code === "NOT_FOUND",
  );
});

test("order managers cannot export a consent audience", async () => {
  const orderManager: AdminIdentity = { ...owner, role: "ORDER_MANAGER" };
  await assert.rejects(
    () => getAdminMarketingAudience(orderManager, "EMAIL", repository()),
    (error: unknown) => error instanceof AdminCustomerError && error.code === "FORBIDDEN",
  );
});
