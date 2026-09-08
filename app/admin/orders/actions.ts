"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "../../../src/lib/auth/current-admin";
import {
  AdminOrderError,
  adminOrderStatusUpdateSchema,
  transitionAdminOrder,
} from "../../../src/lib/admin/order-admin-service";
import { DrizzleAdminOrderRepository } from "../../../src/lib/db/admin-order-repository";
import {
  AdminOrderProfitabilityError,
  adminOrderFulfillmentCostSchema,
  parseOptionalOrderCostToMinor,
  updateAdminOrderFulfillmentCost,
} from "../../../src/lib/admin/order-profitability-service";
import { DrizzleAdminOrderProfitabilityRepository } from "../../../src/lib/db/admin-order-profitability-repository";
import {
  AdminPaymentSettlementError,
  adminPaymentSettlementUpdateSchema,
  updateAdminPaymentSettlement,
} from "../../../src/lib/admin/payment-settlement-service";
import { DrizzleAdminPaymentSettlementRepository } from "../../../src/lib/db/admin-payment-settlement-repository";
import { getSteadfastEnvironment } from "../../../src/lib/config/server-env";
import { AdminFulfillmentError, submitOrderToSteadfast } from "../../../src/lib/admin/fulfillment-service";
import { DrizzleAdminFulfillmentRepository } from "../../../src/lib/db/admin-fulfillment-repository";

export interface OrderStatusActionState {
  ok: boolean;
  message: string;
}

export async function updateOrderStatusAction(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };

  const parsed = adminOrderStatusUpdateSchema.safeParse({
    publicId: formData.get("publicId"),
    expectedStatus: formData.get("expectedStatus"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "Choose a valid next status and check the note." };
  }

  try {
    const result = await transitionAdminOrder(
      admin,
      parsed.data,
      new DrizzleAdminOrderRepository(),
    );
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${result.publicId}`);
    return { ok: true, message: `Order moved to ${result.status}.` };
  } catch (error) {
    if (error instanceof AdminOrderError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "The order could not be updated." };
  }
}


export async function submitSteadfastShipmentAction(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const publicId = String(formData.get("publicId") || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{5,32}$/.test(publicId)) return { ok: false, message: "Invalid order reference." };
  try {
    const result = await submitOrderToSteadfast(
      admin,
      publicId,
      new DrizzleAdminFulfillmentRepository(),
      getSteadfastEnvironment(),
    );
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${publicId}`);
    if (result.kind === "ALREADY_SUBMITTED") {
      return { ok: true, message: `Already submitted to Steadfast (${result.shipment.trackingCode}).` };
    }
    return { ok: true, message: `Submitted to Steadfast (${result.shipment.trackingCode}).` };
  } catch (error) {
    if (error instanceof AdminFulfillmentError) return { ok: false, message: error.message };
    return { ok: false, message: "The courier submission could not be completed." };
  }
}

export async function updateOrderFulfillmentCostAction(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Your admin session has expired.",
    };
  }

  const parsed = adminOrderFulfillmentCostSchema.safeParse({
    publicId: String(formData.get("publicId") || "")
      .trim()
      .toUpperCase(),
    expectedRevision: Number(
      formData.get("expectedRevision"),
    ),
    fulfillmentCostMinor: parseOptionalOrderCostToMinor(
      formData.get("fulfillmentCost"),
    ),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        "Enter a valid fulfillment cost with at most two decimal places.",
    };
  }

  try {
    const result = await updateAdminOrderFulfillmentCost(
      admin,
      parsed.data,
      new DrizzleAdminOrderProfitabilityRepository(),
    );

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    revalidatePath(
      `/admin/orders/${parsed.data.publicId}`,
    );

    return {
      ok: true,
      message:
        parsed.data.fulfillmentCostMinor === null
          ? "Fulfillment cost cleared."
          : `Fulfillment cost saved (revision ${result.revision}).`,
    };
  } catch (error) {
    if (error instanceof AdminOrderProfitabilityError) {
      return { ok: false, message: error.message };
    }

    return {
      ok: false,
      message: "The fulfillment cost could not be saved.",
    };
  }
}


export async function updateOrderPaymentStatusAction(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      ok: false,
      message: "Your admin session has expired.",
    };
  }

  const parsed = adminPaymentSettlementUpdateSchema.safeParse({
    publicId: String(formData.get("publicId") || "")
      .trim()
      .toUpperCase(),
    expectedRevision: Number(
      formData.get("expectedRevision"),
    ),
    toStatus: String(formData.get("toStatus") || ""),
    providerReference: String(
      formData.get("providerReference") || "",
    ),
    note: String(
      formData.get("note") || "",
    ),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Choose a valid payment status and check the settlement fields.",
    };
  }

  try {
    const result = await updateAdminPaymentSettlement(
      admin,
      parsed.data,
      new DrizzleAdminPaymentSettlementRepository(),
    );

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/payments");
    revalidatePath(
      `/admin/orders/${parsed.data.publicId}`,
    );

    return {
      ok: true,
      message:
        `Payment marked ${result.status} (revision ${result.revision}).`,
    };
  } catch (error) {
    if (error instanceof AdminPaymentSettlementError) {
      return { ok: false, message: error.message };
    }

    return {
      ok: false,
      message: "The payment status could not be updated.",
    };
  }
}