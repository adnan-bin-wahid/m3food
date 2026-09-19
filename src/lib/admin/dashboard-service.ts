import type {
  AdminDashboardRepository,
  DashboardRawSnapshot,
  DashboardRecentOrder,
  DashboardSourceRow,
  DashboardStatusRow,
} from "./dashboard-repository";

import {
  MARKETING_RANGES,
  parseMarketingRange,
  resolveMarketingWindow,
  type MarketingRange,
} from "./marketing-analytics-service";

export const DASHBOARD_RANGES = MARKETING_RANGES;
export type DashboardRange = MarketingRange;

export class AdminDashboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminDashboardError";
  }
}

export function parseDashboardRange(
  value: unknown,
  from?: unknown,
  to?: unknown,
): DashboardRange {
  return parseMarketingRange(value, from, to);
}

export function resolveDashboardWindow(
  range: DashboardRange,
  now = new Date(),
  from?: string | null,
  to?: string | null,
) {
  return resolveMarketingWindow(range, now, from, to);
}

function safeInteger(value: number) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function normalizeSource(source: string) {
  const normalized = source.trim().toLowerCase();
  return normalized || "direct";
}

export type DashboardChannel = "Meta" | "Organic" | "Other";

export function classifyDashboardSource(
  source: string,
  medium: string | null = null,
  hasMetaClick = false,
): DashboardChannel {
  const normalized = normalizeSource(source);
  if (
    hasMetaClick ||
    normalized === "facebook" ||
    normalized === "instagram" ||
    normalized === "meta" ||
    normalized === "fb" ||
    normalized.includes("facebook") ||
    normalized.includes("instagram")
  ) {
    return "Meta";
  }
  const normalizedMedium = medium?.trim().toLowerCase() ?? "";
  if (
    normalized === "direct" ||
    normalized === "organic" ||
    normalizedMedium === "organic" ||
    normalizedMedium === "seo"
  ) {
    return "Organic";
  }
  return "Other";
}

function normalizeStatuses(rows: DashboardStatusRow[]) {
  return rows.map((row) => ({
    status: row.status,
    orderCount: safeInteger(Number(row.orderCount)),
    totalMinor: safeInteger(Number(row.totalMinor)),
  }));
}

function normalizeSources(rows: DashboardSourceRow[]) {
  const grouped = new Map<string, { source: string; orderCount: number; totalMinor: number }>();
  for (const row of rows) {
    const source = normalizeSource(row.source);
    const current = grouped.get(source) ?? { source, orderCount: 0, totalMinor: 0 };
    current.orderCount += safeInteger(Number(row.orderCount));
    current.totalMinor += safeInteger(Number(row.totalMinor));
    grouped.set(source, current);
  }
  return Array.from(grouped.values())
    .sort(
      (left, right) =>
        right.orderCount - left.orderCount || left.source.localeCompare(right.source),
    );
}

function normalizeRecentOrders(rows: DashboardRecentOrder[]) {
  return rows.map((row) => ({
    ...row,
    totalMinor: safeInteger(Number(row.totalMinor)),
    source: normalizeSource(row.source),
    createdAt: new Date(row.createdAt),
  }));
}

function buildChannels(sources: DashboardSourceRow[]) {
  const channels: Record<DashboardChannel, { orderCount: number; totalMinor: number }> = {
    Meta: { orderCount: 0, totalMinor: 0 },
    Organic: { orderCount: 0, totalMinor: 0 },
    Other: { orderCount: 0, totalMinor: 0 },
  };
  for (const source of sources) {
    const channel = classifyDashboardSource(
      source.source,
      source.medium,
      source.hasMetaClick,
    );
    channels[channel].orderCount += safeInteger(Number(source.orderCount));
    channels[channel].totalMinor += safeInteger(Number(source.totalMinor));
  }
  return (Object.entries(channels) as Array<
    [DashboardChannel, { orderCount: number; totalMinor: number }]
  >).map(([channel, totals]) => ({ channel, ...totals }));
}

export async function getAdminDashboard(
  storeId: string,
  range: DashboardRange,
  repository: AdminDashboardRepository,
  now = new Date(),
  from?: string | null,
  to?: string | null,
) {
  const window = resolveDashboardWindow(range, now, from, to);
  const snapshot = await repository.getSnapshot(
    storeId,
    window.startAt,
    window.endAt,
  );
  if (!snapshot) {
    throw new AdminDashboardError("The admin store is unavailable.");
  }

  return buildDashboardView(snapshot, window);
}

function buildDashboardView(
  snapshot: DashboardRawSnapshot,
  window: ReturnType<typeof resolveDashboardWindow>,
) {
  const statuses = normalizeStatuses(snapshot.statuses);
  const sources = normalizeSources(snapshot.sources);
  const recentOrders = normalizeRecentOrders(snapshot.recentOrders);
  const orders = statuses.reduce((total, row) => total + row.orderCount, 0);
  const grossOrderValueMinor = statuses
    .filter((row) => row.status !== "CANCELLED" && row.status !== "RETURNED")
    .reduce((total, row) => total + row.totalMinor, 0);
  const visitors = safeInteger(Number(snapshot.events.visitors));
  const conversionRate = visitors === 0 ? 0 : (orders / visitors) * 100;
  const funnel = [
    { key: "visitors", label: "Visitors", value: visitors },
    {
      key: "product-views",
      label: "Product views",
      value: safeInteger(Number(snapshot.events.productViews)),
    },
    {
      key: "add-to-carts",
      label: "Add to cart",
      value: safeInteger(Number(snapshot.events.addToCarts)),
    },
    {
      key: "checkouts",
      label: "Checkout started",
      value: safeInteger(Number(snapshot.events.checkouts)),
    },
    { key: "orders", label: "Orders", value: orders },
  ];

  return {
    window,
    store: snapshot.store,
    metrics: {
      visitors,
      pageViews: safeInteger(Number(snapshot.events.pageViews)),
      productViews: safeInteger(Number(snapshot.events.productViews)),
      orders,
      conversionRate,
      grossOrderValueMinor,
    },
    funnel,
    statuses,
    sources,
    channels: buildChannels(snapshot.sources),
    recentOrders,
  };
}
