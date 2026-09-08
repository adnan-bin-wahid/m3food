import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const optionalMetaVersion = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .regex(/^v\d+\.\d+$/, "Use a Meta API version such as vXX.X.")
    .optional(),
);

const optionalGoogleVersion = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .regex(/^v\d+$/, "Use a Google Ads API version such as vXX.")
    .optional(),
);

const optionalCustomerId = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .regex(/^\d{3}-?\d{3}-?\d{4}$/, "Use a Google Ads customer ID.")
    .optional(),
);

export const paidAdsSyncEnvironmentSchema = z
  .object({
    META_ADS_ACCESS_TOKEN: optionalSecret,
    META_ADS_API_VERSION: optionalMetaVersion,

    GOOGLE_ADS_DEVELOPER_TOKEN: optionalSecret,
    GOOGLE_ADS_CLIENT_ID: optionalSecret,
    GOOGLE_ADS_CLIENT_SECRET: optionalSecret,
    GOOGLE_ADS_REFRESH_TOKEN: optionalSecret,
    GOOGLE_ADS_API_VERSION: optionalGoogleVersion,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: optionalCustomerId,
  })
  .superRefine((value, context) => {
    const metaValues = [
      value.META_ADS_ACCESS_TOKEN,
      value.META_ADS_API_VERSION,
    ];
    const metaConfigured = metaValues.filter(Boolean).length;
    if (metaConfigured > 0 && metaConfigured !== metaValues.length) {
      context.addIssue({
        code: "custom",
        path: ["META_ADS_ACCESS_TOKEN"],
        message:
          "META_ADS_ACCESS_TOKEN and META_ADS_API_VERSION must be configured together.",
      });
    }

    const googleValues = [
      value.GOOGLE_ADS_DEVELOPER_TOKEN,
      value.GOOGLE_ADS_CLIENT_ID,
      value.GOOGLE_ADS_CLIENT_SECRET,
      value.GOOGLE_ADS_REFRESH_TOKEN,
      value.GOOGLE_ADS_API_VERSION,
    ];
    const googleConfigured = googleValues.filter(Boolean).length;
    if (
      googleConfigured > 0 &&
      googleConfigured !== googleValues.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        message:
          "Google Ads developer token, OAuth client credentials, refresh token and API version must be configured together.",
      });
    }

    if (
      value.GOOGLE_ADS_LOGIN_CUSTOMER_ID &&
      googleConfigured !== googleValues.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"],
        message:
          "GOOGLE_ADS_LOGIN_CUSTOMER_ID requires the complete Google Ads credential set.",
      });
    }
  });

export type PaidAdsSyncEnvironment = z.infer<
  typeof paidAdsSyncEnvironmentSchema
>;

export function getPaidAdsSyncEnvironment(
  environment: Record<string, string | undefined> = process.env,
): PaidAdsSyncEnvironment {
  const result = paidAdsSyncEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) =>
          `${issue.path.join(".")}: ${issue.message}`,
      )
      .join("; ");

    throw new Error(
      `Invalid paid ads sync environment: ${details}. Keep provider credentials server-only and configure a complete provider credential set or leave it unset.`,
    );
  }

  return result.data;
}

export function getPaidAdsProviderReadiness(
  environment: Record<string, string | undefined> = process.env,
) {
  const value = getPaidAdsSyncEnvironment(environment);

  return {
    META: Boolean(
      value.META_ADS_ACCESS_TOKEN &&
        value.META_ADS_API_VERSION,
    ),
    GOOGLE: Boolean(
      value.GOOGLE_ADS_DEVELOPER_TOKEN &&
        value.GOOGLE_ADS_CLIENT_ID &&
        value.GOOGLE_ADS_CLIENT_SECRET &&
        value.GOOGLE_ADS_REFRESH_TOKEN &&
        value.GOOGLE_ADS_API_VERSION,
    ),
  } as const;
}
