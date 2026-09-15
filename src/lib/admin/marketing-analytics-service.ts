import { classifyDashboardSource } from "./dashboard-service";
import type {
  MarketingAnalyticsRepository,
  MarketingOverviewRaw,
  MarketingSourceRow,
} from "./marketing-analytics-repository";

export const MARKETING_RANGES = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "90d",
  "all",
] as const;
export type MarketingRange = (typeof MARKETING_RANGES)[number] | "custom";
const DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

function localIsoDateString(date: Date, timezone = "Asia/Dhaka") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

export function parseMarketingRange(
  value: unknown,
  from?: unknown,
  to?: unknown,
): MarketingRange {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    typeof raw === "string" &&
    (MARKETING_RANGES as readonly string[]).includes(raw)
  ) {
    return raw as MarketingRange;
  }

  const rawFrom = Array.isArray(from) ? from[0] : from;
  if (
    raw === "custom" ||
    (typeof rawFrom === "string" && rawFrom.trim().length > 0)
  ) {
    return "custom";
  }

  return "30d";
}

export interface MarketingWindow {
  range: MarketingRange;
  startAt: Date | null;
  endAt: Date;
  label: string;
  from?: string | null;
  to?: string | null;
}

export function resolveMarketingWindow(
  range: MarketingRange,
  now = new Date(),
  from?: string | null,
  to?: string | null,
): MarketingWindow {
  const cleanFrom =
    typeof from === "string" && from.trim() ? from.trim() : null;
  const cleanTo = typeof to === "string" && to.trim() ? to.trim() : cleanFrom;

  if (range === "custom" && cleanFrom) {
    const startAt = new Date(`${cleanFrom}T00:00:00+06:00`);
    const endAt = new Date(`${cleanTo}T23:59:59.999+06:00`);
    if (!Number.isNaN(startAt.getTime()) && !Number.isNaN(endAt.getTime())) {
      const label =
        cleanFrom === cleanTo ? cleanFrom : `${cleanFrom} → ${cleanTo}`;
      return {
        range: "custom" as const,
        startAt,
        endAt,
        label,
        from: cleanFrom,
        to: cleanTo ?? cleanFrom,
      };
    }
  }

  if (range === "today") {
    const todayStr = localIsoDateString(now, "Asia/Dhaka");
    const startAt = new Date(`${todayStr}T00:00:00+06:00`);
    const endAt = new Date(`${todayStr}T23:59:59.999+06:00`);
    return {
      range: "today" as const,
      startAt,
      endAt,
      label: `Today (${todayStr})`,
      from: todayStr,
      to: todayStr,
    };
  }

  if (range === "yesterday") {
    const yesterdayDate = new Date(now.getTime() - 86_400_000);
    const yesterdayStr = localIsoDateString(yesterdayDate, "Asia/Dhaka");
    const startAt = new Date(`${yesterdayStr}T00:00:00+06:00`);
    const endAt = new Date(`${yesterdayStr}T23:59:59.999+06:00`);
    return {
      range: "yesterday" as const,
      startAt,
      endAt,
      label: `Yesterday (${yesterdayStr})`,
      from: yesterdayStr,
      to: yesterdayStr,
    };
  }

  if (range === "all") {
    const toStr = localIsoDateString(now, "Asia/Dhaka");
    return {
      range: "all" as const,
      startAt: null,
      endAt: new Date(now),
      label: "All time",
      from: null,
      to: toStr,
    };
  }

  const days = DAYS[range] ?? 30;
  const endAt = new Date(now);
  const startAt = new Date(endAt.getTime() - days * 86_400_000);
  const fromStr = localIsoDateString(startAt, "Asia/Dhaka");
  const toStr = localIsoDateString(endAt, "Asia/Dhaka");

  return {
    range,
    startAt,
    endAt,
    label: `Last ${days} days`,
    from: fromStr,
    to: toStr,
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
