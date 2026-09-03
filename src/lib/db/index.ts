import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getServerEnvironment } from "../config/server-env";
import * as schema from "./schema";

type DatabaseState = ReturnType<typeof createDatabase>;

const globalForDatabase = globalThis as typeof globalThis & {
  __landingCommerceDatabase?: DatabaseState;
};

function createDatabase() {
  const { DATABASE_URL } = getServerEnvironment();
  const client = postgres(DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  return {
    client,
    database: drizzle(client, { schema }),
  };
}

/**
 * Lazily creates the database client so static pages can build before local
 * database credentials exist. Server-only callers should use this function.
 */
export function getDatabase() {
  globalForDatabase.__landingCommerceDatabase ??= createDatabase();
  return globalForDatabase.__landingCommerceDatabase.database;
}

export type Database = ReturnType<typeof getDatabase>;
