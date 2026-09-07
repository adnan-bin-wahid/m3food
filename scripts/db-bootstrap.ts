import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getMigrationEnvironment } from "../src/lib/config/server-env";
import { createDatabaseClient } from "../src/lib/db";
import { seedStore } from "../src/lib/db/seed-store";
import { loadStoreConfig } from "../src/lib/db/store-config";
import { verifyStore } from "../src/lib/db/verify-store";

function getConfigPath() {
  const flagIndex = process.argv.indexOf("--config");
  const value = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  if (!value) throw new Error("Usage: db-bootstrap --config <store-config.json>");
  return path.resolve(process.cwd(), value);
}

async function main() {
  loadEnvConfig(process.cwd());
  const config = await loadStoreConfig(getConfigPath());
  const { MIGRATION_DATABASE_URL } = getMigrationEnvironment();
  const { client, database } = createDatabaseClient(MIGRATION_DATABASE_URL);

  try {
    await migrate(database, { migrationsFolder: path.resolve("drizzle") });
    const seeded = await seedStore(database, config);
    const verified = await verifyStore(database, config);

    console.log("SUPABASE BOOTSTRAP VERIFIED");
    console.log(`Store: ${verified.storeSlug} (${seeded.storeId})`);
    console.log(`Products: ${verified.productCount}`);
    console.log(`Variants: ${verified.variantCount}`);
    console.log(`RLS-protected tables: ${verified.rlsTableCount}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database bootstrap failed.");
  process.exitCode = 1;
});
