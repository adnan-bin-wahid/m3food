import { z } from "zod";
import type { AdminIdentity, AdminRole } from "../auth/admin-repository";
import type {
  AdminSettingsRepository,
  StoreSettings,
} from "./settings-repository";

export const storeSettingsInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  timezone: z.string().trim().min(1).max(64).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid IANA timezone."),
  metaPixelId: z.string().trim().regex(/^\d{5,25}$|^$/, "Pixel ID must contain only digits."),
  revision: z.number().int().nonnegative(),
}).strict();

export type StoreSettingsInput = z.infer<typeof storeSettingsInputSchema>;
export type AdminSettingsErrorCode = "FORBIDDEN" | "NOT_FOUND" | "CONFLICT";

export class AdminSettingsError extends Error {
  constructor(
    public readonly code: AdminSettingsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AdminSettingsError";
  }
}

export function canEditStoreSettings(role: AdminRole) {
  return role === "OWNER" || role === "ADMIN";
}

export async function getStoreSettings(
  admin: AdminIdentity,
  repository: AdminSettingsRepository,
): Promise<StoreSettings> {
  const settings = await repository.findSettings(admin.storeId);
  if (!settings) {
    throw new AdminSettingsError("NOT_FOUND", "Store settings are unavailable.");
  }
  return settings;
}

export async function updateStoreSettings(
  admin: AdminIdentity,
  input: StoreSettingsInput,
  repository: AdminSettingsRepository,
): Promise<StoreSettings> {
  if (!canEditStoreSettings(admin.role)) {
    throw new AdminSettingsError("FORBIDDEN", "Your role has read-only access.");
  }

  const validated = storeSettingsInputSchema.parse(input);
  const result = await repository.updateSettings({
    storeId: admin.storeId,
    expectedRevision: validated.revision,
    name: validated.name,
    timezone: validated.timezone,
    metaPixelId: validated.metaPixelId,
  });

  if (result.kind === "NOT_FOUND") {
    throw new AdminSettingsError("NOT_FOUND", "Store settings are unavailable.");
  }
  if (result.kind === "CONFLICT") {
    throw new AdminSettingsError(
      "CONFLICT",
      "Settings changed in another session. Reload before saving.",
    );
  }
  return result.settings;
}
