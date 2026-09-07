import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getServerEnvironment } from "../config/server-env";
import * as schema from "./schema";

export function createDatabaseClient(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  return {
    client,
    database: drizzle(client, { schema }),
  };
}

type DatabaseState = ReturnType<typeof createDatabaseClient>;

const globalForDatabase = globalThis as typeof globalThis & {
  __landingCommerceDatabase?: DatabaseState;
};

function createDatabase() {
  const { DATABASE_URL } = getServerEnvironment();
  return createDatabaseClient(DATABASE_URL);
}

/**
 * Lazily creates the database client so static pages can build before local
 * database credentials exist. Server-only callers should use this function.
 */
export function getDatabase() {
  globalForDatabase.__landingCommerceDatabase ??= createDatabase();
  return globalForDatabase.__landingCommerceDatabase.database;
}

export async function closeDatabase() {
  const state = globalForDatabase.__landingCommerceDatabase;
  if (!state) return;

  delete globalForDatabase.__landingCommerceDatabase;
  await state.client.end();
}

export type Database = ReturnType<typeof getDatabase>;
