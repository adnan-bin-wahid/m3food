export const REPORTING_TIMEZONE = "Asia/Dhaka";
export const REPORTING_TZ_OFFSET = "+06:00";

export const ADMIN_REPORTING_PRESETS = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "90d",
  "this_month",
  "last_month",
  "all",
] as const;

export type AdminReportingPreset = (typeof ADMIN_REPORTING_PRESETS)[number];
export type AdminReportingPeriod = AdminReportingPreset | "custom";

export const DEFAULT_ADMIN_REPORTING_PERIOD: AdminReportingPeriod = "30d";

export interface PresetDisplayOption {
  key: AdminReportingPeriod;
  label: string;
}

export const ADMIN_PRESET_OPTIONS: readonly PresetDisplayOption[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
] as const;

export interface AdminReportingWindow {
  period: AdminReportingPeriod;
  startAt: Date | null;
  endAt: Date | null;
  label: string;
  from: string | null;
  to: string | null;
}

/**
 * Format a Date into YYYY-MM-DD in Asia/Dhaka timezone.
 */
export function formatDhakaDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: REPORTING_TIMEZONE }).format(date);
}

/**
 * Parse parts of a date in Asia/Dhaka timezone.
 */
function getDhakaParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORTING_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  let year = 2026;
  let month = 1;
  let day = 1;
  for (const part of parts) {
    if (part.type === "year") year = Number.parseInt(part.value, 10);
    if (part.type === "month") month = Number.parseInt(part.value, 10);
    if (part.type === "day") day = Number.parseInt(part.value, 10);
  }
  return { year, month, day };
}

/**
 * Creates a UTC Date corresponding to YYYY-MM-DD 00:00:00 in Asia/Dhaka (+06:00).
 */
export function createDhakaStartOfDay(year: number, month: number, day: number): Date {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return new Date(`${y}-${m}-${d}T00:00:00${REPORTING_TZ_OFFSET}`);
}

/**
 * Adds N calendar days to a YYYY-MM-DD string in Asia/Dhaka.
 */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map((v) => Number.parseInt(v, 10));
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const nextY = String(base.getUTCFullYear()).padStart(4, "0");
  const nextM = String(base.getUTCMonth() + 1).padStart(2, "0");
  const nextD = String(base.getUTCDate()).padStart(2, "0");
  return `${nextY}-${nextM}-${nextD}`;
}

function firstQueryValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const candidate = value[0];
    return typeof candidate === "string" ? candidate.trim() : null;
  }
  return typeof value === "string" ? value.trim() : null;
}

/**
 * Parses the canonical reporting period from searchParams/query.
 * Supports legacy `range` parameter for backward compatibility.
 */
/**
 * Validates a YYYY-MM-DD string.
 */
