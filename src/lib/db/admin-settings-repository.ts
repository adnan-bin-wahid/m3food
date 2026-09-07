import { and, eq, sql } from "drizzle-orm";
import type {
  AdminSettingsRepository,
  StoreSettingsUpdate,
  StoreSettingsUpdateResult,
} from "../admin/settings-repository";
import { getDatabase, type Database } from "./index";
import { stores } from "./schema";

const settingsSelection = {
  name: stores.name,
  slug: stores.slug,
  currency: stores.currency,
  timezone: stores.timezone,
  metaPixelId: stores.metaPixelId,
  ga4MeasurementId: stores.ga4MeasurementId,
  gtmContainerId: stores.gtmContainerId,
  clarityProjectId: stores.clarityProjectId,
  revision: stores.settingsRevision,
};

export class DrizzleAdminSettingsRepository implements AdminSettingsRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async findSettings(storeId: string) {
    const [settings] = await this.database
      .select(settingsSelection)
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    return settings ?? null;
  }

  async updateSettings(input: StoreSettingsUpdate): Promise<StoreSettingsUpdateResult> {
    const [settings] = await this.database
      .update(stores)
      .set({
        name: input.name,
        timezone: input.timezone,
        metaPixelId: input.metaPixelId,
        ga4MeasurementId: input.ga4MeasurementId,
        gtmContainerId: input.gtmContainerId,
        clarityProjectId: input.clarityProjectId,
        settingsRevision: sql`${stores.settingsRevision} + 1`,
        updatedAt: sql`now()`,
      })
      .where(and(
        eq(stores.id, input.storeId),
        eq(stores.settingsRevision, input.expectedRevision),
      ))
      .returning(settingsSelection);

    if (settings) return { kind: "UPDATED", settings };

    const [store] = await this.database
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.id, input.storeId))
      .limit(1);
    return store ? { kind: "CONFLICT" } : { kind: "NOT_FOUND" };
  }
}
