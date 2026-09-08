import type { PaidAdProvider } from "../marketing/paid-ads";

export interface AdminPaidAdScheduleAccount {
  id: string;
  provider: PaidAdProvider;
  externalAccountId: string;
  name: string;
  timezone: string;
  isActive: boolean;
  syncEnabled: boolean;
  syncLookbackDays: number;
  revision: number;
}

export interface AdminPaidAdSyncRun {
  id: string;
  accountId: string;
  accountName: string;
  provider: PaidAdProvider;
  startDate: string;
  endDate: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  rowsFetched: number;
  rowsWritten: number;
  skippedUnmapped: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface AdminPaidAdsScheduleWorkspace {
  accounts: AdminPaidAdScheduleAccount[];
  runs: AdminPaidAdSyncRun[];
}

export interface AdminPaidAdsScheduleRepository {
  getWorkspace(
    storeId: string,
  ): Promise<AdminPaidAdsScheduleWorkspace>;

  updateSchedule(input: {
    storeId: string;
    accountId: string;
    revision: number;
    syncEnabled: boolean;
    syncLookbackDays: number;
  }): Promise<boolean>;
}
