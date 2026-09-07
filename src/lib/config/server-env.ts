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

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type MigrationEnvironment = z.infer<typeof migrationEnvironmentSchema>;
export type OrderApiEnvironment = z.infer<typeof orderApiEnvironmentSchema>;
export type AdminAuthEnvironment = z.infer<typeof adminAuthEnvironmentSchema>;
export type MarketingEnvironment = z.infer<typeof marketingEnvironmentSchema>;

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
