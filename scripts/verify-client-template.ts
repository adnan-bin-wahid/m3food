import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { loadStoreConfig } from "../src/lib/db/store-config";

function getConfigPath() {
  const flagIndex = process.argv.indexOf("--config");
  const value = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  if (!value) {
    throw new Error(
      "Usage: npm run verify:client-config -- --config config/stores/<store>.json",
    );
  }
  return path.resolve(process.cwd(), value);
}

function requireSlug(name: "DEFAULT_STORE_SLUG" | "NEXT_PUBLIC_STORE_SLUG") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  loadEnvConfig(process.cwd());

  const config = await loadStoreConfig(getConfigPath());
  const serverSlug = requireSlug("DEFAULT_STORE_SLUG");
  const publicSlug = requireSlug("NEXT_PUBLIC_STORE_SLUG");

  if (serverSlug !== publicSlug) {
    throw new Error(
      "DEFAULT_STORE_SLUG and NEXT_PUBLIC_STORE_SLUG must match for a single-client deployment.",
    );
  }

  if (config.store.slug !== serverSlug) {
    throw new Error(
      "The store config slug must match DEFAULT_STORE_SLUG and NEXT_PUBLIC_STORE_SLUG.",
    );
  }

  console.log("CLIENT TEMPLATE CONFIG VERIFIED");
  console.log(`Store: ${config.store.name} (${config.store.slug})`);
  console.log("Runtime store identity: matched");
  console.log(`Products configured: ${config.products.length}`);
  console.log(`Launch status: ${config.store.status}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Client template verification failed.");
  process.exitCode = 1;
});
