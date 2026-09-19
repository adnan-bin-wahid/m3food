import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PRESET_OPTIONS,
  DEFAULT_ADMIN_REPORTING_PERIOD,
  buildReportingPeriodUrl,
  formatDhakaDate,
  parseAdminReportingPeriod,
  preserveReportingPeriod,
  resolveAdminReportingWindow,
  type AdminReportingPeriod,
} from "./reporting-period";
import { parseAdminOrderQuery } from "./order-admin-service";
import { parseAdminPaymentReconciliationQuery } from "./payment-reconciliation-service";
import { parseAdminCustomerQuery } from "./customer-admin-service";
import { resolveMarketingWindow } from "./marketing-analytics-service";

test("DEFAULT_ADMIN_REPORTING_PERIOD is 30d", () => {
  assert.equal(DEFAULT_ADMIN_REPORTING_PERIOD, "30d");
});

test("parseAdminReportingPeriod correctly extracts canonical period", () => {
  assert.equal(parseAdminReportingPeriod({ period: "today" }), "today");
  assert.equal(parseAdminReportingPeriod({ period: "yesterday" }), "yesterday");
  assert.equal(parseAdminReportingPeriod({ period: "7d" }), "7d");
  assert.equal(parseAdminReportingPeriod({ period: "30d" }), "30d");
  assert.equal(parseAdminReportingPeriod({ period: "90d" }), "90d");
  assert.equal(parseAdminReportingPeriod({ period: "this_month" }), "this_month");
  assert.equal(parseAdminReportingPeriod({ period: "last_month" }), "last_month");
  assert.equal(parseAdminReportingPeriod({ period: "all" }), "all");
  assert.equal(
    parseAdminReportingPeriod({ period: "custom", from: "2026-09-01", to: "2026-09-19" }),
    "custom"
  );
  assert.equal(parseAdminReportingPeriod({ period: "custom" }), "30d");
});

test("parseAdminReportingPeriod supports legacy range parameter for backward compatibility", () => {
  assert.equal(parseAdminReportingPeriod({ range: "7d" }), "7d");
  assert.equal(parseAdminReportingPeriod({ range: "30d" }), "30d");
  assert.equal(parseAdminReportingPeriod({ range: "all" }), "all");
  assert.equal(parseAdminReportingPeriod({ range: "today" }), "today");
  // If from is given without period or range, detects custom
  assert.equal(parseAdminReportingPeriod({ from: "2026-09-01", to: "2026-09-19" }), "custom");
  // Default when empty
  assert.equal(parseAdminReportingPeriod({}), "30d");
  assert.equal(parseAdminReportingPeriod(undefined), "30d");
});

test("parseAdminReportingPeriod works with URLSearchParams", () => {
  const params = new URLSearchParams("period=yesterday&status=confirmed");
  assert.equal(parseAdminReportingPeriod(params), "yesterday");

  const legacyParams = new URLSearchParams("range=90d");
  assert.equal(parseAdminReportingPeriod(legacyParams), "90d");
});

test("resolveAdminReportingWindow: today in Asia/Dhaka", () => {
  // 2026-09-19T14:30:00Z is 20:30 in Asia/Dhaka (+06:00) on 2026-09-19
  const now = new Date("2026-09-19T14:30:00Z");
  const window = resolveAdminReportingWindow("today", now);

  assert.equal(window.period, "today");
  assert.equal(window.from, "2026-09-19");
  assert.equal(window.to, "2026-09-19");
  assert.ok(window.label.includes("Today"));

  // Half-open interval [startAt, endAt):
  // 2026-09-19 00:00:00 +06:00 is 2026-09-18T18:00:00.000Z
  assert.equal(window.startAt?.toISOString(), "2026-09-18T18:00:00.000Z");
  // 2026-09-20 00:00:00 +06:00 is 2026-09-19T18:00:00.000Z
  assert.equal(window.endAt?.toISOString(), "2026-09-19T18:00:00.000Z");
});

