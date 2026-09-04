import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { getStoreCatalog } from "../src/lib/commerce/catalog-service";
import { getOrderApiEnvironment } from "../src/lib/config/server-env";
import { DrizzleCatalogRepository } from "../src/lib/db/catalog-repository";
import { createDatabaseClient } from "../src/lib/db";
import { DrizzleRateLimiter } from "../src/lib/db/rate-limiter";
import { requestRateLimits } from "../src/lib/db/schema";

async function main() {
  loadEnvConfig(process.cwd());
  const { DATABASE_URL, RATE_LIMIT_SALT } = getOrderApiEnvironment();
  const { client, database } = createDatabaseClient(DATABASE_URL);
  const verificationScope = `batch-04-verification:${randomUUID()}`;

  try {
    const catalog = await getStoreCatalog(
      "m3food",
      new DrizzleCatalogRepository(database),
    );
    if (catalog.products.length < 1) {
      throw new Error("Runtime catalog verification found no active products.");
    }

    const limiter = new DrizzleRateLimiter(RATE_LIMIT_SALT, database);
    const decision = await limiter.consume({
      scope: verificationScope,
      key: "local-live-verification",
      limit: 2,
      windowMs: 60_000,
      now: new Date(),
    });
    if (!decision.allowed || decision.remaining !== 1) {
      throw new Error("Runtime rate-limit verification returned invalid state.");
    }

    console.log("LIVE ORDER API FOUNDATION VERIFIED");
    console.log(`Store: ${catalog.store.slug}`);
    console.log(`Active products: ${catalog.products.length}`);
    console.log("Runtime transaction pooler: connected");
    console.log("Persistent HMAC rate limiter: writable");
  } finally {
    await database
      .delete(requestRateLimits)
      .where(eq(requestRateLimits.scope, verificationScope));
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Live API verification failed.",
  );
  process.exitCode = 1;
});
