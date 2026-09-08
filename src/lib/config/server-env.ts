import { z } from "zod";

const postgresUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "DATABASE_URL must use the postgres:// or postgresql:// protocol.",
  );

export const serverEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
});

export const migrationEnvironmentSchema = z.object({
  MIGRATION_DATABASE_URL: postgresUrlSchema,
});

export const orderApiEnvironmentSchema = serverEnvironmentSchema.extend({
  RATE_LIMIT_SALT: z.string().trim().min(32),
});

export const adminAuthEnvironmentSchema = orderApiEnvironmentSchema.extend({
  ADMIN_SESSION_SECRET: z.string().trim().min(32),
});

const optionalSecret = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

export const marketingEnvironmentSchema = z.object({
  META_CAPI_ACCESS_TOKEN: optionalSecret,
  META_GRAPH_API_VERSION: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().regex(/^v\d+\.\d+$/, "Use a Meta Graph API version such as vXX.X.").optional(),
  ),
  META_CAPI_TEST_EVENT_CODE: optionalSecret,
}).superRefine((value, context) => {
  if (Boolean(value.META_CAPI_ACCESS_TOKEN) !== Boolean(value.META_GRAPH_API_VERSION)) {
    context.addIssue({
      code: "custom",
      path: ["META_CAPI_ACCESS_TOKEN"],
      message: "META_CAPI_ACCESS_TOKEN and META_GRAPH_API_VERSION must be configured together.",
    });
  }
});


const optionalBoolean = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return value;
  },
  z.boolean().optional(),
);

export const sslCommerzEnvironmentSchema = z.object({
  SSLCOMMERZ_STORE_ID: optionalSecret,
  SSLCOMMERZ_STORE_PASSWORD: optionalSecret,
  SSLCOMMERZ_SANDBOX: optionalBoolean.default(true),
}).superRefine((value, context) => {
  if (
    Boolean(value.SSLCOMMERZ_STORE_ID) !==
    Boolean(value.SSLCOMMERZ_STORE_PASSWORD)
  ) {
    context.addIssue({
      code: "custom",
      path: ["SSLCOMMERZ_STORE_ID"],
      message:
        "SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD must be configured together.",
    });
  }
});

export const steadfastEnvironmentSchema = z.object({
  STEADFAST_BASE_URL: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url().default("https://portal.packzy.com/api/v1"),
  ),
  STEADFAST_API_KEY: optionalSecret,
  STEADFAST_SECRET_KEY: optionalSecret,
}).superRefine((value, context) => {
  if (Boolean(value.STEADFAST_API_KEY) !== Boolean(value.STEADFAST_SECRET_KEY)) {
    context.addIssue({
      code: "custom",
      path: ["STEADFAST_API_KEY"],
      message: "STEADFAST_API_KEY and STEADFAST_SECRET_KEY must be configured together.",
    });
  }
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type MigrationEnvironment = z.infer<typeof migrationEnvironmentSchema>;
export type OrderApiEnvironment = z.infer<typeof orderApiEnvironmentSchema>;
export type AdminAuthEnvironment = z.infer<typeof adminAuthEnvironmentSchema>;
export type MarketingEnvironment = z.infer<typeof marketingEnvironmentSchema>;
export type SteadfastEnvironment = z.infer<typeof steadfastEnvironmentSchema>;
export type SslCommerzEnvironment = z.infer<typeof sslCommerzEnvironmentSchema>;

export function getServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(
      `Invalid server environment: ${details}. Copy .env.example to .env.local and configure PostgreSQL.`,
    );
  }

  return result.data;
}

export function getMigrationEnvironment(
  environment: Record<string, string | undefined> = process.env,
): MigrationEnvironment {
  const result = migrationEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(
      `Invalid migration environment: ${details}. Configure MIGRATION_DATABASE_URL with the Supabase direct or session-pooler URL.`,
    );
  }

  return result.data;
}

export function getOrderApiEnvironment(
  environment: Record<string, string | undefined> = process.env,
): OrderApiEnvironment {
  const result = orderApiEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(
      `Invalid order API environment: ${details}. Configure server-only DATABASE_URL and RATE_LIMIT_SALT.`,
    );
  }

  return result.data;
}

export function getAdminAuthEnvironment(
  environment: Record<string, string | undefined> = process.env,
): AdminAuthEnvironment {
  const result = adminAuthEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invalid admin authentication environment: ${details}. Configure DATABASE_URL, RATE_LIMIT_SALT, and server-only ADMIN_SESSION_SECRET.`,
    );
  }

  return result.data;
}

export function getMarketingEnvironment(
  environment: Record<string, string | undefined> = process.env,
): MarketingEnvironment {
  const result = marketingEnvironmentSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid marketing environment: ${details}. Configure Meta CAPI server credentials together or leave both unset.`);
  }
  return result.data;
}

export function getSslCommerzEnvironment(
  environment: Record<string, string | undefined> = process.env,
): SslCommerzEnvironment {
  const result = sslCommerzEnvironmentSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invalid SSLCommerz environment: ${details}. Configure both server-only gateway credentials together or leave both unset.`,
    );
  }
  return result.data;
}

export function getSteadfastEnvironment(
  environment: Record<string, string | undefined> = process.env,
): SteadfastEnvironment {
  const result = steadfastEnvironmentSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid Steadfast environment: ${details}. Configure both courier credentials together or leave both unset.`);
  }
  return result.data;
}
export function getMarketingPreferenceSecret(
  environment: Record<string, string | undefined> = process.env,
) {
  const dedicated = environment.MARKETING_PREFERENCE_SECRET?.trim();
  if (dedicated) return dedicated;
  return getOrderApiEnvironment(environment).RATE_LIMIT_SALT;
}