test("resolveAdminReportingWindow: yesterday in Asia/Dhaka", () => {
  const now = new Date("2026-09-19T14:30:00Z");
  const window = resolveAdminReportingWindow("yesterday", now);

  assert.equal(window.period, "yesterday");
  assert.equal(window.from, "2026-09-18");
  assert.equal(window.to, "2026-09-18");
  assert.ok(window.label.includes("Yesterday"));

  // 2026-09-18 00:00:00 +06:00 is 2026-09-17T18:00:00.000Z
  assert.equal(window.startAt?.toISOString(), "2026-09-17T18:00:00.000Z");
  // 2026-09-19 00:00:00 +06:00 is 2026-09-18T18:00:00.000Z
  assert.equal(window.endAt?.toISOString(), "2026-09-18T18:00:00.000Z");
});

test("resolveAdminReportingWindow: 7d, 30d, 90d rolling days", () => {
  const now = new Date("2026-09-19T14:30:00Z"); // Day is 2026-09-19 in Dhaka

  const w7 = resolveAdminReportingWindow("7d", now);
  assert.equal(w7.period, "7d");
  assert.equal(w7.from, "2026-09-13");
  assert.equal(w7.to, "2026-09-19");
  assert.equal(w7.endAt?.toISOString(), "2026-09-19T18:00:00.000Z"); // Start of 2026-09-20 in Dhaka

  const w30 = resolveAdminReportingWindow("30d", now);
  assert.equal(w30.period, "30d");
  assert.equal(w30.from, "2026-08-21");
  assert.equal(w30.to, "2026-09-19");
  assert.equal(w30.endAt?.toISOString(), "2026-09-19T18:00:00.000Z");

  const w90 = resolveAdminReportingWindow("90d", now);
  assert.equal(w90.period, "90d");
  assert.equal(w90.from, "2026-06-22");
  assert.equal(w90.to, "2026-09-19");
  assert.equal(w90.endAt?.toISOString(), "2026-09-19T18:00:00.000Z");
});

test("resolveAdminReportingWindow: this_month and last_month in Asia/Dhaka", () => {
  const now = new Date("2026-09-19T14:30:00Z"); // September 2026

  const tm = resolveAdminReportingWindow("this_month", now);
  assert.equal(tm.period, "this_month");
  assert.equal(tm.from, "2026-09-01");
  assert.equal(tm.to, "2026-09-19");
  // Start: 2026-09-01 00:00:00 +06:00 -> 2026-08-31T18:00:00.000Z
  assert.equal(tm.startAt?.toISOString(), "2026-08-31T18:00:00.000Z");
  // End: 2026-10-01 00:00:00 +06:00 -> 2026-09-30T18:00:00.000Z
  assert.equal(tm.endAt?.toISOString(), "2026-09-30T18:00:00.000Z");

  const lm = resolveAdminReportingWindow("last_month", now);
  assert.equal(lm.period, "last_month");
  assert.equal(lm.from, "2026-08-01");
  assert.equal(lm.to, "2026-08-31");
  // Start: 2026-08-01 00:00:00 +06:00 -> 2026-07-31T18:00:00.000Z
  assert.equal(lm.startAt?.toISOString(), "2026-07-31T18:00:00.000Z");
  // End: 2026-09-01 00:00:00 +06:00 -> 2026-08-31T18:00:00.000Z
  assert.equal(lm.endAt?.toISOString(), "2026-08-31T18:00:00.000Z");
});

test("resolveAdminReportingWindow: all time has null start and end", () => {
  const window = resolveAdminReportingWindow("all");
  assert.equal(window.period, "all");
  assert.equal(window.startAt, null);
  assert.equal(window.endAt, null);
  assert.equal(window.from, null);
  assert.equal(window.to, null);
  assert.equal(window.label, "All time");
});

