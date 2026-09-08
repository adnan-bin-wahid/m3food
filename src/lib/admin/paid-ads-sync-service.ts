import { z } from "zod";
import type { AdminIdentity } from "../auth/admin-repository";
import type { PaidAdProvider } from "../marketing/paid-ads";
import {
  providerDailyMetricSchema,
  type PaidAdsProviderClient,
} from "../marketing/paid-ads-provider";
import { canManagePaidAds } from "./paid-ads-service";
import type { AdminPaidAdsSyncRepository } from "./paid-ads-sync-repository";

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Use a valid YYYY-MM-DD date.");

export const paidAdsSyncInputSchema = z
  .object({
    accountId: z.string().uuid(),
    startDate: isoDate,
    endDate: isoDate,
  })
  .superRefine((value, context) => {
    const start = Date.parse(`${value.startDate}T00:00:00Z`);
    const end = Date.parse(`${value.endDate}T00:00:00Z`);

    if (start > end) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after start date.",
      });
      return;
    }

    const days = Math.floor((end - start) / 86_400_000) + 1;
    if (days > 31) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "One provider sync can cover at most 31 calendar days.",
      });
    }
  });

export class PaidAdsSyncError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "ACCOUNT_NOT_FOUND"
      | "ACCOUNT_INACTIVE"
      | "NO_ACTIVE_MAPPINGS"
      | "PROVIDER_NOT_CONFIGURED"
      | "PROVIDER_RESPONSE_INVALID",
    message: string,
  ) {
    super(message);
    this.name = "PaidAdsSyncError";
  }
}

export type PaidAdsProviderResolver = (
  provider: PaidAdProvider,
) => PaidAdsProviderClient | null;

export async function syncAdminPaidAdAccount(
  admin: AdminIdentity,
  rawInput: unknown,
  repository: AdminPaidAdsSyncRepository,
  resolveProvider: PaidAdsProviderResolver,
) {
  if (!canManagePaidAds(admin.role)) {
    throw new PaidAdsSyncError(
      "FORBIDDEN",
      "Your role cannot sync paid ad delivery.",
    );
  }

  const input = paidAdsSyncInputSchema.parse(rawInput);
  const context = await repository.getSyncContext(
    admin.storeId,
    input.accountId,
  );

  if (!context) {
    throw new PaidAdsSyncError(
      "ACCOUNT_NOT_FOUND",
      "That paid ad account is unavailable for this store.",
    );
  }

  if (!context.account.isActive) {
    throw new PaidAdsSyncError(
      "ACCOUNT_INACTIVE",
      "That paid ad account is inactive.",
    );
  }

  const mappings = context.mappings.filter(
    (mapping) =>
      mapping.isActive && Boolean(mapping.marketingCampaignId),
  );

  if (!mappings.length) {
    throw new PaidAdsSyncError(
      "NO_ACTIVE_MAPPINGS",
      "Map at least one active provider campaign to the Campaign Registry before syncing.",
    );
  }

  const provider = resolveProvider(context.account.provider);

  if (!provider) {
    throw new PaidAdsSyncError(
      "PROVIDER_NOT_CONFIGURED",
      `${context.account.provider} Ads API credentials are not configured on the server.`,
    );
  }

  let fetched;
  try {
    fetched = await provider.fetchDailyMetrics({
      account: context.account,
      mappings,
      startDate: input.startDate,
      endDate: input.endDate,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Provider response could not be read.";

    throw new PaidAdsSyncError(
      "PROVIDER_RESPONSE_INVALID",
      message,
    );
  }

  const mappingByExternalId = new Map(
    mappings.map(
      (mapping) => [mapping.externalCampaignId, mapping] as const,
    ),
  );

  const seen = new Set<string>();
  let rowsWritten = 0;
  let skippedUnmapped = 0;

  for (const rawMetric of fetched) {
    const parsed = providerDailyMetricSchema.safeParse(rawMetric);

    if (!parsed.success) {
      throw new PaidAdsSyncError(
        "PROVIDER_RESPONSE_INVALID",
        "Provider returned a malformed paid delivery metric.",
      );
    }

    const metric = parsed.data;

    if (
      metric.metricDate < input.startDate ||
      metric.metricDate > input.endDate
    ) {
      throw new PaidAdsSyncError(
        "PROVIDER_RESPONSE_INVALID",
        "Provider returned a metric outside the requested date range.",
      );
    }

    const mapping = mappingByExternalId.get(
      metric.externalCampaignId,
    );

    if (!mapping) {
      skippedUnmapped += 1;
      continue;
    }

    const key = `${mapping.id}:${metric.metricDate}`;
    if (seen.has(key)) {
      throw new PaidAdsSyncError(
        "PROVIDER_RESPONSE_INVALID",
        "Provider returned duplicate campaign/day delivery rows.",
      );
    }
    seen.add(key);

    await repository.upsertApiDailyMetric({
      storeId: admin.storeId,
      mappingId: mapping.id,
      metricDate: metric.metricDate,
      spendMinor: metric.spendMinor,
      impressions: metric.impressions,
      clicks: metric.clicks,
      updatedByAdminUserId: admin.id,
      updatedByAdminEmail: admin.email,
    });

    rowsWritten += 1;
  }

  return {
    provider: context.account.provider,
    accountId: context.account.id,
    accountName: context.account.name,
    startDate: input.startDate,
    endDate: input.endDate,
    rowsFetched: fetched.length,
    rowsWritten,
    skippedUnmapped,
  };
}
