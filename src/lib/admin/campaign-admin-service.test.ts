import assert from "node:assert/strict";
import test from "node:test";
import type { AdminIdentity } from "../auth/admin-repository";
import type {
  AdminCampaignRepository,
  CreateAdminCampaignInput,
} from "./campaign-admin-repository";
import {
  AdminCampaignError,
  canManageCampaigns,
  createAdminCampaign,
  updateAdminCampaignStatus,
} from "./campaign-admin-service";

const owner: AdminIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  storeId: "22222222-2222-4222-8222-222222222222",
  storeSlug: "demo-store",
  email: "owner@example.test",
  displayName: "Owner",
  role: "OWNER",
};

function repository(): AdminCampaignRepository & {
  created: CreateAdminCampaignInput[];
} {
  const created: CreateAdminCampaignInput[] = [];
  return {
    created,
    async listCampaigns() {
      return [];
    },
    async createCampaign(input) {
      created.push(input);
      return {
        kind: "CREATED",
        campaign: {
          id: "33333333-3333-4333-8333-333333333333",
          name: input.name,
          campaignKey: input.campaignKey,
          source: input.source,
          medium: input.medium,
          content: input.content,
          term: input.term,
          landingUrl: input.landingUrl,
          notes: input.notes,
          status: input.status,
          revision: 0,
          createdAt: new Date("2026-09-07T00:00:00Z"),
          updatedAt: new Date("2026-09-07T00:00:00Z"),
        },
      };
    },
    async updateCampaignStatus(input) {
      return {
        kind: "UPDATED",
        campaign: {
          id: input.campaignId,
          name: "Launch",
          campaignKey: "launch",
          source: "facebook",
          medium: "paid-social",
          content: null,
          term: null,
          landingUrl: null,
          notes: null,
          status: input.status,
          revision: input.expectedRevision + 1,
          createdAt: new Date("2026-09-07T00:00:00Z"),
          updatedAt: new Date("2026-09-07T00:00:00Z"),
        },
      };
    },
  };
}

test("only owner/admin can mutate campaigns", () => {
  assert.equal(canManageCampaigns("OWNER"), true);
  assert.equal(canManageCampaigns("ADMIN"), true);
  assert.equal(canManageCampaigns("ANALYST"), false);
  assert.equal(canManageCampaigns("ORDER_MANAGER"), false);
});

test("campaign creation is store scoped and normalized", async () => {
  const repo = repository();
  const campaign = await createAdminCampaign(
    owner,
    {
      name: "Launch Campaign",
      campaignKey: " Launch Campaign ",
      source: " Facebook ",
      medium: " Paid Social ",
      content: "",
      term: "",
      landingUrl: "",
      notes: "",
      status: "ACTIVE",
    },
    repo,
  );

  assert.equal(campaign.campaignKey, "launch-campaign");
  assert.equal(repo.created[0]?.storeId, owner.storeId);
  assert.equal(repo.created[0]?.source, "facebook");
  assert.equal(repo.created[0]?.medium, "paid-social");
  assert.equal(repo.created[0]?.createdByAdminUserId, owner.id);
});

test("read-only roles fail before a campaign mutation", async () => {
  const repo = repository();
  await assert.rejects(
    createAdminCampaign(
      { ...owner, role: "ANALYST" },
      {
        name: "Blocked",
        campaignKey: "blocked",
        source: "facebook",
        medium: "paid-social",
        status: "DRAFT",
      },
      repo,
    ),
    (error) =>
      error instanceof AdminCampaignError && error.code === "FORBIDDEN",
  );
  assert.equal(repo.created.length, 0);
});

test("campaign status updates use optimistic revision", async () => {
  const repo = repository();
  const updated = await updateAdminCampaignStatus(
    owner,
    {
      campaignId: "33333333-3333-4333-8333-333333333333",
      expectedRevision: 4,
      status: "PAUSED",
    },
    repo,
  );

  assert.equal(updated.status, "PAUSED");
  assert.equal(updated.revision, 5);
});