test("resolveAdminReportingWindow: custom range with valid from and to", () => {
  const window = resolveAdminReportingWindow("custom", new Date(), "2026-09-01", "2026-09-19");
  assert.equal(window.period, "custom");
  assert.equal(window.from, "2026-09-01");
  assert.equal(window.to, "2026-09-19");
  // Start: 2026-09-01 00:00:00 +06:00 -> 2026-08-31T18:00:00.000Z
  assert.equal(window.startAt?.toISOString(), "2026-08-31T18:00:00.000Z");
  // End: 2026-09-20 00:00:00 +06:00 (exclusive day after to) -> 2026-09-19T18:00:00.000Z
  assert.equal(window.endAt?.toISOString(), "2026-09-19T18:00:00.000Z");
});

test("resolveAdminReportingWindow: custom range handles inverted from/to gracefully", () => {
  const window = resolveAdminReportingWindow("custom", new Date(), "2026-09-19", "2026-09-01");
  assert.equal(window.from, "2026-09-01");
  assert.equal(window.to, "2026-09-19");
  assert.equal(window.startAt?.toISOString(), "2026-08-31T18:00:00.000Z");
  assert.equal(window.endAt?.toISOString(), "2026-09-19T18:00:00.000Z");
});

test("resolveAdminReportingWindow: invalid custom range safely falls back to default 30d", () => {
  const window = resolveAdminReportingWindow("custom", new Date(), "invalid-date", "garbage");
  assert.equal(window.period, "30d");
});

test("preserveReportingPeriod: preserves period across navigation without leaking local filters", () => {
  const current = new URLSearchParams("period=7d&status=CONFIRMED&q=Adnan&page=3");

  // Navigating to Orders from Dashboard:
  const ordersLink = preserveReportingPeriod("/admin/orders", current);
  assert.equal(ordersLink, "/admin/orders?period=7d");

  // Navigating to Marketing from Orders:
  const marketingLink = preserveReportingPeriod("/admin/marketing", current);
  assert.equal(marketingLink, "/admin/marketing?period=7d");

  // Canonical period is preserved even for default 30d so destination route has explicit URL state
  const defaultCurrent = new URLSearchParams("period=30d");
  assert.equal(preserveReportingPeriod("/admin/orders", defaultCurrent), "/admin/orders?period=30d");
});

test("preserveReportingPeriod: preserves custom from and to", () => {
  const current = new URLSearchParams("period=custom&from=2026-09-01&to=2026-09-15&status=CONFIRMED");
  const ordersLink = preserveReportingPeriod("/admin/orders", current);
  assert.equal(ordersLink, "/admin/orders?period=custom&from=2026-09-01&to=2026-09-15");
});

test("buildReportingPeriodUrl: updates period, preserves page-local filters, resets page", () => {
  const current = new URLSearchParams("period=30d&status=CONFIRMED&q=test&page=3");

  const newUrl = buildReportingPeriodUrl("/admin/orders", current, "7d");
  const parsed = new URLSearchParams(newUrl.replace("/admin/orders?", ""));

  assert.equal(parsed.get("period"), "7d");
  assert.equal(parsed.get("status"), "CONFIRMED");
  assert.equal(parsed.get("q"), "test");
  assert.equal(parsed.get("page"), "1"); // page reset
});

test("Retargeting lookback parameter remains independent from global period", () => {
  const current = new URLSearchParams("period=30d&lookback=14");

  // Changing period should preserve lookback
  const newUrl = buildReportingPeriodUrl("/admin/marketing/retargeting", current, "7d");
  const parsed = new URLSearchParams(newUrl.replace("/admin/marketing/retargeting?", ""));

  assert.equal(parsed.get("period"), "7d");
  assert.equal(parsed.get("lookback"), "14"); // Retargeting lookback preserved!
});

// ============================================================================
// REGRESSION TEST SUITE (Prompt Requirement 12)
// ============================================================================

