import type { OrderStatus } from "../commerce/order-status";

export interface DashboardStore {
  name: string;
  currency: string;
  timezone: string;
}

export interface DashboardEventSummary {
  visitors: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
}

export interface DashboardStatusRow {
  status: OrderStatus;
  orderCount: number;
  totalMinor: number;
}

export interface DashboardSourceRow {
  source: string;
  medium: string | null;
  hasMetaClick: boolean;
  orderCount: number;
  totalMinor: number;
}

export interface DashboardRecentOrder {
  publicId: string;
  customerName: string;
  status: OrderStatus;
  totalMinor: number;
  currency: string;
  source: string;
  createdAt: Date;
}

export interface DashboardRawSnapshot {
  store: DashboardStore;
  events: DashboardEventSummary;
  statuses: DashboardStatusRow[];
  sources: DashboardSourceRow[];
  recentOrders: DashboardRecentOrder[];
}

export interface AdminDashboardRepository {
  getSnapshot(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<DashboardRawSnapshot | null>;
}
