import { classifyDashboardSource } from "./channel-attribution";
import type {
  MarketingAnalyticsRepository,
  MarketingOverviewRaw,
  MarketingSourceRow,
} from "./marketing-analytics-repository";
import {
  ADMIN_REPORTING_PRESETS,
  DEFAULT_ADMIN_REPORTING_PERIOD,
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  type AdminReportingPeriod,
  type AdminReportingWindow,
} from "./reporting-period";

export const MARKETING_RANGES = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "90d",
  "this_month",
  "last_month",
  "all",
] as const;
export type MarketingRange = (typeof MARKETING_RANGES)[number] | "custom";
export function parseMarketingRange(
  value: unknown,
  from?: unknown,
  to?: unknown,
): MarketingRange {
  const rawPeriod = Array.isArray(value) ? value[0] : value;
  const rawFrom = Array.isArray(from) ? from[0] : from;
  const rawTo = Array.isArray(to) ? to[0] : to;

  return parseAdminReportingPeriod({
    period: rawPeriod,
    range: rawPeriod,
    from: rawFrom,
    to: rawTo,
  }) as MarketingRange;
}

export interface MarketingWindow {
  range: MarketingRange;
  startAt: Date | null;
  endAt: Date | null;
  label: string;
  from?: string | null;
  to?: string | null;
}

export function resolveMarketingWindow(
  range: MarketingRange | AdminReportingPeriod,
  now = new Date(),
  from?: string | null,
  to?: string | null,
): MarketingWindow {
  const canonicalPeriod = parseMarketingRange(range, from, to);
  const win = resolveAdminReportingWindow(canonicalPeriod, now, from, to);
  return {
    range: canonicalPeriod,
    startAt: win.startAt,
    endAt: win.endAt,
    label: win.label,
    from: win.from,
    to: win.to,
  };
}


function nonnegative(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function normalizeSource(row: MarketingSourceRow): MarketingSourceRow {
  return {
    ...row,
    source: row.source.trim().toLowerCase() || "direct",
    visitors: nonnegative(row.visitors),
    sessions: nonnegative(row.sessions),
    productViews: nonnegative(row.productViews),
    addToCarts: nonnegative(row.addToCarts),
    checkouts: nonnegative(row.checkouts),
    orders: nonnegative(row.orders),
    revenueMinor: nonnegative(row.revenueMinor),
  };
}

export function buildMarketingOverview(raw: MarketingOverviewRaw, window: ReturnType<typeof resolveMarketingWindow>) {
  const events = {
    visitors: nonnegative(raw.events.visitors),
    pageViews: nonnegative(raw.events.pageViews),
    productViews: nonnegative(raw.events.productViews),
    addToCarts: nonnegative(raw.events.addToCarts),
    checkouts: nonnegative(raw.events.checkouts),
    purchases: nonnegative(raw.events.purchases),
  };
  const orders = {
    orders: nonnegative(raw.orders.orders),
    grossRevenueMinor: nonnegative(raw.orders.grossRevenueMinor),
    deliveredOrders: nonnegative(raw.orders.deliveredOrders),
    deliveredRevenueMinor: nonnegative(raw.orders.deliveredRevenueMinor),
  };
  const rawPurchasers = nonnegative(raw.funnelVisitors.purchasers);
  const rawCheckouts = Math.max(rawPurchasers, nonnegative(raw.funnelVisitors.checkouts));
  const rawAddToCart = Math.max(rawCheckouts, nonnegative(raw.funnelVisitors.addToCarts));
  const rawProductViews = Math.max(rawAddToCart, nonnegative(raw.funnelVisitors.productViews));

  const reachedProductViews = Math.min(events.visitors, rawProductViews);
  const reachedAddToCart = Math.min(reachedProductViews, rawAddToCart);
  const reachedCheckout = Math.min(reachedAddToCart, rawCheckouts);
  const reachedPurchasers = Math.min(reachedCheckout, rawPurchasers);
  const funnel = [
    { key: "visitors", label: "Visitors", value: events.visitors },
    { key: "productViews", label: "Product viewers", value: reachedProductViews },
    { key: "addToCarts", label: "Cart visitors", value: reachedAddToCart },
    { key: "checkouts", label: "Checkout visitors", value: reachedCheckout },
    { key: "purchasers", label: "Purchasers", value: reachedPurchasers },
  ];
  const sources = raw.sources.map(normalizeSource).sort((a, b) => b.orders - a.orders || b.visitors - a.visitors || a.source.localeCompare(b.source));
  const channelMap = new Map<string, { visitors: number; orders: number; revenueMinor: number }>();
  for (const source of sources) {
    const channel = classifyDashboardSource(source.source, source.medium, source.source === "meta");
    const current = channelMap.get(channel) ?? { visitors: 0, orders: 0, revenueMinor: 0 };
    current.visitors += source.visitors;
    current.orders += source.orders;
    current.revenueMinor += source.revenueMinor;
    channelMap.set(channel, current);
  }
  const conversionRate = events.visitors ? (reachedPurchasers / events.visitors) * 100 : 0;
  return {
    ...raw,
    window,
    events,
    orders,
    sources,
    funnel,
    conversionRate,
    recoverableCheckoutContacts: nonnegative(raw.recoverableCheckoutContacts),
    channels: ["Meta", "Organic", "Other"].map((channel) => ({ channel, ...(channelMap.get(channel) ?? { visitors: 0, orders: 0, revenueMinor: 0 }) })),
  };
}

export async function getMarketingOverview(
  storeId: string,
  range: MarketingRange,
  repository: MarketingAnalyticsRepository,
  now = new Date(),
  from?: string | null,
  to?: string | null,
) {
  const window = resolveMarketingWindow(range, now, from, to);
  const raw = await repository.getOverview(
    storeId,
    window.startAt,
    window.endAt,
  );
  return raw ? buildMarketingOverview(raw, window) : null;
}

export async function getMarketingVisitors(
  storeId: string,
  range: MarketingRange,
  repository: MarketingAnalyticsRepository,
  now = new Date(),
  from?: string | null,
  to?: string | null,
) {
  const window = resolveMarketingWindow(range, now, from, to);
  const result = await repository.getVisitors(
    storeId,
    window.startAt,
    window.endAt,
    100,
  );
  return result
    ? {
        ...result,
        window,
        rows: result.rows.map((row) => ({
          ...row,
          source: row.source.trim().toLowerCase() || "direct",
        })),
      }
    : null;
}

export async function getMarketingSources(
  storeId: string,
  range: MarketingRange,
  repository: MarketingAnalyticsRepository,
  now = new Date(),
  from?: string | null,
  to?: string | null,
) {
  const window = resolveMarketingWindow(range, now, from, to);
  const result = await repository.getSources(
    storeId,
    window.startAt,
    window.endAt,
  );
  return result
    ? {
        ...result,
        window,
        rows: result.rows
          .map(normalizeSource)
          .sort((a, b) => b.orders - a.orders || b.visitors - a.visitors),
      }
    : null;
}
