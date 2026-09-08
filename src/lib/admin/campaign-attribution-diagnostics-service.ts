import { normalizeCampaignKey } from "../marketing/campaigns";
import type {
  MarketingRange,
} from "./marketing-analytics-service";
import { resolveMarketingWindow } from "./marketing-analytics-service";
import type {
  CampaignAttributionDiagnosticsRepository,
  CampaignDiagnosticOrderRow,
} from "./campaign-attribution-diagnostics-repository";

function readTouchCampaign(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const campaign = (value as { campaign?: unknown }).campaign;
  return typeof campaign === "string" && campaign.trim()
    ? campaign.trim()
    : null;
}

function attributionRole(
  order: Pick<
    CampaignDiagnosticOrderRow,
    "firstTouchCampaignId" | "lastTouchCampaignId"
  >,
  campaignId: string,
) {
  const first = order.firstTouchCampaignId === campaignId;
  const last = order.lastTouchCampaignId === campaignId;
  if (first && last) return "FIRST + LAST" as const;
  if (first) return "FIRST" as const;
  return "LAST" as const;
}

export async function getCampaignAttributionDiagnostics(
  storeId: string,
  range: MarketingRange,
  repository: CampaignAttributionDiagnosticsRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const rows = await repository.getUnregisteredCampaignTraffic(
    storeId,
    window.startAt,
    window.endAt,
    25,
  );

  return {
    window,
    rows: rows.map((row) => ({
      ...row,
      suggestedCampaignKey: normalizeCampaignKey(row.rawCampaign),
    })),
  };
}

export async function getCampaignAttributionDetailReport(
  storeId: string,
  campaignId: string,
  range: MarketingRange,
  repository: CampaignAttributionDiagnosticsRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const detail = await repository.getCampaignAttributionDetail(
    storeId,
    campaignId,
    window.startAt,
    window.endAt,
    50,
  );

  if (!detail) return null;

  return {
    ...detail,
    window,
    orders: detail.orders.map((order) => ({
      ...order,
      role: attributionRole(order, detail.campaign.id),
      firstTouchCampaign: readTouchCampaign(order.firstTouch),
      lastTouchCampaign: readTouchCampaign(order.lastTouch),
    })),
  };
}
