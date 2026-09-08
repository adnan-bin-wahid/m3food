import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const page = read("app/admin/payments/page.js");
const shell = read("components/admin/AdminShell.js");
const orderPage = read("app/admin/orders/[publicId]/page.js");
const actions = read("app/admin/orders/actions.ts");
const repository = read(
  "src/lib/admin/payment-reconciliation-repository.ts",
);
const service = read(
  "src/lib/admin/payment-reconciliation-service.ts",
);
const dbRepository = read(
  "src/lib/db/admin-payment-reconciliation-repository.ts",
);
const tests = read(
  "src/lib/admin/payment-reconciliation-service.test.ts",
);
const docs = read(
  "docs/part-s-03-payment-reconciliation-dashboard.md",
);
const packageJson = read("package.json");
const s01Verifier = read("scripts/verify-part-s-01.mjs");
const s02Verifier = read("scripts/verify-part-s-02.mjs");

for (const token of [
  "DELIVERED_UNSETTLED",
  "REVERSED_AWAITING_REFUND",
  "STATUS_MISMATCH",
  "MISSING_PAYMENT",
]) {
  requireCondition(
    repository.includes(token) && service.includes(token),
    `Payment reconciliation issue contract missing ${token}.`,
  );
}

requireCondition(
  service.includes("classifyFinancialPaymentRecognition") &&
    service.includes("canManagePaymentSettlement") &&
    service.includes("PAYMENT_RECONCILIATION_PAGE_SIZE") &&
    service.includes("oldestUnresolvedHours"),
  "Payment reconciliation service is not reusing S01/S02 settlement truth.",
);

for (const token of [
  "left join lateral",
  "latest.created_at desc",
  "latest.id desc",
  "o.payment_status is distinct from p.status",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]) {
  requireCondition(
    dbRepository.includes(token),
    `Payment reconciliation DB query missing ${token}.`,
  );
}

for (const token of [
  "Payment reconciliation",
  "Delivered unresolved",
  "Refund outstanding",
  "Status mismatch",
  "Missing payment",
  "#payment-reconciliation",
  "Reconcile",
  "Analysts remain read-only",
]) {
  requireCondition(
    page.includes(token),
    `Payment reconciliation UI missing ${token}.`,
  );
}

requireCondition(
  shell.includes('href="/admin/payments"') &&
    shell.includes("Payments"),
  "Admin navigation does not expose payment reconciliation.",
);

requireCondition(
  orderPage.includes('id="payment-reconciliation"') &&
    actions.includes('revalidatePath("/admin/payments")'),
  "Existing S01 payment mutation path is not integrated with the S03 queue.",
);

for (const token of [
  "delivered unpaid order enters the reconciliation queue",
  "cancelled paid order waits for refund reconciliation",
  "order/latest-payment mismatch has integrity priority",
  "missing payment record is surfaced explicitly",
  "analyst sees the queue but cannot reconcile",
]) {
  requireCondition(
    tests.includes(token),
    `S03 tests missing ${token}.`,
  );
}

for (const token of [
  "S01 mutation path",
  "no duplicate payment mutation",
  "DELIVERED + UNPAID/PENDING/FAILED",
  "CANCELLED/RETURNED + PAID/PENDING",
  "No `0020` migration",
]) {
  requireCondition(
    docs.includes(token),
    `S03 documentation missing ${token}.`,
  );
}

requireCondition(
  packageJson.includes('"verify:part-s-03"') &&
    packageJson.includes('"db:verify:part-s-03"') &&
    (packageJson.includes(
      "npm run verify:part-s-01 && npm run verify:part-s-02 && npm run verify:part-s-03 && npm run test:domain",
    ) ||
      packageJson.includes(
        "npm run verify:part-s-01 && npm run verify:part-s-02 && npm run verify:part-s-03 && npm run verify:part-t-01 && npm run test:domain",
      )),
  "package.json S03 verification wiring is incomplete.",
);

requireCondition(
  s01Verifier.includes("verify:part-s-03") &&
    s02Verifier.includes("verify:part-s-03"),
  "S01/S02 static verifiers are not forward-compatible with S03.",
);

const migration19 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0019_.*\.sql$/.test(name));

requireCondition(
  migration19.length === 1,
  `Expected exactly one 0019 migration; found ${migration19.length}.`,
);

const migration20 = fs
  .readdirSync(path.join(root, "drizzle"))
  .filter((name) => /^0020_.*\.sql$/.test(name));

requireCondition(
  migration20.length === 0 ||
    (migration20.length === 1 &&
      packageJson.includes('"verify:part-t-01"')),
  "Unexpected 0020 migration exists without Part T T01 wiring.",
);

console.log(
  "PART S BATCH 03 PAYMENT RECONCILIATION DASHBOARD VERIFIED",
);
console.log("Dedicated unresolved settlement queue: present");
console.log(
  "Delivered-unsettled and reversed-refund exceptions: present",
);
console.log(
  "Latest-payment/order integrity exceptions: present",
);
console.log(
  "Existing S01 revision-protected mutation path: reused",
);
console.log(
  "OWNER/ADMIN/ORDER_MANAGER write boundary; ANALYST read-only: preserved",
);
console.log("Payment reconciliation navigation: present");
console.log("0019 migration head: preserved");
console.log("0020 migration: absent or later Part T T01 migration tolerated");
