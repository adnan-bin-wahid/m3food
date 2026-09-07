import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminSettingsRepository,
  StoreSettings,
} from "./settings-repository";
import {
  AdminSettingsError,
  canEditStoreSettings,
  getStoreSettings,
  storeSettingsInputSchema,
  updateStoreSettings,
} from "./settings-service";

const owner: AdminIdentity = {
  id: "admin-1",
  storeId: "store-1",
  storeSlug: "m3food",
  email: "owner@example.com",
  displayName: "Owner",
  role: "OWNER",
};

const settings: StoreSettings = {
  name: "M3Food",
  slug: "m3food",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  metaPixelId: "",
  ga4MeasurementId: "",
  gtmContainerId: "",
  revision: 2,
};

function repository(
  updateSettings: AdminSettingsRepository["updateSettings"] = async () => ({
    kind: "UPDATED",
    settings: { ...settings, revision: 3 },
  }),
): AdminSettingsRepository {
  return {
    async findSettings(storeId) {
      return storeId === "store-1" ? settings : null;
    },
    updateSettings,
  };
}

test("only OWNER and ADMIN can edit store settings", () => {
  assert.equal(canEditStoreSettings("OWNER"), true);
  assert.equal(canEditStoreSettings("ADMIN"), true);
  assert.equal(canEditStoreSettings("ORDER_MANAGER"), false);
  assert.equal(canEditStoreSettings("ANALYST"), false);
});

test("settings input validates timezone and marketing integration IDs", () => {
  assert.equal(storeSettingsInputSchema.safeParse({
    name: " M3Food ",
    timezone: "Asia/Dhaka",
    metaPixelId: "123456789012345",
    ga4MeasurementId: "G-ABC12345",
    gtmContainerId: "GTM-ABC1234",
    revision: 0,
  }).success, true);
  assert.equal(storeSettingsInputSchema.safeParse({
    name: "M3Food",
    timezone: "Dhaka",
    metaPixelId: "pixel-secret",
    ga4MeasurementId: "bad-ga4",
    gtmContainerId: "bad-gtm",
    revision: -1,
  }).success, false);
});

test("settings reads and updates are scoped to authenticated store ID", async () => {
  let received = null;
  const result = await updateStoreSettings(
    owner,
    {
      name: " M3Food Live ",
      timezone: "Asia/Dhaka",
      metaPixelId: "123456789012345",
      ga4MeasurementId: "G-ABC12345",
      gtmContainerId: "GTM-ABC1234",
      revision: 2,
    },
    repository(async (input) => {
      received = input;
      return {
        kind: "UPDATED",
        settings: {
          ...settings,
          name: input.name,
          metaPixelId: input.metaPixelId,
          ga4MeasurementId: input.ga4MeasurementId,
          gtmContainerId: input.gtmContainerId,
          revision: 3,
        },
      };
    }),
  );
  assert.deepEqual(received, {
    storeId: "store-1",
    expectedRevision: 2,
    name: "M3Food Live",
    timezone: "Asia/Dhaka",
    metaPixelId: "123456789012345",
    ga4MeasurementId: "G-ABC12345",
    gtmContainerId: "GTM-ABC1234",
  });
  assert.equal(result.revision, 3);
  assert.equal((await getStoreSettings(owner, repository())).slug, "m3food");
});

test("read-only roles and stale revisions fail closed", async () => {
  const input = {
    name: settings.name,
    timezone: settings.timezone,
    metaPixelId: settings.metaPixelId,
    ga4MeasurementId: settings.ga4MeasurementId,
    gtmContainerId: settings.gtmContainerId,
    revision: settings.revision,
  };
  await assert.rejects(
    updateStoreSettings(
      { ...owner, role: "ANALYST" },
      input,
      repository(async () => { throw new Error("must not update"); }),
    ),
    (error: unknown) => error instanceof AdminSettingsError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    updateStoreSettings(owner, input, repository(async () => ({ kind: "CONFLICT" }))),
    (error: unknown) => error instanceof AdminSettingsError && error.code === "CONFLICT",
  );
});
