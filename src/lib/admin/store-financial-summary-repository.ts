import type { PaidAdProvider } from "../marketing/paid-ads";
import type { PaymentSettlementStatus } from "./payment-settlement-repository";

export type StoreFinancialOrderStatus =
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface StoreFinancialOrderRow {
  orderId: string;
  status: StoreFinancialOrderStatus;
  paymentStatus: PaymentSettlementStatus;
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
