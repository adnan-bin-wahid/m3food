"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "../../../src/lib/auth/current-admin";
import {
  AdminOrderError,
  adminOrderStatusUpdateSchema,
  transitionAdminOrder,
} from "../../../src/lib/admin/order-admin-service";
import { DrizzleAdminOrderRepository } from "../../../src/lib/db/admin-order-repository";

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
