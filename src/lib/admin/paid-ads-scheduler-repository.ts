import type { PaidAdProvider } from "../marketing/paid-ads";

export interface ScheduledPaidAdAccount {
  id: string;
  storeId: string;
  storeSlug: string;
  provider: PaidAdProvider;
  externalAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  syncLookbackDays: number;
}

export type ClaimScheduledSyncRunResult =
  | { kind: "CLAIMED"; runId: string }
  | { kind: "DUPLICATE" };

export interface PaidAdsSchedulerRepository {
  listScheduledAccounts(): Promise<ScheduledPaidAdAccount[]>;

  claimScheduledRun(input: {
    storeId: string;
    accountId: string;
    provider: PaidAdProvider;
    scheduleKey: string;
    startDate: string;
    endDate: string;
  }): Promise<ClaimScheduledSyncRunResult>;

  completeScheduledRunSuccess(input: {
    runId: string;
    rowsFetched: number;
    rowsWritten: number;
    skippedUnmapped: number;
  }): Promise<void>;

  completeScheduledRunFailure(input: {
    runId: string;
    errorCode: string;
    errorMessage: string;
  }): Promise<void>;
}
