import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import {
  canTransitionOrder,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
} from "../commerce/order-status";
import type {
  AdminOrderRepository,
  AdminOrderTransitionInput,
} from "./order-admin-repository";

export const ADMIN_ORDER_PAGE_SIZE = 20;

export const adminOrderStatusUpdateSchema = z.object({
  publicId: z.string().trim().min(8).max(32).regex(/^[A-Z0-9-]+$/),
  expectedStatus: z.enum(ORDER_STATUSES),
  toStatus: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export class AdminOrderError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "INVALID_TRANSITION"
      | "STATUS_CONFLICT"
      | "INVENTORY_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "AdminOrderError";
  }
}

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminOrderQuery(query: Record<string, unknown> = {}) {
  const rawQuery = firstQueryValue(query.q);
  const search = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";
  const rawStatus = firstQueryValue(query.status);
  const status =
    typeof rawStatus === "string" &&
    ORDER_STATUSES.includes(rawStatus as OrderStatus)
      ? (rawStatus as OrderStatus)
      : null;
  const rawPage = firstQueryValue(query.page);
  const parsedPage = typeof rawPage === "string" ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isSafeInteger(parsedPage)
    ? Math.min(10_000, Math.max(1, parsedPage))
    : 1;

  return { query: search, status, page, pageSize: ADMIN_ORDER_PAGE_SIZE };
}

export function canManageOrders(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN" || role === "ORDER_MANAGER";
}

export function getAllowedOrderTransitions(status: OrderStatus) {
  return ORDER_STATUS_TRANSITIONS[status];
}

export type OrderInventoryEffect =
  | "NONE"
  | "RELEASE_RESERVATION"
  | "COMMIT_RESERVATION"
  | "RESTOCK";

export function getOrderInventoryEffect(
  toStatus: OrderStatus,
): OrderInventoryEffect {
  if (toStatus === "CANCELLED") return "RELEASE_RESERVATION";
  if (toStatus === "SHIPPED") return "COMMIT_RESERVATION";
  if (toStatus === "RETURNED") return "RESTOCK";
  return "NONE";
}

export async function listAdminOrders(
  storeId: string,
  query: ReturnType<typeof parseAdminOrderQuery>,
  repository: AdminOrderRepository,
) {
  const result = await repository.listOrders(storeId, query);
  const total = Math.max(0, Number(result.total) || 0);
  return {
    ...result,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    query,
  };
}

export function getAdminOrderDetail(
  storeId: string,
  publicId: string,
  repository: AdminOrderRepository,
) {
  return repository.getOrderDetail(storeId, publicId);
}

export async function transitionAdminOrder(
  identity: AdminIdentity,
  input: z.infer<typeof adminOrderStatusUpdateSchema>,
  repository: AdminOrderRepository,
  now = new Date(),
) {
  if (!canManageOrders(identity.role)) {
    throw new AdminOrderError("FORBIDDEN", "This account cannot update orders.");
  }
  if (!canTransitionOrder(input.expectedStatus, input.toStatus)) {
    throw new AdminOrderError(
      "INVALID_TRANSITION",
      `Orders cannot move from ${input.expectedStatus} to ${input.toStatus}.`,
    );
  }

  const transition: AdminOrderTransitionInput = {
    storeId: identity.storeId,
    publicId: input.publicId,
    expectedStatus: input.expectedStatus,
    toStatus: input.toStatus,
    note: input.note?.trim() || null,
    actor: { id: identity.id, email: identity.email },
    now,
  };
  const result = await repository.transitionOrder(transition);
  if (result.kind === "NOT_FOUND") {
    throw new AdminOrderError("NOT_FOUND", "The order was not found.");
  }
  if (result.kind === "CONFLICT") {
    throw new AdminOrderError(
      "STATUS_CONFLICT",
      `The order is already ${result.currentStatus}. Refresh and try again.`,
    );
  }
  if (result.kind === "INVENTORY_CONFLICT") {
    throw new AdminOrderError(
      "INVENTORY_CONFLICT",
      "Reserved inventory no longer matches this order. No status was changed.",
    );
  }
  return result;
}
