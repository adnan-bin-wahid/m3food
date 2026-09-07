import { classifyDashboardSource } from "./dashboard-service";
import type {
  MarketingAnalyticsRepository,
  MarketingOverviewRaw,
  MarketingSourceRow,
} from "./marketing-analytics-repository";

export const MARKETING_RANGES = ["7d", "30d", "90d", "all"] as const;
export type MarketingRange = (typeof MARKETING_RANGES)[number];
const DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;

export function parseMarketingRange(value: unknown): MarketingRange {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && MARKETING_RANGES.includes(raw as MarketingRange)
    ? (raw as MarketingRange)
    : "30d";
}

export function resolveMarketingWindow(range: MarketingRange, now = new Date()) {
  const endAt = new Date(now);
  const startAt = range === "all" ? null : new Date(endAt.getTime() - DAYS[range] * 86_400_000);
  return { range, startAt, endAt, label: range === "all" ? "All time" : `Last ${DAYS[range]} days` };
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
  const funnel = [
    { key: "visitors", label: "Visitors", value: events.visitors },
    { key: "productViews", label: "Product views", value: events.productViews },
    { key: "addToCarts", label: "Add to cart", value: events.addToCarts },
    { key: "checkouts", label: "Checkout", value: events.checkouts },
    { key: "orders", label: "Orders", value: orders.orders },
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
  const conversionRate = events.visitors ? (orders.orders / events.visitors) * 100 : 0;
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

export async function getMarketingOverview(storeId: string, range: MarketingRange, repository: MarketingAnalyticsRepository, now = new Date()) {
  const window = resolveMarketingWindow(range, now);
  const raw = await repository.getOverview(storeId, window.startAt, window.endAt);
  return raw ? buildMarketingOverview(raw, window) : null;
}

export async function getMarketingVisitors(storeId: string, range: MarketingRange, repository: MarketingAnalyticsRepository, now = new Date()) {
  const window = resolveMarketingWindow(range, now);
  const result = await repository.getVisitors(storeId, window.startAt, window.endAt, 100);
  return result ? { ...result, window, rows: result.rows.map((row) => ({ ...row, source: row.source.trim().toLowerCase() || "direct" })) } : null;
}

export async function getMarketingSources(storeId: string, range: MarketingRange, repository: MarketingAnalyticsRepository, now = new Date()) {
  const window = resolveMarketingWindow(range, now);
  const result = await repository.getSources(storeId, window.startAt, window.endAt);
  return result ? { ...result, window, rows: result.rows.map(normalizeSource).sort((a, b) => b.orders - a.orders || b.visitors - a.visitors) } : null;
}
