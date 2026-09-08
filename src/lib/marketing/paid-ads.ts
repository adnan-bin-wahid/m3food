import { z } from "zod";

export const PAID_AD_PROVIDERS = ["META", "GOOGLE"] as const;
export type PaidAdProvider = (typeof PAID_AD_PROVIDERS)[number];

export const paidAdProviderSchema = z.enum(PAID_AD_PROVIDERS);

const boundedText = (max: number, field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required.`)
    .max(max, `${field} is too long.`);

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function validIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const paidAdAccountCreateSchema = z.object({
  provider: paidAdProviderSchema,
  externalAccountId: boundedText(160, "External account ID"),
  name: boundedText(160, "Account name"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a three-letter ISO code."),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(64, "Timezone is too long.")
    .refine(validTimezone, "Timezone must be a valid IANA timezone."),
});

export type PaidAdAccountCreateInput = z.infer<
  typeof paidAdAccountCreateSchema
>;

export const paidAdCampaignMappingCreateSchema = z.object({
  accountId: z.string().uuid(),
  marketingCampaignId: z.string().uuid(),
  externalCampaignId: boundedText(160, "External campaign ID"),
  externalCampaignName: boundedText(255, "External campaign name"),
});

export type PaidAdCampaignMappingCreateInput = z.infer<
  typeof paidAdCampaignMappingCreateSchema
>;

export const paidAdDailyMetricUpsertSchema = z.object({
  mappingId: z.string().uuid(),
  metricDate: z
    .string()
    .trim()
    .refine(validIsoDate, "Metric date must be a valid YYYY-MM-DD date."),
  spendMinor: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(2_000_000_000),
  impressions: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(2_000_000_000),
  clicks: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(2_000_000_000),
});

export type PaidAdDailyMetricUpsertInput = z.infer<
  typeof paidAdDailyMetricUpsertSchema
>;

function finiteNonnegative(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function calculatePaidAdDelivery(input: {
  spendMinor: number;
  impressions: number;
  clicks: number;
}) {
  const spendMinor = finiteNonnegative(input.spendMinor);
  const impressions = finiteNonnegative(input.impressions);
  const clicks = finiteNonnegative(input.clicks);

  return {
    spendMinor,
    impressions,
    clicks,
    ctrPercent: impressions ? (clicks / impressions) * 100 : 0,
    cpcMinor: clicks ? spendMinor / clicks : 0,
    cpmMinor: impressions ? (spendMinor / impressions) * 1000 : 0,
  };
}
