"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  AdminCustomerError,
  addAdminCustomerNote,
  addAdminCustomerTag,
  removeAdminCustomerTag,
} from "../../../src/lib/admin/customer-admin-service";
import { getCurrentAdmin } from "../../../src/lib/auth/current-admin";
import { DrizzleAdminCustomerRepository } from "../../../src/lib/db/admin-customer-repository";

export interface CustomerActionState { ok: boolean; message: string }
const repository = () => new DrizzleAdminCustomerRepository();

function errorState(error: unknown, fallback: string): CustomerActionState {
  if (error instanceof AdminCustomerError) return { ok: false, message: error.message };
  if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? "Check the form values." };
  return { ok: false, message: fallback };
}

function refresh(customerId: string) {
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function addCustomerTagAction(
  _previous: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const customerId = String(formData.get("customerId") ?? "");
  try {
    await addAdminCustomerTag(admin, { customerId, tag: formData.get("tag") }, repository());
  } catch (error) {
    return errorState(error, "Tag could not be added.");
  }
  refresh(customerId);
  return { ok: true, message: "Tag added." };
}

export async function removeCustomerTagAction(
  _previous: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const customerId = String(formData.get("customerId") ?? "");
  try {
    await removeAdminCustomerTag(admin, { customerId, tag: formData.get("tag") }, repository());
  } catch (error) {
    return errorState(error, "Tag could not be removed.");
  }
  refresh(customerId);
  return { ok: true, message: "Tag removed." };
}

export async function addCustomerNoteAction(
  _previous: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your admin session has expired." };
  const customerId = String(formData.get("customerId") ?? "");
  try {
    await addAdminCustomerNote(admin, { customerId, note: formData.get("note") }, repository());
  } catch (error) {
    return errorState(error, "Note could not be added.");
  }
  refresh(customerId);
  return { ok: true, message: "Internal note added." };
}
