import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import { canManagePaidAds } from "./paid-ads-service";
import type { AdminPaidAdsScheduleRepository } from "./paid-ads-schedule-repository";

export const paidAdScheduleUpdateSchema = z.object({
  accountId: z.string().uuid(),
  syncEnabled: z.boolean(),
  syncLookbackDays: z.coerce.number().int().min(1).max(31),
  revision: z.coerce.number().int().nonnegative(),
});

export class AdminPaidAdsScheduleError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "ACCOUNT_NOT_FOUND_OR_STALE",
    message: string,
  ) {
    super(message);
    this.name = "AdminPaidAdsScheduleError";
  }
}

export async function getAdminPaidAdsScheduleWorkspace(
  admin: AdminIdentity,
  repository: AdminPaidAdsScheduleRepository,
) {
  return repository.getWorkspace(admin.storeId);
}

export async function updateAdminPaidAdSchedule(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminPaidAdsScheduleRepository,
) {
  if (!canManagePaidAds(admin.role)) {
    throw new AdminPaidAdsScheduleError(
      "FORBIDDEN",
      "Your role cannot change paid ads scheduling.",
    );
  }

  const input = paidAdScheduleUpdateSchema.parse(rawInput);

  const updated = await repository.updateSchedule({
    storeId: admin.storeId,
    ...input,
  });

  if (!updated) {
    throw new AdminPaidAdsScheduleError(
      "ACCOUNT_NOT_FOUND_OR_STALE",
      "That ad account is unavailable, inactive, or was changed by another admin. Refresh and try again.",
    );
  }

  return input;
}
