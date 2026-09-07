import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AdminCampaignRepository,
  CreateAdminCampaignInput,
} from "../admin/campaign-admin-repository";
import { getDatabase, type Database } from "./index";
import { marketingCampaigns } from "./schema";

const campaignSelection = {
  id: marketingCampaigns.id,
  name: marketingCampaigns.name,
  campaignKey: marketingCampaigns.campaignKey,
  source: marketingCampaigns.source,
  medium: marketingCampaigns.medium,
  content: marketingCampaigns.content,
  term: marketingCampaigns.term,
  landingUrl: marketingCampaigns.landingUrl,
  notes: marketingCampaigns.notes,
  status: marketingCampaigns.status,
  revision: marketingCampaigns.revision,
  createdAt: marketingCampaigns.createdAt,
  updatedAt: marketingCampaigns.updatedAt,
};

export class DrizzleAdminCampaignRepository
  implements AdminCampaignRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  listCampaigns(storeId: string) {
    return this.database
      .select(campaignSelection)
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.storeId, storeId))
      .orderBy(desc(marketingCampaigns.createdAt));
  }

  async createCampaign(input: CreateAdminCampaignInput) {
    const rows = await this.database
      .insert(marketingCampaigns)
      .values(input)
      .onConflictDoNothing({
        target: [marketingCampaigns.storeId, marketingCampaigns.campaignKey],
      })
      .returning(campaignSelection);

    const campaign = rows[0];
    return campaign
      ? ({ kind: "CREATED", campaign } as const)
      : ({ kind: "DUPLICATE_KEY" } as const);
  }

  async updateCampaignStatus(input: {
    storeId: string;
    campaignId: string;
    expectedRevision: number;
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  }) {
    const rows = await this.database
      .update(marketingCampaigns)
      .set({
        status: input.status,
        revision: sql`${marketingCampaigns.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(marketingCampaigns.storeId, input.storeId),
          eq(marketingCampaigns.id, input.campaignId),
          eq(marketingCampaigns.revision, input.expectedRevision),
        ),
      )
      .returning(campaignSelection);

    const campaign = rows[0];
    return campaign
      ? ({ kind: "UPDATED", campaign } as const)
      : ({ kind: "CONFLICT_OR_NOT_FOUND" } as const);
  }
}
