import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import {
  PAYMENT_SETTLEMENT_STATUSES,
  type AdminPaymentSettlementRepository,
  type PaymentSettlementStatus,
} from "./payment-settlement-repository";

export const adminPaymentSettlementUpdateSchema = z
  .object({
    publicId: z
      .string()
      .trim()
      .min(5)
      .max(32)
      .regex(/^[A-Z0-9-]+$/),
    expectedRevision: z.number().int().nonnegative(),
    toStatus: z.enum(PAYMENT_SETTLEMENT_STATUSES),
    providerReference: z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable(),
    note: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

const PAYMENT_TRANSITIONS: Record<
  PaymentSettlementStatus,
  readonly PaymentSettlementStatus[]
> = {
  UNPAID: ["PENDING", "PAID", "FAILED"],
  PENDING: ["UNPAID", "PAID", "FAILED"],
  FAILED: ["UNPAID", "PENDING", "PAID"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
};

export class AdminPaymentSettlementError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "INVALID_TRANSITION",
    message: string,
  ) {
    super(message);
    this.name = "AdminPaymentSettlementError";
  }
}

export function canManagePaymentSettlement(
  role: AdminIdentity["role"],
) {
  return (
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "ORDER_MANAGER"
  );
}

export function getAllowedPaymentTransitions(
  status: PaymentSettlementStatus,
) {
  return PAYMENT_TRANSITIONS[status];
}

function normalizeOptional(
  value: string | null | undefined,
) {
  const normalized = value?.trim() ?? "";
  return normalized.length ? normalized : null;
}

export async function getAdminPaymentSettlement(
  identity: AdminIdentity,
  publicId: string,
  repository: AdminPaymentSettlementRepository,
) {
  const settlement = await repository.getSettlement(
    identity.storeId,
    publicId,
  );

  if (!settlement) return null;

  return {
    ...settlement,
    allowedTransitions: [
      ...getAllowedPaymentTransitions(settlement.status),
    ],
    canManage: canManagePaymentSettlement(identity.role),
    statusConsistent:
      settlement.status === settlement.orderPaymentStatus,
  };
}

export async function updateAdminPaymentSettlement(
  identity: AdminIdentity,
  rawInput: unknown,
  repository: AdminPaymentSettlementRepository,
  now = new Date(),
) {
  if (!canManagePaymentSettlement(identity.role)) {
    throw new AdminPaymentSettlementError(
      "FORBIDDEN",
      "This account cannot reconcile payment status.",
    );
  }

  const input = adminPaymentSettlementUpdateSchema.parse(rawInput);
  const current = await repository.getSettlement(
    identity.storeId,
    input.publicId,
  );

  if (!current) {
    throw new AdminPaymentSettlementError(
      "NOT_FOUND",
      "The order payment record was not found.",
    );
  }

  if (current.revision !== input.expectedRevision) {
    throw new AdminPaymentSettlementError(
      "CONFLICT",
      `Payment data changed in another session (revision ${current.revision}). Reload before saving.`,
    );
  }

  const allowed = getAllowedPaymentTransitions(current.status);
  if (!allowed.includes(input.toStatus)) {
    throw new AdminPaymentSettlementError(
      "INVALID_TRANSITION",
      `Payment cannot move from ${current.status} to ${input.toStatus}.`,
    );
  }

  const result = await repository.updateSettlement({
    storeId: identity.storeId,
    publicId: input.publicId,
    expectedPaymentId: current.paymentId,
    expectedRevision: input.expectedRevision,
    expectedStatus: current.status,
    toStatus: input.toStatus,
    providerReference: normalizeOptional(
      input.providerReference,
    ),
    note: normalizeOptional(input.note),
    actor: { id: identity.id, email: identity.email },
    now,
  });

  if (result.kind === "NOT_FOUND") {
    throw new AdminPaymentSettlementError(
      "NOT_FOUND",
      "The order payment record was not found.",
    );
  }

  if (result.kind === "CONFLICT") {
    throw new AdminPaymentSettlementError(
      "CONFLICT",
      result.currentRevision === null
        ? "The latest payment record changed. Reload before saving."
        : `Payment data changed in another session (revision ${result.currentRevision}). Reload before saving.`,
    );
  }

  return result;
}
