import type { PaidAdProvider } from "../marketing/paid-ads";

export type StoreFinancialOrderStatus =
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface StoreFinancialOrderRow {
  orderId: string;
  status: StoreFinancialOrderStatus;
  currency: string;
  revenueMinor: number;
  fulfillmentCostMinor: number | null;
  itemCount: number;
  knownItemCostCount: number;
  knownCogsMinor: number;
}

export interface StoreFinancialSpendRow {
  accountId: string;
  provider: PaidAdProvider;
  accountCurrency: string;
  spendMinor: number;
}

export interface StoreFinancialSummaryRaw {
  storeCurrency: string;
  orders: StoreFinancialOrderRow[];
  spend: StoreFinancialSpendRow[];
}

export interface StoreFinancialSummaryRepository {
  getSummary(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<StoreFinancialSummaryRaw | null>;
}
