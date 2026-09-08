import { timingSafeEqual } from "node:crypto";

export function getCronSecret(
  environment: Record<string, string | undefined> = process.env,
) {
  const value = environment.CRON_SECRET?.trim();
  if (!value) return null;

  if (value.length < 16) {
    throw new Error(
      "CRON_SECRET must contain at least 16 characters when configured.",
    );
  }

  return value;
}

export function isCronAuthorizationValid(
  authorizationHeader: string | null,
  secret: string,
) {
  const expected = `Bearer ${secret}`;
  const actual = authorizationHeader ?? "";

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