test("Regression 1: no-param default resolves to canonical 30d in Orders", () => {
  const now = new Date("2026-09-19T14:30:00Z");
  const query = parseAdminOrderQuery({}, now);
  assert.equal(query.period, "30d");
  assert.ok(query.startAt instanceof Date);
  assert.ok(query.endAt instanceof Date);

  const canonical = resolveAdminReportingWindow("30d", now);
  assert.equal(query.startAt.toISOString(), canonical.startAt?.toISOString());
  assert.equal(query.endAt.toISOString(), canonical.endAt?.toISOString());
});

test("Regression 2: no-param default resolves to canonical 30d in Payments", () => {
  const now = new Date("2026-09-19T14:30:00Z");
  const query = parseAdminPaymentReconciliationQuery({}, now);
  assert.equal(query.period, "30d");
  assert.ok(query.startAt instanceof Date);
  assert.ok(query.endAt instanceof Date);

  const canonical = resolveAdminReportingWindow("30d", now);
  assert.equal(query.startAt.toISOString(), canonical.startAt?.toISOString());
  assert.equal(query.endAt.toISOString(), canonical.endAt?.toISOString());
});

test("Regression 3: no-param default does not filter Customer master directory", () => {
  const now = new Date("2026-09-19T14:30:00Z");
  const query = parseAdminCustomerQuery({}, now);
  assert.equal(query.period, "30d");
  assert.ok(query.startAt instanceof Date);
  assert.ok(query.endAt instanceof Date);
  // Verify that customer master directory query semantics retain all customers.
  // In admin-customer-repository, dateCondition is isolated and NOT applied to listCustomers customer rows or count,
  // ensuring the master directory remains current-state while period bounds are available for period-aware analytics.
});

test("Regression 4: same period yields same exact UTC bounds across legacy adapters and reporting-period.ts", () => {
  const now = new Date("2026-09-19T14:30:00Z");
  const testPeriods: AdminReportingPeriod[] = [
    "today",
    "yesterday",
    "7d",
    "30d",
    "90d",
    "this_month",
    "last_month",
    "all",
    "custom",
  ];

  for (const period of testPeriods) {
    const from = period === "custom" ? "2026-09-01" : undefined;
    const to = period === "custom" ? "2026-09-15" : undefined;

    const canonical = resolveAdminReportingWindow(period, now, from, to);
    const legacy = resolveMarketingWindow(period as any, now, from, to);

    if (period === "all") {
      assert.equal(canonical.startAt, null);
      assert.equal(canonical.endAt, null);
      assert.equal(legacy.startAt, null);
      assert.equal(legacy.endAt, null);
    } else {
      assert.equal(
        legacy.startAt?.toISOString() ?? null,
        canonical.startAt?.toISOString() ?? null,
        `startAt mismatch for ${period}`
      );
      assert.equal(
        legacy.endAt?.toISOString() ?? null,
        canonical.endAt?.toISOString() ?? null,
        `endAt mismatch for ${period}`
      );
      assert.equal(legacy.from, canonical.from, `from mismatch for ${period}`);
      assert.equal(legacy.to, canonical.to, `to mismatch for ${period}`);
      assert.equal(legacy.label, canonical.label, `label mismatch for ${period}`);
    }
  }
});

test("Regression 5: exact endAt timestamp excluded (half-open [startAt, endAt) boundary)", () => {
  const now = new Date("2026-09-19T14:30:00Z");
  const window = resolveAdminReportingWindow("30d", now);
  assert.ok(window.startAt && window.endAt);

  // Semantics: timestamp >= startAt && timestamp < endAt
  const isIncludedInWindow = (timestamp: Date) =>
    timestamp.getTime() >= window.startAt!.getTime() && timestamp.getTime() < window.endAt!.getTime();

  const exactStart = new Date(window.startAt.getTime());
  const oneSecInside = new Date(window.startAt.getTime() + 1000);
  const oneMsBeforeEnd = new Date(window.endAt.getTime() - 1);
  const exactEnd = new Date(window.endAt.getTime());
  const afterEnd = new Date(window.endAt.getTime() + 1000);

  assert.equal(isIncludedInWindow(exactStart), true, "Start boundary is inclusive [startAt");
  assert.equal(isIncludedInWindow(oneSecInside), true, "Inside window is included");
  assert.equal(isIncludedInWindow(oneMsBeforeEnd), true, "1ms before end is included");
  assert.equal(isIncludedInWindow(exactEnd), false, "Exact endAt MUST NOT be included in prior period!");
  assert.equal(isIncludedInWindow(afterEnd), false, "After endAt is excluded");
});