export function isValidDateStr(str: string | null | undefined): str is string {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map((v) => Number.parseInt(v, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Parses the canonical reporting period from searchParams/query.
 * Supports legacy `range` parameter for backward compatibility.
 */
export function parseAdminReportingPeriod(
  query: Record<string, unknown> | URLSearchParams | undefined | null,
): AdminReportingPeriod {
  if (!query) return DEFAULT_ADMIN_REPORTING_PERIOD;

  let rawPeriod: string | null = null;
  let rawFrom: string | null = null;
  let rawTo: string | null = null;

  if (query instanceof URLSearchParams) {
    rawPeriod = query.get("period") || query.get("range");
    rawFrom = query.get("from");
    rawTo = query.get("to");
  } else {
    rawPeriod = firstQueryValue(query.period) || firstQueryValue(query.range);
    rawFrom = firstQueryValue(query.from);
    rawTo = firstQueryValue(query.to);
  }

  if (rawPeriod) {
    const normalized = rawPeriod.toLowerCase().trim();
    if (normalized === "custom") {
      // Must have valid date parameters, otherwise fallback to default period
      if (isValidDateStr(rawFrom) && isValidDateStr(rawTo)) {
        return "custom";
      }
      return DEFAULT_ADMIN_REPORTING_PERIOD;
    }
    if ((ADMIN_REPORTING_PRESETS as readonly string[]).includes(normalized)) {
      return normalized as AdminReportingPreset;
    }
  }

  if (rawFrom && rawTo && isValidDateStr(rawFrom) && isValidDateStr(rawTo)) {
    return "custom";
  }

  return DEFAULT_ADMIN_REPORTING_PERIOD;
}

/**
 * Resolves the exact half-open reporting window [startAt, endAt) in Asia/Dhaka.
 * Avoids 23:59:59.999 precision hacks.
 */
export function resolveAdminReportingWindow(
  period: AdminReportingPeriod,
  now = new Date(),
  from?: string | null,
  to?: string | null,
): AdminReportingWindow {
  const { year, month, day } = getDhakaParts(now);
  const todayStr = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (period === "custom") {
    let cleanFrom = typeof from === "string" && isValidDateStr(from.trim()) ? from.trim() : null;
    let cleanTo = typeof to === "string" && isValidDateStr(to.trim()) ? to.trim() : null;

    if (!cleanFrom || !cleanTo) {
      // Fall back to 30d if custom parameters are missing or invalid
      return resolveAdminReportingWindow("30d", now);
    }

    if (cleanFrom && cleanTo) {
      // Ensure cleanFrom <= cleanTo
      if (cleanFrom > cleanTo) {
        const temp = cleanFrom;
        cleanFrom = cleanTo;
        cleanTo = temp;
      }
      const [fromY, fromM, fromD] = cleanFrom.split("-").map((v) => Number.parseInt(v, 10));
      const startAt = createDhakaStartOfDay(fromY, fromM, fromD);

      // Exclusive end boundary is the start of the next calendar day
      const dayAfterTo = addDays(cleanTo, 1);
      const [nextY, nextM, nextD] = dayAfterTo.split("-").map((v) => Number.parseInt(v, 10));
      const endAt = createDhakaStartOfDay(nextY, nextM, nextD);

      const label = cleanFrom === cleanTo ? cleanFrom : `${cleanFrom} – ${cleanTo}`;
      return {
        period: "custom",
        startAt,
        endAt,
        label,
        from: cleanFrom,
        to: cleanTo,
      };
    }
  }

  if (period === "today") {
    const startAt = createDhakaStartOfDay(year, month, day);
    const tomorrowStr = addDays(todayStr, 1);
    const [tomY, tomM, tomD] = tomorrowStr.split("-").map((v) => Number.parseInt(v, 10));
    const endAt = createDhakaStartOfDay(tomY, tomM, tomD);
    return {
      period: "today",
      startAt,
      endAt,
      label: `Today (${todayStr})`,
      from: todayStr,
      to: todayStr,
    };
  }

  if (period === "yesterday") {
    const yesterdayStr = addDays(todayStr, -1);
    const [yestY, yestM, yestD] = yesterdayStr.split("-").map((v) => Number.parseInt(v, 10));
    const startAt = createDhakaStartOfDay(yestY, yestM, yestD);
    const endAt = createDhakaStartOfDay(year, month, day);
    return {
      period: "yesterday",
      startAt,
      endAt,
      label: `Yesterday (${yesterdayStr})`,
      from: yesterdayStr,
      to: yesterdayStr,
    };
  }

  if (period === "this_month") {
    const startAt = createDhakaStartOfDay(year, month, 1);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const endAt = createDhakaStartOfDay(nextMonthYear, nextMonth, 1);
    const fromStr = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
    return {
      period: "this_month",
      startAt,
      endAt,
      label: "This month",
      from: fromStr,
      to: todayStr,
    };
  }

  if (period === "last_month") {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthYear = month === 1 ? year - 1 : year;
    const startAt = createDhakaStartOfDay(prevMonthYear, prevMonth, 1);
    const endAt = createDhakaStartOfDay(year, month, 1);
    const fromStr = `${String(prevMonthYear).padStart(4, "0")}-${String(prevMonth).padStart(2, "0")}-01`;
    // Last day of previous month
    const lastDayPrevMonth = addDays(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`, -1);
    return {
      period: "last_month",
      startAt,
      endAt,
      label: "Last month",
      from: fromStr,
      to: lastDayPrevMonth,
    };
  }

  if (period === "all") {
    return {
      period: "all",
      startAt: null,
      endAt: null,
      label: "All time",
      from: null,
      to: null,
    };
  }

  // Rolling days presets: 7d, 30d, 90d
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  // Rolling N full days ending at end of today in Asia/Dhaka
  const fromStr = addDays(todayStr, -(days - 1));
  const [fromY, fromM, fromD] = fromStr.split("-").map((v) => Number.parseInt(v, 10));
  const startAt = createDhakaStartOfDay(fromY, fromM, fromD);

  const tomorrowStr = addDays(todayStr, 1);
  const [tomY, tomM, tomD] = tomorrowStr.split("-").map((v) => Number.parseInt(v, 10));
  const endAt = createDhakaStartOfDay(tomY, tomM, tomD);

  return {
    period,
    startAt,
    endAt,
    label: `${days} days`,
    from: fromStr,
    to: todayStr,
  };
}

/**
 * Preserves the current global reporting period when navigating to a new admin URL.
 * Does NOT leak page-specific local filters (like status, q, segment, channel).
 * Safely preserves and handles URL hash fragments (e.g. #payment-reconciliation).
 */
export function preserveReportingPeriod(
  targetHref: string,
  currentQuery: Record<string, unknown> | URLSearchParams | undefined | null,
  extraParamsToKeep: readonly string[] = [],
): string {
  if (!currentQuery) return targetHref;

  // Isolate hash fragment first so query string manipulation is completely hash-safe
  const hashIndex = targetHref.indexOf("#");
  let urlWithoutHash = targetHref;
  let hash = "";
  if (hashIndex !== -1) {
    urlWithoutHash = targetHref.slice(0, hashIndex);
    hash = targetHref.slice(hashIndex);
  }

  const currentPeriod = parseAdminReportingPeriod(currentQuery);
  const [base, existingSearch] = urlWithoutHash.split("?");
  const params = new URLSearchParams(existingSearch || "");

  // Legacy range must never be emitted in newly generated links
  params.delete("range");

  let from: string | null = null;
  let to: string | null = null;
  if (currentQuery instanceof URLSearchParams) {
    from = currentQuery.get("from");
    to = currentQuery.get("to");
  } else {
    from = firstQueryValue(currentQuery.from);
    to = firstQueryValue(currentQuery.to);
  }

  if (currentPeriod === "custom") {
    let cleanFrom = typeof from === "string" && isValidDateStr(from.trim()) ? from.trim() : null;
    let cleanTo = typeof to === "string" && isValidDateStr(to.trim()) ? to.trim() : null;

    if (!cleanFrom && !cleanTo) {
      params.set("period", DEFAULT_ADMIN_REPORTING_PERIOD);
      params.delete("from");
      params.delete("to");
    } else {
      if (!cleanFrom) cleanFrom = cleanTo;
      if (!cleanTo) cleanTo = cleanFrom;
      if (cleanFrom && cleanTo) {
        if (cleanFrom > cleanTo) {
          const temp = cleanFrom;
          cleanFrom = cleanTo;
          cleanTo = temp;
        }
        params.set("period", "custom");
        params.set("from", cleanFrom);
        params.set("to", cleanTo);
      }
    }
  } else {
    params.set("period", currentPeriod);
    params.delete("from");
    params.delete("to");
  }

  // Preserve specifically requested extra parameters if present
  for (const key of extraParamsToKeep) {
    let val: string | null = null;
    if (currentQuery instanceof URLSearchParams) {
      val = currentQuery.get(key);
    } else {
      val = firstQueryValue(currentQuery[key]);
    }
    if (val !== null && val !== undefined && val !== "") {
      params.set(key, val);
    }
  }

  const qs = params.toString();
  const urlWithSearch = qs ? `${base}?${qs}` : base;
  return `${urlWithSearch}${hash}`;
}

/**
 * Builds a URL with an updated reporting period while preserving page-local filters.
 * Resets pagination 'page' to 1 for correctness.
 * Safely preserves and handles URL hash fragments.
 */
export function buildReportingPeriodUrl(
  pathname: string,
  currentQuery: Record<string, unknown> | URLSearchParams | undefined | null,
  newPeriod: AdminReportingPeriod,
  customFrom?: string | null,
  customTo?: string | null,
): string {
  // Isolate hash fragment first
  const hashIndex = pathname.indexOf("#");
  let pathWithoutHash = pathname;
  let hash = "";
  if (hashIndex !== -1) {
    pathWithoutHash = pathname.slice(0, hashIndex);
    hash = pathname.slice(hashIndex);
  }

  const params = new URLSearchParams();

  // Copy existing query parameters
  if (currentQuery instanceof URLSearchParams) {
    for (const [key, value] of currentQuery.entries()) {
      if (key !== "period" && key !== "range" && key !== "from" && key !== "to") {
        params.set(key, value);
      }
    }
  } else if (currentQuery && typeof currentQuery === "object") {
    for (const [key, value] of Object.entries(currentQuery)) {
      if (key !== "period" && key !== "range" && key !== "from" && key !== "to") {
        const val = firstQueryValue(value);
        if (val !== null && val !== undefined) {
          params.set(key, val);
        }
      }
    }
  }

  if (newPeriod === "custom") {
    let cleanFrom = typeof customFrom === "string" && isValidDateStr(customFrom.trim()) ? customFrom.trim() : null;
    let cleanTo = typeof customTo === "string" && isValidDateStr(customTo.trim()) ? customTo.trim() : null;

    if (!cleanFrom && !cleanTo) {
      params.set("period", DEFAULT_ADMIN_REPORTING_PERIOD);
      params.delete("from");
      params.delete("to");
    } else {
      if (!cleanFrom) cleanFrom = cleanTo;
      if (!cleanTo) cleanTo = cleanFrom;
      if (cleanFrom && cleanTo) {
        if (cleanFrom > cleanTo) {
          const temp = cleanFrom;
          cleanFrom = cleanTo;
          cleanTo = temp;
        }
        params.set("period", "custom");
        params.set("from", cleanFrom);
        params.set("to", cleanTo);
      }
    }
  } else {
    // Set new period
    params.set("period", newPeriod);
    params.delete("from");
    params.delete("to");
  }

  // Reset pagination if present
  if (params.has("page")) {
    params.set("page", "1");
  }

  const qs = params.toString();
  const urlWithSearch = qs ? `${pathWithoutHash}?${qs}` : pathWithoutHash;
  return `${urlWithSearch}${hash}`;
}

