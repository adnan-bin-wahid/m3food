import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local and configure PostgreSQL.",
    );
  }

  return drizzle(neon(databaseUrl), { schema });
}

/**
 * Lazily creates the database client so static pages can build before local
 * database credentials exist. Server-only callers should use this function.
 */
export function getDatabase() {
  database ??= createDatabase();
  return database;
}

export type Database = ReturnType<typeof getDatabase>;