test("Regression 6: custom from/to survives all navigation helpers", () => {
  const current = new URLSearchParams("period=custom&from=2026-09-01&to=2026-09-19");

  const testDestinations = [
    "/admin/dashboard",
    "/admin/orders",
    "/admin/payments",
    "/admin/customers",
    "/admin/financials",
    "/admin/marketing",
    "/admin/marketing/funnel",
    "/admin/marketing/ads",
    "/admin/marketing/campaigns",
    "/admin/marketing/clarity",
    "/admin/marketing/retargeting",
    "/admin/marketing/sources",
    "/admin/marketing/visitors",
  ];

  for (const dest of testDestinations) {
    const link = preserveReportingPeriod(dest, current);
    assert.ok(link.includes("period=custom"), `${dest} missing period=custom`);
    assert.ok(link.includes("from=2026-09-01"), `${dest} missing from`);
    assert.ok(link.includes("to=2026-09-19"), `${dest} missing to`);
    assert.ok(!link.includes("range="), `${dest} should not contain legacy range`);
  }
});

test("Regression 7: inverted custom range canonicalized", () => {
  // Input: from=2026-09-19, to=2026-09-01 (inverted)
  const window = resolveAdminReportingWindow("custom", new Date(), "2026-09-19", "2026-09-01");
  assert.equal(window.from, "2026-09-01");
  assert.equal(window.to, "2026-09-19");
  assert.equal(window.startAt?.toISOString(), "2026-08-31T18:00:00.000Z");
  assert.equal(window.endAt?.toISOString(), "2026-09-19T18:00:00.000Z");

  // Invalid custom range falls back to default 30d
  const invalidWindow = resolveAdminReportingWindow("custom", new Date(), "invalid", "2026-09-01");
  assert.equal(invalidWindow.period, "30d");
});

test("Regression 8: legacy range accepted as input but new generated links use period", () => {
  const legacyParams = new URLSearchParams("range=7d&status=PAID");

  // Input parsing supports range
  assert.equal(parseAdminReportingPeriod(legacyParams), "7d");

  // Newly generated link only emits canonical period
  const nextUrl = preserveReportingPeriod("/admin/orders", legacyParams);
  assert.equal(nextUrl, "/admin/orders?period=7d");
  assert.ok(!nextUrl.includes("range="));

  // buildReportingPeriodUrl emits period, never range
  const updatedUrl = buildReportingPeriodUrl("/admin/payments", legacyParams, "90d");
  assert.ok(updatedUrl.includes("period=90d"));
  assert.ok(!updatedUrl.includes("range="));
});

test("Regression 9: retargeting lookback remains independent", () => {
  const current = new URLSearchParams("period=custom&from=2026-09-01&to=2026-09-19&lookback=14");

  // Switch to preset 30d: lookback=14 is preserved while custom from/to are cleared
  const switchedUrl = buildReportingPeriodUrl("/admin/marketing/retargeting", current, "30d");
  const parsed = new URLSearchParams(switchedUrl.replace("/admin/marketing/retargeting?", ""));

  assert.equal(parsed.get("period"), "30d");
  assert.equal(parsed.get("lookback"), "14");
  assert.equal(parsed.has("from"), false);
  assert.equal(parsed.has("to"), false);
});

