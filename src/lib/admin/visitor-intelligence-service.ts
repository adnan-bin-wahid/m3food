import type {
  CtaPerformanceRow,
  VisitorIntelligenceOverviewRaw,
  VisitorIntelligenceRepository,
} from "./visitor-intelligence-repository";
import {
  resolveMarketingWindow,
  type MarketingRange,
} from "./marketing-analytics-service";

function nonnegative(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function normalizeCtaPerformance(row: CtaPerformanceRow) {
  const uniqueViews = nonnegative(row.uniqueViews);
  const uniqueClicks = Math.min(uniqueViews, nonnegative(row.uniqueClicks));
  const clicks = nonnegative(row.clicks);
  return {
    ...row,
    uniqueViews,
    uniqueClicks,
    clicks,
    orders: nonnegative(row.orders),
    revenueMinor: nonnegative(row.revenueMinor),
    ctr: uniqueViews ? (uniqueClicks / uniqueViews) * 100 : 0,
  };
}

export function buildVisitorIntelligenceOverview(
  raw: VisitorIntelligenceOverviewRaw,
  window: ReturnType<typeof resolveMarketingWindow>,
) {
  return {
    ...raw,
    window,
    interactionEvents: nonnegative(raw.interactionEvents),
    ctas: raw.ctas
      .map(normalizeCtaPerformance)
      .sort((a, b) => b.uniqueClicks - a.uniqueClicks || b.uniqueViews - a.uniqueViews || a.elementKey.localeCompare(b.elementKey)),
    sections: raw.sections
      .map((row) => ({
        ...row,
        uniqueVisitors: nonnegative(row.uniqueVisitors),
        uniqueSessions: nonnegative(row.uniqueSessions),
      }))
      .sort((a, b) => b.uniqueSessions - a.uniqueSessions || a.sectionKey.localeCompare(b.sectionKey)),
    scrollDepths: raw.scrollDepths
      .map((row) => ({ scrollDepth: nonnegative(row.scrollDepth), uniqueSessions: nonnegative(row.uniqueSessions) }))
      .sort((a, b) => a.scrollDepth - b.scrollDepth),
  };
}

export async function getVisitorIntelligenceOverview(
  storeId: string,
  range: MarketingRange,
  repository: VisitorIntelligenceRepository,
  now = new Date(),
) {
  const window = resolveMarketingWindow(range, now);
  const raw = await repository.getOverview(storeId, window.startAt, window.endAt);
  return raw ? buildVisitorIntelligenceOverview(raw, window) : null;
}

export async function getVisitorSessionJourney(
  storeId: string,
  sessionKey: string,
  repository: VisitorIntelligenceRepository,
) {
  const bounded = sessionKey.trim().slice(0, 80);
  if (bounded.length < 16) return null;
  return repository.getSessionJourney(storeId, bounded);
}
