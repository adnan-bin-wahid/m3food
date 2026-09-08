import { z } from "zod";
import type { PaidAdProvider } from "./paid-ads";

export interface PaidAdsProviderAccount {
  id: string;
  provider: PaidAdProvider;
  externalAccountId: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface PaidAdsProviderMapping {
  id: string;
  externalCampaignId: string;
  externalCampaignName: string;
}

export interface PaidAdsProviderDailyMetric {
  externalCampaignId: string;
  metricDate: string;
  spendMinor: number;
  impressions: number;
  clicks: number;
}

export interface PaidAdsProviderClient {
  readonly provider: PaidAdProvider;

  fetchDailyMetrics(input: {
    account: PaidAdsProviderAccount;
    mappings: PaidAdsProviderMapping[];
    startDate: string;
    endDate: string;
  }): Promise<PaidAdsProviderDailyMetric[]>;
}

export const providerDailyMetricSchema = z.object({
  externalCampaignId: z.string().trim().min(1).max(160),
  metricDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  spendMinor: z.number().int().nonnegative().max(2_000_000_000),
  impressions: z.number().int().nonnegative().max(2_000_000_000),
  clicks: z.number().int().nonnegative().max(2_000_000_000),
});

function requireNonnegativeIntegerString(
  value: unknown,
  field: string,
) {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${field} must be a nonnegative integer.`);
  }
  return raw;
}

export function parseProviderCount(
  value: unknown,
  field = "Provider metric",
) {
  const raw = requireNonnegativeIntegerString(value, field);
  const parsed = Number(raw);

  if (!Number.isSafeInteger(parsed) || parsed > 2_000_000_000) {
    throw new Error(`${field} is outside the supported range.`);
  }

  return parsed;
}

export function decimalMajorToMinor(
  value: unknown,
  minorDigits = 2,
) {
  if (
    !Number.isInteger(minorDigits) ||
    minorDigits < 0 ||
    minorDigits > 6
  ) {
    throw new Error("Unsupported currency minor-unit precision.");
  }

  const raw = String(value ?? "").trim();

  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    throw new Error(
      "Provider spend must be a nonnegative decimal.",
    );
  }

  const [wholeRaw, fractionRaw = ""] = raw.split(".");

  const whole = wholeRaw.replace(/^0+(?=\d)/, "");
  const padded = fractionRaw.padEnd(minorDigits + 1, "0");

  const kept =
    minorDigits === 0
      ? ""
      : padded.slice(0, minorDigits);

  const roundDigit = Number(
    padded[minorDigits] ?? "0",
  );

  const scale = 10 ** minorDigits;

  const wholeNumber = Number(whole || "0");
  const fractionNumber = Number(kept || "0");

  if (
    !Number.isSafeInteger(wholeNumber) ||
    !Number.isSafeInteger(fractionNumber)
  ) {
    throw new Error(
      "Provider spend is outside the supported range.",
    );
  }

  let minor =
    wholeNumber * scale +
    fractionNumber;

  if (!Number.isSafeInteger(minor)) {
    throw new Error(
      "Provider spend is outside the supported range.",
    );
  }

  if (roundDigit >= 5) {
    minor += 1;
  }

  if (
    !Number.isSafeInteger(minor) ||
    minor > 2_000_000_000
  ) {
    throw new Error(
      "Provider spend is outside the supported range.",
    );
  }

  return minor;
}

export function microsToMinor(
  value: unknown,
  minorDigits = 2,
) {
  if (
    !Number.isInteger(minorDigits) ||
    minorDigits < 0 ||
    minorDigits > 6
  ) {
    throw new Error("Unsupported currency minor-unit precision.");
  }

  const raw = requireNonnegativeIntegerString(
    value,
    "Provider cost micros",
  );

  const micros = Number(raw);

  if (!Number.isSafeInteger(micros)) {
    throw new Error(
      "Provider spend is outside the supported range.",
    );
  }

  const divisor = 10 ** (6 - minorDigits);

  const minor = Math.floor(
    (micros + divisor / 2) / divisor,
  );

  if (
    !Number.isSafeInteger(minor) ||
    minor > 2_000_000_000
  ) {
    throw new Error(
      "Provider spend is outside the supported range.",
    );
  }

  return minor;
}
