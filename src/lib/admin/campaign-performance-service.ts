import type {
  MarketingRange,
} from "./marketing-analytics-service";
import { resolveMarketingWindow } from "./marketing-analytics-service";
import type {
  CampaignPerformanceRepository,
  CampaignPerformanceRow,
} from "./campaign-performance-repository";

export interface CampaignPerformanceView extends CampaignPerformanceRow {
  lastTouchConversionRate: number;
}

export function calculateCampaignConversionRate(
  orders: number,
  sessions: number,
) {
  if (sessions <= 0 || orders <= 0) return 0;
  return Math.min(100, Math.round((orders / sessions) * 10_000) / 100);
}

export async function getAdminCampaignPerformance(
  storeId: string,
  range: MarketingRange,
  repository: CampaignPerformanceRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const rows = await repository.getCampaignPerformance(
    storeId,
    window.startAt,
    window.endAt,
  );

  return {
    window,
    rows: rows.map((row) => ({
      ...row,
      lastTouchConversionRate: calculateCampaignConversionRate(
        row.lastTouchOrders,
        row.sessions,
      ),
    })),
  };
}
