import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { getMigrationEnvironment } from "../src/lib/config/server-env";
import { createDatabaseClient } from "../src/lib/db";
import { loadStoreConfig } from "../src/lib/db/store-config";
import { verifyStore } from "../src/lib/db/verify-store";

function getConfigPath() {
  const flagIndex = process.argv.indexOf("--config");
  const value = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  if (!value) throw new Error("Usage: db-verify --config <store-config.json>");
  return path.resolve(process.cwd(), value);
}

async function main() {
  loadEnvConfig(process.cwd());
  const config = await loadStoreConfig(getConfigPath());
  const { MIGRATION_DATABASE_URL } = getMigrationEnvironment();
  const { client, database } = createDatabaseClient(MIGRATION_DATABASE_URL);

  try {
    const verified = await verifyStore(database, config);
    console.log("LIVE SUPABASE DATA VERIFIED");
    console.log(`Store: ${verified.storeSlug} (${verified.storeId})`);
    console.log(`Products: ${verified.productCount}`);
    console.log(`Variants: ${verified.variantCount}`);
    console.log(`RLS-protected tables: ${verified.rlsTableCount}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database verification failed.");
  process.exitCode = 1;
});
