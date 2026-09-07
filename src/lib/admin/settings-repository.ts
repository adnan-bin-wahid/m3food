export interface StoreSettings {
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  metaPixelId: string;
  ga4MeasurementId: string;
  gtmContainerId: string;
  revision: number;
}

export interface StoreSettingsUpdate {
  storeId: string;
  expectedRevision: number;
  name: string;
  timezone: string;
  metaPixelId: string;
  ga4MeasurementId: string;
  gtmContainerId: string;
}

export type StoreSettingsUpdateResult =
  | { kind: "UPDATED"; settings: StoreSettings }
  | { kind: "CONFLICT" }
  | { kind: "NOT_FOUND" };

export interface AdminSettingsRepository {
  findSettings(storeId: string): Promise<StoreSettings | null>;
  updateSettings(input: StoreSettingsUpdate): Promise<StoreSettingsUpdateResult>;
}
