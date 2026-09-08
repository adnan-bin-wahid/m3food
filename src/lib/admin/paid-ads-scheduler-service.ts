import type { AdminIdentity } from "../auth/admin-repository";
import type { PaidAdsSyncError } from "./paid-ads-sync-service";
import type {
  PaidAdsSchedulerRepository,
  ScheduledPaidAdAccount,
} from "./paid-ads-scheduler-repository";

const SYSTEM_ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const SYSTEM_ADMIN_EMAIL = "paid-ads-scheduler@system.internal";

export interface ScheduledPaidAdsSyncResult {
  provider: "META" | "GOOGLE";
  accountId: string;
  accountName: string;
  startDate: string;
  endDate: string;
  rowsFetched: number;
  rowsWritten: number;
  skippedUnmapped: number;
}

export type ScheduledPaidAdsSyncExecutor = (
  admin: AdminIdentity,
  input: {
    accountId: string;
    startDate: string;
    endDate: string;
  },
) => Promise<ScheduledPaidAdsSyncResult>;

function isoDateFromParts(parts: Intl.DateTimeFormatPart[]) {
  const values = new Map(
    parts
      .filter((part) =>
        ["year", "month", "day"].includes(part.type),
      )
      .map((part) => [part.type, part.value]),
  );

  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");

  if (!year || !month || !day) {
    throw new Error("Could not resolve provider-account local date.");
  }

  return `${year}-${month}-${day}`;
}

export function localIsoDate(
  now: Date,
  timezone: string,
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return isoDateFromParts(formatter.formatToParts(now));
}

export function shiftIsoDate(
  value: string,
  days: number,
) {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid ISO calendar date.");
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function resolveScheduledPaidAdsWindow(
  account: ScheduledPaidAdAccount,
  now: Date,
) {
  if (
    !Number.isInteger(account.syncLookbackDays) ||
    account.syncLookbackDays < 1 ||
    account.syncLookbackDays > 31
  ) {
    throw new Error(
      "Scheduled paid ads lookback must be between 1 and 31 days.",
    );
  }

  const localToday = localIsoDate(now, account.timezone);
  const endDate = shiftIsoDate(localToday, -1);
  const startDate = shiftIsoDate(
    endDate,
    -(account.syncLookbackDays - 1),
  );

  return {
    localToday,
    startDate,
    endDate,
    scheduleKey: `daily:${account.id}:${localToday}`,
  };
}

function systemAdmin(
  account: ScheduledPaidAdAccount,
): AdminIdentity {
  return {
    id: SYSTEM_ADMIN_ID,
    storeId: account.storeId,
    storeSlug: account.storeSlug,
    email: SYSTEM_ADMIN_EMAIL,
    displayName: "Paid Ads Scheduler",
    role: "OWNER",
  };
}

function safeError(error: unknown) {
  const value = error as Partial<PaidAdsSyncError> | null;
  const code =
    value &&
    typeof value.code === "string" &&
    value.code.trim()
      ? value.code.trim().slice(0, 64)
      : "UNEXPECTED";

  const message =
    error instanceof Error && error.message.trim()
      ? error.message.trim().slice(0, 1000)
      : "Scheduled paid ads sync failed.";

  return { code, message };
}

export async function runScheduledPaidAdsSync(
  repository: PaidAdsSchedulerRepository,
  executeSync: ScheduledPaidAdsSyncExecutor,
  now = new Date(),
) {
  const accounts = await repository.listScheduledAccounts();

  let claimed = 0;
  let succeeded = 0;
  let failed = 0;
  let duplicateSkipped = 0;
  let rowsWritten = 0;

  for (const account of accounts) {
    let window: ReturnType<typeof resolveScheduledPaidAdsWindow>;

    try {
      window = resolveScheduledPaidAdsWindow(account, now);
    } catch {
      failed += 1;
      continue;
    }

    const claim = await repository.claimScheduledRun({
      storeId: account.storeId,
      accountId: account.id,
      provider: account.provider,
      scheduleKey: window.scheduleKey,
      startDate: window.startDate,
      endDate: window.endDate,
    });

    if (claim.kind === "DUPLICATE") {
      duplicateSkipped += 1;
      continue;
    }

    claimed += 1;

    try {
      const result = await executeSync(
        systemAdmin(account),
        {
          accountId: account.id,
          startDate: window.startDate,
          endDate: window.endDate,
        },
      );

      await repository.completeScheduledRunSuccess({
        runId: claim.runId,
        rowsFetched: result.rowsFetched,
        rowsWritten: result.rowsWritten,
        skippedUnmapped: result.skippedUnmapped,
      });

      succeeded += 1;
      rowsWritten += result.rowsWritten;
    } catch (error) {
      const safe = safeError(error);

      await repository.completeScheduledRunFailure({
        runId: claim.runId,
        errorCode: safe.code,
        errorMessage: safe.message,
      });

      failed += 1;
    }
  }

  return {
    accountsConsidered: accounts.length,
    claimed,
    succeeded,
    failed,
    duplicateSkipped,
    rowsWritten,
  };
}
