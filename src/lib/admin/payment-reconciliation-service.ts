import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import { classifyFinancialPaymentRecognition } from "./payment-recognition";
import {
  PAYMENT_RECONCILIATION_ISSUES,
  type AdminPaymentReconciliationRepository,
  type PaymentReconciliationCandidate,
  type PaymentReconciliationIssue,
} from "./payment-reconciliation-repository";
import {
  PAYMENT_SETTLEMENT_STATUSES,
  type PaymentSettlementStatus,
} from "./payment-settlement-repository";
import { canManagePaymentSettlement } from "./payment-settlement-service";

export const PAYMENT_RECONCILIATION_PAGE_SIZE = 25;

const querySchema = z
  .object({
    q: z.string().trim().max(80).default(""),
    issue: z.enum(PAYMENT_RECONCILIATION_ISSUES).optional(),
    paymentStatus: z.enum(PAYMENT_SETTLEMENT_STATUSES).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .strict();

function first(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalString(value: unknown) {
  const candidate = first(value);
  if (typeof candidate !== "string") return undefined;
  const normalized = candidate.trim();
  return normalized.length ? normalized : undefined;
}

export interface AdminPaymentReconciliationQuery {
  q: string;
  issue?: PaymentReconciliationIssue;
  paymentStatus?: PaymentSettlementStatus;
  page: number;
}

export function parseAdminPaymentReconciliationQuery(
  raw: Record<string, unknown> = {},
): AdminPaymentReconciliationQuery {
  const parsed = querySchema.safeParse({
    q: optionalString(raw.q) ?? "",
    issue: optionalString(raw.issue),
    paymentStatus: optionalString(raw.paymentStatus),
    page: optionalString(raw.page) ?? 1,
  });

  if (!parsed.success) {
    return {
      q: "",
      page: 1,
    };
  }

  return parsed.data;
}

export function classifyPaymentReconciliationIssue(
  row: PaymentReconciliationCandidate,
): PaymentReconciliationIssue | null {
  if (!row.paymentId || !row.paymentStatus) {
    return "MISSING_PAYMENT";
  }

  if (row.orderPaymentStatus !== row.paymentStatus) {
    return "STATUS_MISMATCH";
  }

  const recognition = classifyFinancialPaymentRecognition(
    row.orderStatus,
    row.paymentStatus,
  );

  if (recognition !== "UNSETTLED") return null;

  if (row.orderStatus === "DELIVERED") {
    return "DELIVERED_UNSETTLED";
  }

  if (
    row.orderStatus === "CANCELLED" ||
    row.orderStatus === "RETURNED"
  ) {
    return "REVERSED_AWAITING_REFUND";
  }

  return null;
}

function actionForIssue(issue: PaymentReconciliationIssue) {
  switch (issue) {
    case "DELIVERED_UNSETTLED":
      return "Confirm collection or failure";
    case "REVERSED_AWAITING_REFUND":
      return "Complete refund reconciliation";
    case "STATUS_MISMATCH":
      return "Repair payment snapshot consistency";
    case "MISSING_PAYMENT":
      return "Investigate missing payment record";
  }
}

function attentionAgeHours(now: Date, attentionSince: Date) {
  return Math.max(
    0,
    Math.floor(
      (now.getTime() - attentionSince.getTime()) /
        (60 * 60 * 1000),
    ),
  );
}

function searchableText(
  row: PaymentReconciliationCandidate,
) {
  return [
    row.publicId,
    row.customerName,
    row.customerPhone,
    row.providerReference ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export async function listAdminPaymentReconciliation(
  identity: AdminIdentity,
  rawQuery: Record<string, unknown>,
  repository: AdminPaymentReconciliationRepository,
  now = new Date(),
) {
  const query = parseAdminPaymentReconciliationQuery(rawQuery);
  const candidates = await repository.listCandidates(identity.storeId);

  const unresolved = candidates
    .map((candidate) => {
      const issue = classifyPaymentReconciliationIssue(candidate);
      if (!issue) return null;

      return {
        ...candidate,
        issue,
        action: actionForIssue(issue),
        attentionAgeHours: attentionAgeHours(
          now,
          candidate.attentionSince,
        ),
        amountMinor:
          candidate.paymentAmountMinor ??
          candidate.orderTotalMinor,
        method:
          candidate.paymentMethod ??
          candidate.orderPaymentMethod,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort(
      (left, right) =>
        left.attentionSince.getTime() -
          right.attentionSince.getTime() ||
        left.publicId.localeCompare(right.publicId),
    );

  const paymentStatusCounts = Object.fromEntries(
    PAYMENT_SETTLEMENT_STATUSES.map((status) => [
      status,
      unresolved.filter(
        (row) => row.paymentStatus === status,
      ).length,
    ]),
  ) as Record<PaymentSettlementStatus, number>;

  const summary = {
    totalUnresolved: unresolved.length,
    deliveredUnsettled: unresolved.filter(
      (row) => row.issue === "DELIVERED_UNSETTLED",
    ).length,
    reversedAwaitingRefund: unresolved.filter(
      (row) => row.issue === "REVERSED_AWAITING_REFUND",
    ).length,
    statusMismatch: unresolved.filter(
      (row) => row.issue === "STATUS_MISMATCH",
    ).length,
    missingPayment: unresolved.filter(
      (row) => row.issue === "MISSING_PAYMENT",
    ).length,
    paymentStatusCounts,
    oldestUnresolvedHours:
      unresolved.length > 0
        ? Math.max(
            ...unresolved.map(
              (row) => row.attentionAgeHours,
            ),
          )
        : null,
  };

  const normalizedSearch = query.q.toLowerCase();
  const filtered = unresolved.filter((row) => {
    if (
      normalizedSearch &&
      !searchableText(row).includes(normalizedSearch)
    ) {
      return false;
    }

    if (query.issue && row.issue !== query.issue) {
      return false;
    }

    if (
      query.paymentStatus &&
      row.paymentStatus !== query.paymentStatus
    ) {
      return false;
    }

    return true;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length / PAYMENT_RECONCILIATION_PAGE_SIZE,
    ),
  );
  const page = Math.min(query.page, totalPages);
  const start =
    (page - 1) * PAYMENT_RECONCILIATION_PAGE_SIZE;

  return {
    query: {
      ...query,
      page,
    },
    summary,
    total: filtered.length,
    totalPages,
    rows: filtered.slice(
      start,
      start + PAYMENT_RECONCILIATION_PAGE_SIZE,
    ),
    canManage: canManagePaymentSettlement(identity.role),
  };
}