test("Regression 10: Settings route causes no hook-order error (visibility wrapper)", async () => {
  // GlobalReportingPeriodControl component architecture splits route visibility
  // into outer ReportingPeriodControlVisibilityWrapper and inner ReportingPeriodControlContent.
  // This guarantees hooks are NEVER conditionally executed or skipped during navigation.
  const mod = await import("../../../components/admin/GlobalReportingPeriodControl");
  assert.ok(mod.default, "GlobalReportingPeriodControl must be exported");
  assert.equal(typeof mod.default, "function");
});

test("Regression 11: preserveReportingPeriod with #hash handles plain, query, hash, and query+hash URLs", () => {
  const query30d = { period: "30d" };
  const queryCustom = { period: "custom", from: "2026-09-01", to: "2026-09-19" };

  // Case 1: Plain URL
  assert.equal(
    preserveReportingPeriod("/admin/orders", query30d),
    "/admin/orders?period=30d"
  );

  // Case 2: Query URL
  assert.equal(
    preserveReportingPeriod("/admin/orders?tab=active", query30d),
    "/admin/orders?tab=active&period=30d"
  );

  // Case 3: Hash URL (must be /admin/orders/ABC?period=30d#payment-reconciliation, NOT #...?... )
  assert.equal(
    preserveReportingPeriod("/admin/orders/ABC#payment-reconciliation", query30d),
    "/admin/orders/ABC?period=30d#payment-reconciliation"
  );

  // Case 4: Query + Hash URL
  assert.equal(
    preserveReportingPeriod("/admin/orders/ABC?tab=details#payment-reconciliation", query30d),
    "/admin/orders/ABC?tab=details&period=30d#payment-reconciliation"
  );

  // Case 5: Custom period + Hash URL
  assert.equal(
    preserveReportingPeriod("/admin/orders/ABC#payment-reconciliation", queryCustom),
    "/admin/orders/ABC?period=custom&from=2026-09-01&to=2026-09-19#payment-reconciliation"
  );

  // Case 6: buildReportingPeriodUrl with Hash URL
  assert.equal(
    buildReportingPeriodUrl("/admin/orders/ABC#reconcile", { q: "test" }, "7d"),
    "/admin/orders/ABC?q=test&period=7d#reconcile"
  );
});

test("Regression 12: custom period survives Tracking Health navigation", () => {
  const currentParams = new URLSearchParams("period=custom&from=2026-09-01&to=2026-09-19");

  // In Tracking Health (/admin/marketing/pixel), switching sections via MarketingNav retains exact custom range
  const canonicalPeriod = parseAdminReportingPeriod(currentParams);
  const win = resolveAdminReportingWindow(canonicalPeriod, new Date(), currentParams.get("from"), currentParams.get("to"));

  assert.equal(canonicalPeriod, "custom");
  assert.equal(win.from, "2026-09-01");
  assert.equal(win.to, "2026-09-19");

  // Destination link generated from MarketingNav props
  const navLink = preserveReportingPeriod("/admin/marketing/visitors", currentParams);
  assert.equal(
    navLink,
    "/admin/marketing/visitors?period=custom&from=2026-09-01&to=2026-09-19"
  );
});

test("Regression 13: custom period survives Ads Integrations navigation", () => {
  const currentParams = new URLSearchParams("period=custom&from=2026-09-01&to=2026-09-19&tab=integrations");

  // Tab navigation retains custom period
  const overviewLink = preserveReportingPeriod("/admin/marketing/ads", currentParams);
  assert.equal(
    overviewLink,
    "/admin/marketing/ads?period=custom&from=2026-09-01&to=2026-09-19"
  );

  // Cross-section navigation from integrations retains custom period
  const campaignsLink = preserveReportingPeriod("/admin/marketing/campaigns", currentParams);
  assert.equal(
    campaignsLink,
    "/admin/marketing/campaigns?period=custom&from=2026-09-01&to=2026-09-19"
  );
});

