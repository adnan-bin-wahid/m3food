import { z } from "zod";

const BANGLA_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (digit) => BANGLA_DIGITS[digit] ?? digit);
}

export function normalizeBangladeshMobile(raw: string): string {
  const compact = toAsciiDigits(raw.trim())
    .replace(/[()\s.-]/g, "");

  let normalized = compact;
  if (normalized.startsWith("+880")) {
    normalized = `0${normalized.slice(4)}`;
  } else if (normalized.startsWith("880")) {
    normalized = `0${normalized.slice(3)}`;
  }

  if (!/^01[3-9]\d{8}$/.test(normalized)) {
    throw new Error(
      "Use a valid Bangladesh mobile number such as 017XXXXXXXX, +88017XXXXXXXX, or 88017XXXXXXXX.",
    );
  }

  return normalized;
}

export const bangladeshMobileSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, context) => {
    try {
      return normalizeBangladeshMobile(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Use a valid Bangladesh mobile number.",
      });
      return z.NEVER;
    }
  });

export function toBangladeshE164(phone: string) {
  const normalized = normalizeBangladeshMobile(phone);
  return `+880${normalized.slice(1)}`;
}

export function maskBangladeshMobile(phone: string) {
  const normalized = normalizeBangladeshMobile(phone);
  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}
