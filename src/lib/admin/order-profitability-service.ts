import { z } from "zod";
import { classifyFinancialPaymentRecognition } from "./payment-recognition";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminOrderProfitabilityRepository,
  AdminOrderProfitabilitySnapshot,
} from "./order-profitability-repository";

export const adminOrderFulfillmentCostSchema = z
  .object({
    publicId: z.string().trim().min(8).max(32).regex(/^[A-Z0-9-]+$/),
    expectedRevision: z.number().int().nonnegative(),
    fulfillmentCostMinor: z.number().int().nonnegative().nullable(),
  })
  .strict();

export class AdminOrderProfitabilityError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "AdminOrderProfitabilityError";
  }
}

export function parseOptionalOrderCostToMinor(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "string") return Number.NaN;

  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;

  const [whole, fraction = ""] = normalized.split(".");
  const minor =
    Number.parseInt(whole, 10) * 100 +
    Number.parseInt((fraction + "00").slice(0, 2), 10);

  return Number.isSafeInteger(minor) && minor <= 2_147_483_647
    ? minor
    : Number.NaN;
}

export function canManageOrderCosts(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN" || role === "ORDER_MANAGER";
}

function safeSum(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new Error("Order cost total exceeded safe integer range.");
    }
  }
  return total;
}

function marginPercent(contributionMinor: number | null, revenueMinor: number) {
  if (contributionMinor === null || revenueMinor <= 0) return null;
  return Math.round((contributionMinor / revenueMinor) * 10_000) / 100;
}

export function summarizeOrderProfitability(
  snapshot: AdminOrderProfitabilitySnapshot,
) {
  const totalItemCount = snapshot.items.length;
  const knownItemCostCount = snapshot.items.filter(
    (item) => item.totalCostMinor !== null,
  ).length;
  const itemCostsComplete =
    totalItemCount > 0 && knownItemCostCount === totalItemCount;

  const cogsMinor = itemCostsComplete
    ? safeSum(
        snapshot.items.map((item) => {
          if (item.totalCostMinor === null) {
            throw new Error("Unexpected unknown item cost.");
          }
          return item.totalCostMinor;
        }),
      )
    : null;

  const grossProfitMinor =
    cogsMinor === null ? null : snapshot.revenueMinor - cogsMinor;

  const projectedContributionMinor =
    grossProfitMinor === null || snapshot.fulfillmentCostMinor === null
      ? null
      : grossProfitMinor - snapshot.fulfillmentCostMinor;

  let recognizedContributionMinor: number | null = null;
  let recognizedRevenueMinor: number | null = null;
  let recognition: "PROVISIONAL" | "REALIZED" | "REVERSED";

  const paymentRecognition = classifyFinancialPaymentRecognition(
    snapshot.status,
    snapshot.paymentStatus,
  );

  if (paymentRecognition === "PAID_DELIVERED") {
    recognition = "REALIZED";
    recognizedRevenueMinor = snapshot.revenueMinor;
    recognizedContributionMinor = projectedContributionMinor;
  } else if (paymentRecognition === "REFUNDED_DELIVERED") {
    recognition = "REVERSED";
    recognizedRevenueMinor = 0;
    recognizedContributionMinor =
      cogsMinor === null || snapshot.fulfillmentCostMinor === null
        ? null
        : -(cogsMinor + snapshot.fulfillmentCostMinor);
  } else if (paymentRecognition === "REVERSED_RESOLVED") {
    recognition = "REVERSED";
    recognizedRevenueMinor = 0;
    recognizedContributionMinor =
      snapshot.fulfillmentCostMinor === null
        ? null
        : -snapshot.fulfillmentCostMinor;
  } else {
    recognition = "PROVISIONAL";
  }

  const settlementComplete =
    paymentRecognition === "PAID_DELIVERED" ||
    paymentRecognition === "REFUNDED_DELIVERED" ||
    paymentRecognition === "REVERSED_RESOLVED";

  const lifecycleNote =
    paymentRecognition === "PAID_DELIVERED"
      ? "Delivered and paid orders recognize contribution only when item COGS and fulfillment cost are complete."
      : paymentRecognition === "REFUNDED_DELIVERED"
        ? "Delivered payment was refunded. Revenue is reversed while known item COGS and fulfillment remain realized economic losses."
        : paymentRecognition === "UNSETTLED" &&
            snapshot.status === "DELIVERED"
          ? "The order is delivered but payment settlement remains unresolved. Realized contribution stays withheld until payment becomes PAID or REFUNDED."
          : paymentRecognition === "UNSETTLED"
            ? "The order lifecycle is reversed but payment settlement remains unresolved. Realized contribution stays withheld until payment reconciliation closes."
            : snapshot.status === "CANCELLED"
              ? "Cancelled revenue is reversed. Only recorded fulfillment cost is recognized as an operational loss after payment settlement is resolved."
              : snapshot.status === "RETURNED"
                ? "Returned revenue is reversed and inventory is restocked. Only recorded fulfillment cost is recognized as an operational loss after payment settlement is resolved."
                : "This order is not in a financially recognized lifecycle state yet, so contribution remains provisional.";


  return {
    revenueMinor: snapshot.revenueMinor,
    recognizedRevenueMinor,
    paymentStatus: snapshot.paymentStatus,
    paymentRecognition,
    settlementComplete,
    cogsMinor,
    grossProfitMinor,
    fulfillmentCostMinor: snapshot.fulfillmentCostMinor,
    projectedContributionMinor,
    projectedMarginPercent: marginPercent(
      projectedContributionMinor,
      snapshot.revenueMinor,
    ),
    recognizedContributionMinor,
    recognizedMarginPercent: marginPercent(
      recognizedContributionMinor,
      recognizedRevenueMinor ?? 0,
    ),
    recognition,
    totalItemCount,
    knownItemCostCount,
    itemCostsComplete,
    contributionComplete:
      projectedContributionMinor !== null,
    lifecycleNote,
  };
}

export async function getAdminOrderProfitability(
  identity: AdminIdentity,
  publicId: string,
  repository: AdminOrderProfitabilityRepository,
) {
  const snapshot = await repository.getProfitability(
    identity.storeId,
    publicId,
  );

  if (!snapshot) return null;

  return {
    ...snapshot,
    summary: summarizeOrderProfitability(snapshot),
    canManage: canManageOrderCosts(identity.role),
  };
}

export async function updateAdminOrderFulfillmentCost(
  identity: AdminIdentity,
  rawInput: unknown,
  repository: AdminOrderProfitabilityRepository,
  now = new Date(),
) {
  if (!canManageOrderCosts(identity.role)) {
    throw new AdminOrderProfitabilityError(
      "FORBIDDEN",
      "This account cannot update order costs.",
    );
  }

  const input = adminOrderFulfillmentCostSchema.parse(rawInput);

  const result = await repository.updateFulfillmentCost({
    storeId: identity.storeId,
    publicId: input.publicId,
    expectedRevision: input.expectedRevision,
    fulfillmentCostMinor: input.fulfillmentCostMinor,
    actor: { id: identity.id, email: identity.email },
    now,
  });

  if (result.kind === "NOT_FOUND") {
    throw new AdminOrderProfitabilityError(
      "NOT_FOUND",
      "The order was not found.",
    );
  }

  if (result.kind === "CONFLICT") {
    throw new AdminOrderProfitabilityError(
      "CONFLICT",
      `Order cost data changed in another session (revision ${result.currentRevision}). Reload before saving.`,
    );
  }

  return result;
}
