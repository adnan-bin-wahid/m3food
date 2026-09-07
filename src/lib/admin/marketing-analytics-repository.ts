import type { OrderStatus } from "../commerce/order-status";

export interface MarketingAnalyticsStore {
  name: string;
  slug: string;
  currency: string;
  timezone: string;
}

export interface MarketingEventTotals {
  visitors: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
}

export interface MarketingOrderTotals {
  orders: number;
  grossRevenueMinor: number;
  deliveredOrders: number;
  deliveredRevenueMinor: number;
}

export interface MarketingFunnelVisitorTotals {
  productViews: number;
  addToCarts: number;
  checkouts: number;
  purchasers: number;
}

export interface MarketingStatusRow {
  status: OrderStatus;
  orders: number;
  totalMinor: number;
}

export interface MarketingSourceRow {
  source: string;
  medium: string | null;
  visitors: number;
  sessions: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  orders: number;
  revenueMinor: number;
}

export interface MarketingVisitorRow {
  visitorKey: string;
  sessionKey: string;
  source: string;
  campaign: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
  orders: number;
  revenueMinor: number;
}

export interface MarketingOverviewRaw {
  store: MarketingAnalyticsStore;
  events: MarketingEventTotals;
  orders: MarketingOrderTotals;
  funnelVisitors: MarketingFunnelVisitorTotals;
  statuses: MarketingStatusRow[];
  sources: MarketingSourceRow[];
  recoverableCheckoutContacts: number;
}

export interface MarketingAnalyticsRepository {
  getOverview(storeId: string, startAt: Date | null, endAt: Date): Promise<MarketingOverviewRaw | null>;
  getVisitors(storeId: string, startAt: Date | null, endAt: Date, limit: number): Promise<{ store: MarketingAnalyticsStore; rows: MarketingVisitorRow[] } | null>;
  getSources(storeId: string, startAt: Date | null, endAt: Date): Promise<{ store: MarketingAnalyticsStore; rows: MarketingSourceRow[] } | null>;
}
