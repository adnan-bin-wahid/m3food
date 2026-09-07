import { z } from "zod";

export const campaignStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

function optionalText(maxLength: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const normalized = typeof value === "string" ? value.trim() : "";
      return normalized ? normalized.slice(0, maxLength) : null;
    });
}

export function normalizeCampaignKey(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 120);
}

export function normalizeCampaignDimension(value: unknown, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\s+/g, "-").slice(0, maxLength);
}

export const campaignCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    campaignKey: z
      .unknown()
      .transform(normalizeCampaignKey)
      .pipe(
        z
          .string()
          .min(1, "Campaign key is required.")
          .max(120)
          .regex(
            /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
            "Campaign key must use lowercase letters, numbers, hyphens or underscores.",
          ),
      ),
    source: z
      .unknown()
      .transform((value) => normalizeCampaignDimension(value, 120))
      .pipe(z.string().min(1, "UTM source is required.").max(120)),
    medium: z
      .unknown()
      .transform((value) => normalizeCampaignDimension(value, 120))
      .pipe(z.string().min(1, "UTM medium is required.").max(120)),
    content: optionalText(160),
    term: optionalText(160),
    landingUrl: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        const normalized = typeof value === "string" ? value.trim() : "";
        return normalized || null;
      })
      .refine(
        (value) => {
          if (!value) return true;
          try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        },
        "Landing URL must be a valid http(s) URL.",
      ),
    notes: optionalText(2000),
    status: campaignStatusSchema.default("DRAFT"),
  })
  .strict();

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export interface CampaignUtmParameters {
  campaignKey: string;
  source: string;
  medium: string;
  content?: string | null;
  term?: string | null;
}

export function buildCampaignUtmUrl(
  baseUrl: string,
  campaign: CampaignUtmParameters,
) {
  const parsed = new URL(baseUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("UTM Builder requires an http(s) URL.");
  }

  parsed.searchParams.set("utm_source", campaign.source);
  parsed.searchParams.set("utm_medium", campaign.medium);
  parsed.searchParams.set("utm_campaign", campaign.campaignKey);

  if (campaign.content) parsed.searchParams.set("utm_content", campaign.content);
  else parsed.searchParams.delete("utm_content");

  if (campaign.term) parsed.searchParams.set("utm_term", campaign.term);
  else parsed.searchParams.delete("utm_term");

  return parsed.toString();
}

export interface CampaignTouchCandidate {
  sessionKey: string;
  startedAt: Date;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
}

export interface CampaignTouchSnapshot {
  sessionKey: string;
  occurredAt: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  referrer: string | null;
  landingPage: string | null;
}

function hasMeaningfulCampaignTouch(session: CampaignTouchCandidate) {
  return Boolean(
    session.utmCampaign ||
      session.utmSource ||
      session.utmMedium ||
      session.referrer,
  );
}

function toTouchSnapshot(
  session: CampaignTouchCandidate,
): CampaignTouchSnapshot {
  return {
    sessionKey: session.sessionKey,
    occurredAt: session.startedAt.toISOString(),
    source: session.utmSource ?? null,
    medium: session.utmMedium ?? null,
    campaign: session.utmCampaign ?? null,
    content: session.utmContent ?? null,
    term: session.utmTerm ?? null,
    referrer: session.referrer ?? null,
    landingPage: session.landingPage ?? null,
  };
}

export function selectFirstLastCampaignTouches(
  sessions: CampaignTouchCandidate[],
) {
  const ordered = [...sessions]
    .filter(hasMeaningfulCampaignTouch)
    .sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime());

  return {
    firstTouch: ordered[0] ? toTouchSnapshot(ordered[0]) : null,
    lastTouch: ordered.at(-1) ? toTouchSnapshot(ordered.at(-1)!) : null,
  };
}
