import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { privacyPolicyVersionSchema } from "../commerce/contracts";

const tokenPayloadSchema = z.object({
  storeId: z.uuid(),
  customerId: z.uuid(),
});

export const marketingPreferenceUpdateSchema = z.object({
  emailMarketingAllowed: z.boolean(),
  smsMarketingAllowed: z.boolean(),
  whatsappMarketingAllowed: z.boolean(),
  privacyPolicyVersion: privacyPolicyVersionSchema,
});

export interface MarketingPreferenceState {
  storeId: string;
  customerId: string;
  storeName: string;
  customerName: string;
  email: string | null;
  phone: string;
  emailMarketingAllowed: boolean;
  smsMarketingAllowed: boolean;
  whatsappMarketingAllowed: boolean;
  privacyPolicyVersion: string;
  updatedAt: Date;
}

export interface MarketingPreferenceRepository {
  getPreference(storeId: string, customerId: string): Promise<MarketingPreferenceState | null>;
  updatePreference(input: {
    storeId: string;
    customerId: string;
    emailMarketingAllowed: boolean;
    smsMarketingAllowed: boolean;
    whatsappMarketingAllowed: boolean;
    privacyPolicyVersion: string;
    now: Date;
  }): Promise<MarketingPreferenceState | null>;
}

function signature(body: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`marketing-preferences\u0000${body}`)
    .digest("base64url");
}

export function createMarketingPreferenceToken(
  input: { storeId: string; customerId: string },
  secret: string,
) {
  const payload = tokenPayloadSchema.parse(input);
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signature(body, secret)}`;
}

export function parseMarketingPreferenceToken(token: unknown, secret: string) {
  if (typeof token !== "string" || token.length < 40 || token.length > 512) return null;
  const [body, provided, extra] = token.split(".");
  if (!body || !provided || extra) return null;
  const expected = signature(body, secret);
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const parsed = tokenPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function getMarketingPreference(
  token: unknown,
  secret: string,
  repository: MarketingPreferenceRepository,
) {
  const identity = parseMarketingPreferenceToken(token, secret);
  if (!identity) return null;
  return repository.getPreference(identity.storeId, identity.customerId);
}

export async function updateMarketingPreference(
  token: unknown,
  rawInput: unknown,
  secret: string,
  repository: MarketingPreferenceRepository,
  now = new Date(),
) {
  const identity = parseMarketingPreferenceToken(token, secret);
  if (!identity) return null;
  const input = marketingPreferenceUpdateSchema.parse(rawInput);
  return repository.updatePreference({ ...identity, ...input, now });
}