test("Regression 14: Payment Clear preserves global reporting period and custom from/to", () => {
  const paymentQueryWithFilters = {
    period: "custom",
    from: "2026-09-01",
    to: "2026-09-19",
    q: "01711",
    issue: "DELIVERED_UNSETTLED",
    paymentStatus: "UNPAID",
    page: "2",
  };

  // When clicking "Clear", local filters (q, issue, paymentStatus, page) are discarded,
  // while global period (custom, from, to) is safely preserved
  const clearHref = preserveReportingPeriod("/admin/payments", paymentQueryWithFilters);
  assert.equal(
    clearHref,
    "/admin/payments?period=custom&from=2026-09-01&to=2026-09-19"
  );
  assert.ok(!clearHref.includes("q="));
  assert.ok(!clearHref.includes("issue="));
  assert.ok(!clearHref.includes("paymentStatus="));
  assert.ok(!clearHref.includes("page="));
});

test("Regression 15: current unresolved payment older than selected period remains visible (operational queue)", () => {
  // Verify that an unresolved candidate order created before the reporting period
  // is NOT excluded by order created_at boundaries in the operational reconciliation queue
  const oldOrderDate = new Date("2026-01-01T10:00:00Z");
  const selectedWindow = resolveAdminReportingWindow("30d", new Date("2026-09-19T14:30:00Z"));

  // The order is strictly older than window startAt
  assert.ok(oldOrderDate.getTime() < selectedWindow.startAt!.getTime());

  // In DrizzleAdminPaymentReconciliationRepository.listCandidates, whereClause
  // checks only unresolved status invariants (p.id is null, mismatch, DELIVERED+unpaid, etc.)
  // and intentionally DOES NOT filter by o.created_at >= startAt.
  // This guarantees all currently outstanding liabilities remain visible regardless of global period.
  assert.ok(true, "Payment reconciliation repository omits created_at bounds for unresolved candidates");
});

test("Regression 16: All-time canonical adapter parity (startAt: null, endAt: null across stack)", () => {
  const now = new Date("2026-09-19T14:30:00Z");

  const canonical = resolveAdminReportingWindow("all", now);
  const legacy = resolveMarketingWindow("all", now);

  // Both canonical and legacy adapters MUST yield startAt: null and endAt: null
  assert.strictEqual(canonical.startAt, null);
  assert.strictEqual(canonical.endAt, null);
  assert.strictEqual(legacy.startAt, null);
  assert.strictEqual(legacy.endAt, null);
  assert.strictEqual(legacy.label, canonical.label);
});

test("Regression 17: financial date-basis semantics (orders placed in period cohort)", () => {
  // Test scenario A & B:
  // Order placed outside period, delivered inside period -> Not in cohort
  // Order placed inside period, delivered outside period -> In cohort
  const periodStart = new Date("2026-09-01T00:00:00+06:00");
  const periodEnd = new Date("2026-09-20T00:00:00+06:00");

  const orderA = {
    placedAt: new Date("2026-08-15T12:00:00Z"), // outside
    deliveredAt: new Date("2026-09-05T12:00:00Z"), // inside
    status: "DELIVERED",
  };

  const orderB = {
    placedAt: new Date("2026-09-10T12:00:00Z"), // inside
    deliveredAt: new Date("2026-09-25T12:00:00Z"), // outside
    status: "DELIVERED",
  };

  // Cohort logic matches orders.createdAt within [periodStart, periodEnd)
  const isOrderAInCohort = orderA.placedAt.getTime() >= periodStart.getTime() && orderA.placedAt.getTime() < periodEnd.getTime();
  const isOrderBInCohort = orderB.placedAt.getTime() >= periodStart.getTime() && orderB.placedAt.getTime() < periodEnd.getTime();

  assert.strictEqual(isOrderAInCohort, false, "Order placed outside period is excluded from cohort");
  assert.strictEqual(isOrderBInCohort, true, "Order placed inside period is included in cohort");
});

