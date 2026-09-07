import { createHash } from "node:crypto";
import type { AdminIdentity } from "../auth/admin-repository";
import type { SteadfastEnvironment } from "../config/server-env";
import { createSteadfastShipment, SteadfastError } from "../fulfillment/steadfast";
import type { AdminFulfillmentRepository } from "./fulfillment-repository";

export class AdminFulfillmentError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "NOT_FOUND" | "INVALID_ORDER" | "NOT_CONFIGURED" | "IN_PROGRESS" | "PROVIDER_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "AdminFulfillmentError";
  }
}

export function canManageFulfillment(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN" || role === "ORDER_MANAGER";
}

function shipmentFingerprint(candidate: { publicId: string; customerPhone: string; totalMinor: number; addressLine1: string; district: string }) {
  return createHash("sha256")
    .update(JSON.stringify(candidate))
    .digest("hex");
}

export async function getAdminFulfillment(
  identity: AdminIdentity,
  publicId: string,
  repository: AdminFulfillmentRepository,
) {
  const candidate = await repository.getOrderCandidate(identity.storeId, publicId);
  if (!candidate) return null;
  return { ...candidate, canManage: canManageFulfillment(identity.role) };
}

export async function submitOrderToSteadfast(
  identity: AdminIdentity,
  publicId: string,
  repository: AdminFulfillmentRepository,
  environment: SteadfastEnvironment,
  dependencies: { now?: () => Date; createShipment?: typeof createSteadfastShipment } = {},
) {
  if (!canManageFulfillment(identity.role)) {
    throw new AdminFulfillmentError("FORBIDDEN", "This account cannot submit courier shipments.");
  }
  const candidate = await repository.getOrderCandidate(identity.storeId, publicId);
  if (!candidate) throw new AdminFulfillmentError("NOT_FOUND", "The order was not found.");
  if (!["CONFIRMED", "PROCESSING"].includes(candidate.status)) {
    throw new AdminFulfillmentError("INVALID_ORDER", "Confirm the order before submitting it to Steadfast.");
  }
  if (candidate.currency !== "BDT") {
    throw new AdminFulfillmentError("INVALID_ORDER", "Steadfast COD submission requires a BDT order.");
  }
  if (candidate.shipment?.status === "SUBMITTED" && candidate.shipment.trackingCode) {
    return { kind: "ALREADY_SUBMITTED" as const, shipment: candidate.shipment };
  }
  if (!environment.STEADFAST_API_KEY || !environment.STEADFAST_SECRET_KEY) {
    throw new AdminFulfillmentError("NOT_CONFIGURED", "Steadfast API credentials are not configured on the server.");
  }

  const now = dependencies.now?.() ?? new Date();
  const requestFingerprint = shipmentFingerprint(candidate);
  const claim = await repository.claimSubmission({
    storeId: identity.storeId,
    orderId: candidate.orderId,
    requestFingerprint,
    now,
  });
  if (claim === "SUBMITTED") {
    const latest = await repository.getOrderCandidate(identity.storeId, publicId);
    if (latest?.shipment?.trackingCode) {
      return { kind: "ALREADY_SUBMITTED" as const, shipment: latest.shipment };
    }
    throw new AdminFulfillmentError("IN_PROGRESS", "Steadfast submission state changed. Refresh this order and try again.");
  }
  if (claim === "BUSY") {
    throw new AdminFulfillmentError("IN_PROGRESS", "A Steadfast submission is already in progress. Try again shortly.");
  }
  try {
    const delivery = await (dependencies.createShipment ?? createSteadfastShipment)({
      invoice: candidate.publicId,
      recipientName: candidate.customerName,
      recipientPhone: candidate.customerPhone,
      recipientAddress: [candidate.addressLine1, candidate.addressLine2, candidate.area, candidate.district].filter(Boolean).join(", "),
      codAmountMinor: candidate.totalMinor,
      note: candidate.note,
      itemDescription: candidate.itemDescription,
      totalLot: candidate.totalLot,
    }, environment);
    await repository.markSubmitted({
      storeId: identity.storeId,
      orderId: candidate.orderId,
      consignmentId: delivery.consignmentId,
      trackingCode: delivery.trackingCode,
      providerStatus: delivery.providerStatus,
      providerResponse: delivery.raw,
      now,
    });
    return { kind: "SUBMITTED" as const, shipment: delivery };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Steadfast shipment failed.";
    await repository.markFailed({ storeId: identity.storeId, orderId: candidate.orderId, error: message, now });
    if (error instanceof SteadfastError && error.code === "NOT_CONFIGURED") {
      throw new AdminFulfillmentError("NOT_CONFIGURED", error.message);
    }
    throw new AdminFulfillmentError("PROVIDER_ERROR", "Steadfast did not accept the shipment. The order was not changed.");
  }
}
