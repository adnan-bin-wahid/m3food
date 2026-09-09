import { toBangladeshE164 } from "../commerce/bd-phone";

export type OtpDeliveryMode = "DISABLED" | "DEV" | "WEBHOOK";

export interface OtpDeliveryEnvironment {
  PHONE_OTP_DELIVERY_MODE: OtpDeliveryMode;
  PHONE_OTP_WEBHOOK_URL?: string;
  PHONE_OTP_WEBHOOK_BEARER_TOKEN?: string;
}

export class OtpDeliveryError extends Error {
  constructor(
    public readonly code:
      | "NOT_CONFIGURED"
      | "UNSAFE_DEV_MODE"
      | "NETWORK"
      | "PROVIDER_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "OtpDeliveryError";
  }
}

export async function deliverOrderOtp(
  input: {
    phone: string;
    code: string;
    expiresInMinutes: number;
  },
  environment: OtpDeliveryEnvironment,
  fetchImpl: typeof fetch = fetch,
) {
  if (environment.PHONE_OTP_DELIVERY_MODE === "DISABLED") {
    throw new OtpDeliveryError(
      "NOT_CONFIGURED",
      "Phone OTP delivery is not configured.",
    );
  }

  if (environment.PHONE_OTP_DELIVERY_MODE === "DEV") {
    if (process.env.NODE_ENV === "production") {
      throw new OtpDeliveryError(
        "UNSAFE_DEV_MODE",
        "Development OTP delivery cannot run in production.",
      );
    }
    console.info(`[DEV OTP] ${input.phone}: ${input.code}`);
    return { devCode: input.code };
  }

  if (!environment.PHONE_OTP_WEBHOOK_URL) {
    throw new OtpDeliveryError(
      "NOT_CONFIGURED",
      "Phone OTP webhook URL is missing.",
    );
  }

  let response: Response;
  try {
    response = await fetchImpl(environment.PHONE_OTP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(environment.PHONE_OTP_WEBHOOK_BEARER_TOKEN
          ? {
              Authorization: `Bearer ${environment.PHONE_OTP_WEBHOOK_BEARER_TOKEN}`,
            }
          : {}),
      },
      body: JSON.stringify({
        to: toBangladeshE164(input.phone),
        purpose: "ORDER_CONFIRMATION",
        message: `Your order verification code is ${input.code}. It expires in ${input.expiresInMinutes} minutes.`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new OtpDeliveryError(
      "NETWORK",
      error instanceof Error ? error.message : "OTP delivery request failed.",
    );
  }

  if (!response.ok) {
    throw new OtpDeliveryError(
      "PROVIDER_ERROR",
      `OTP delivery provider returned HTTP ${response.status}.`,
    );
  }

  return {};
}
