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

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type MigrationEnvironment = z.infer<typeof migrationEnvironmentSchema>;

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
