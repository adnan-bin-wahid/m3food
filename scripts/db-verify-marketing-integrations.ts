import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { getStoreSettings, updateStoreSettings } from "../src/lib/admin/settings-service";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { DrizzleAdminSettingsRepository } from "../src/lib/db/admin-settings-repository";
import { DrizzleCatalogRepository } from "../src/lib/db/catalog-repository";
import { adminUsers, stores } from "../src/lib/db/schema";
import { getMarketingEnvironment } from "../src/lib/config/server-env";
import { sendMetaCapiEvent } from "../src/lib/marketing/meta-capi";

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
  const temporaryGa4 = before.ga4MeasurementId || "G-VERIFY1234";
  const temporaryGtm = before.gtmContainerId || "GTM-VERIFY12";
  let currentRevision = before.revision;
  let restored = before;
  try {
    const updated = await updateStoreSettings(identity, {
      name: before.name,
      timezone: before.timezone,
      metaPixelId: before.metaPixelId,
      ga4MeasurementId: temporaryGa4,
      gtmContainerId: temporaryGtm,
      revision: currentRevision,
    }, repository);
    currentRevision = updated.revision;
    const catalog = await new DrizzleCatalogRepository(database).findActiveCatalog(storeSlug);
    if (!catalog || catalog.store.ga4MeasurementId !== temporaryGa4 || catalog.store.gtmContainerId !== temporaryGtm) {
      throw new Error("Public catalog did not receive GA4/GTM settings.");
    }
  } finally {
    if (currentRevision !== before.revision) {
      restored = await updateStoreSettings(identity, {
        name: before.name,
        timezone: before.timezone,
        metaPixelId: before.metaPixelId,
        ga4MeasurementId: before.ga4MeasurementId,
        gtmContainerId: before.gtmContainerId,
        revision: currentRevision,
      }, repository);
    }
  }
  if (restored.ga4MeasurementId !== before.ga4MeasurementId || restored.gtmContainerId !== before.gtmContainerId) throw new Error("Marketing settings were not restored.");

  const noConfig = getMarketingEnvironment({});
  let networkCalls = 0;
  const result = await sendMetaCapiEvent({
    pixelId: before.metaPixelId,
    analyticsAllowed: true,
    eventName: "PAGE_VIEW",
    eventId: "verify-event-id",
    occurredAt: new Date(),
  }, noConfig, (async () => { networkCalls += 1; return new Response("{}", { status: 200 }); }) as typeof fetch);
  if (result.sent || result.reason !== "CONFIG" || networkCalls !== 0) throw new Error("CAPI did not fail closed without server credentials.");

  console.log("LIVE MARKETING INTEGRATIONS VERIFIED");
  console.log(`Store: ${storeSlug}`);
  console.log("GA4/GTM settings revision and public propagation: verified");
  console.log("Marketing settings restore: verified");
  console.log("Meta CAPI fails closed without server credentials: verified");
  console.log("External Meta network call intentionally not required for local verification");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Marketing integration verification failed.");
  process.exitCode = 1;
}).finally(closeDatabase);
