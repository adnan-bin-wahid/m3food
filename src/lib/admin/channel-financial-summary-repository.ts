import type { PaidAdProvider } from "../marketing/paid-ads";
import type { StoreFinancialOrderStatus } from "./store-financial-summary-repository";
import type { PaymentSettlementStatus } from "./payment-settlement-repository";

export interface ChannelFinancialOrderRow {
  orderId: string;
  status: StoreFinancialOrderStatus;
  paymentStatus: PaymentSettlementStatus;
  currency: string;
  revenueMinor: number;
  fulfillmentCostMinor: number | null;
  itemCount: number;
  knownItemCostCount: number;
  knownCogsMinor: number;
  source: string;
  medium: string | null;
  fbclid: string | null;
  gclid: string | null;
  mappedProviders: PaidAdProvider[];
}

export interface ChannelFinancialSpendRow {
  provider: PaidAdProvider;
  accountCurrency: string;
  spendMinor: number;
}

export interface ChannelFinancialSummaryRaw {
  storeCurrency: string;
  orders: ChannelFinancialOrderRow[];
  spend: ChannelFinancialSpendRow[];
}

export interface ChannelFinancialSummaryRepository {
  getSummary(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<ChannelFinancialSummaryRaw | null>;
}
