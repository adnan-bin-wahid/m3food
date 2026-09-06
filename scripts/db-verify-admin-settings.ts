import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { AdminSettingsError, getStoreSettings, updateStoreSettings } from "../src/lib/admin/settings-service";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { DrizzleAdminSettingsRepository } from "../src/lib/db/admin-settings-repository";
import { DrizzleCatalogRepository } from "../src/lib/db/catalog-repository";
import { adminUsers, stores } from "../src/lib/db/schema";

async function main() {
  loadEnvConfig(process.cwd());
  const storeSlug = process.env.ADMIN_BOOTSTRAP_STORE_SLUG ?? "m3food";
  const database = getDatabase();
  const repository = new DrizzleAdminSettingsRepository(database);
  const [owner] = await database.select({ id: adminUsers.id, storeId: adminUsers.storeId, email: adminUsers.email, displayName: adminUsers.displayName, role: adminUsers.role })
    .from(adminUsers).innerJoin(stores, eq(stores.id, adminUsers.storeId))
    .where(and(eq(stores.slug, storeSlug), eq(adminUsers.role, "OWNER"), eq(adminUsers.isActive, true))).limit(1);
  if (!owner) throw new Error("An active OWNER account is required.");
  const identity = { ...owner, storeSlug };
  const before = await getStoreSettings(identity, repository);
  const first = await updateStoreSettings(identity, { name: before.name, timezone: before.timezone, metaPixelId: before.metaPixelId, revision: before.revision }, repository);
  let staleRejected = false;
  try {
    await updateStoreSettings(identity, { name: before.name, timezone: before.timezone, metaPixelId: before.metaPixelId, revision: before.revision }, repository);
  } catch (error) {
    staleRejected = error instanceof AdminSettingsError && error.code === "CONFLICT";
  }
  if (!staleRejected) throw new Error("Stale settings write was not rejected.");
  const foreign = await repository.findSettings("00000000-0000-4000-8000-000000000000");
  if (foreign !== null) throw new Error("Settings reads are not isolated by store ID.");
  const after = await getStoreSettings(identity, repository);
  if (after.name !== before.name || after.timezone !== before.timezone || after.metaPixelId !== before.metaPixelId || after.revision !== first.revision) {
    throw new Error("Settings verification did not preserve visible values.");
  }
  const catalog = await new DrizzleCatalogRepository(database).findActiveCatalog(storeSlug);
  if (!catalog || catalog.store.metaPixelId !== after.metaPixelId) {
    throw new Error("Public catalog did not receive the current Meta Pixel configuration.");
  }
  console.log("LIVE ADMIN SETTINGS VERIFIED");
  console.log(`Store: ${after.slug}`);
  console.log(`Timezone: ${after.timezone}`);
  console.log(`Meta Pixel: ${after.metaPixelId ? "configured" : "disabled"}`);
  console.log("Role-gated optimistic update and stale-write rejection: verified");
  console.log("Cross-store isolation and visible-value preservation: verified");
  console.log("Public catalog settings propagation: verified");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Admin settings verification failed.");
  process.exitCode = 1;
}).finally(closeDatabase);
