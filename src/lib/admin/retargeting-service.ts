import type {
  RetargetingAudienceKey,
  RetargetingAudienceSnapshot,
  RetargetingRepository,
} from "./retargeting-repository";

export const RETARGETING_WINDOWS = [7, 14, 30] as const;
export type RetargetingWindowDays = (typeof RETARGETING_WINDOWS)[number];
export const RETARGETING_ABANDONMENT_GRACE_MINUTES = 30;
export const RETARGETING_PREVIEW_LIMIT = 100;

export const RETARGETING_AUDIENCES: Record<
  RetargetingAudienceKey,
  {
    eventName: "ADD_TO_CART" | "BEGIN_CHECKOUT" | "VIEW_CONTENT";
    label: string;
    shortLabel: string;
    description: string;
    metaRule: string;
  }
> = {
  CART_ABANDONERS: {
    eventName: "ADD_TO_CART",
    label: "Cart abandoners",
    shortLabel: "Cart",
    description: "Added a product to cart, then did not purchase after that action.",
    metaRule: "Include AddToCart; exclude Purchase",
  },
  CHECKOUT_ABANDONERS: {
    eventName: "BEGIN_CHECKOUT",
    label: "Checkout abandoners",
    shortLabel: "Checkout",
    description: "Started checkout, then did not purchase after that action.",
    metaRule: "Include InitiateCheckout; exclude Purchase",
  },
  VIEWED_NO_PURCHASE: {
    eventName: "VIEW_CONTENT",
    label: "Viewed, no purchase",
    shortLabel: "Viewed",
    description: "Viewed a product, then did not purchase after that action.",
    metaRule: "Include ViewContent; exclude Purchase",
  },
};

export class RetargetingAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetargetingAdminError";
  }
}

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRetargetingAudience(value: unknown): RetargetingAudienceKey {
  const candidate = firstValue(value);
  return typeof candidate === "string" && candidate in RETARGETING_AUDIENCES
    ? (candidate as RetargetingAudienceKey)
    : "CART_ABANDONERS";
}

export function parseRetargetingWindow(value: unknown): RetargetingWindowDays {
  const candidate = Number(firstValue(value));
  return RETARGETING_WINDOWS.includes(candidate as RetargetingWindowDays)
    ? (candidate as RetargetingWindowDays)
    : 30;
}

export function resolveRetargetingWindow(
  days: RetargetingWindowDays,
  now = new Date(),
) {
  const endAt = new Date(now);
  const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffAt = new Date(
    endAt.getTime() - RETARGETING_ABANDONMENT_GRACE_MINUTES * 60 * 1000,
  );
  return { days, startAt, cutoffAt, endAt };
}

function safeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function buildView(
  snapshot: RetargetingAudienceSnapshot,
  audience: RetargetingAudienceKey,
  window: ReturnType<typeof resolveRetargetingWindow>,
) {
  const rows = snapshot.rows.map((row) => ({
    ...row,
    valueMinor: safeInteger(row.valueMinor),
    lastActionAt: new Date(row.lastActionAt),
    lastSeenAt: new Date(row.lastSeenAt),
  }));
  const potentialValueMinor = rows.reduce(
    (total, row) => total + row.valueMinor,
    0,
  );
  const sources = new Map<string, number>();
  for (const row of rows) {
    const source = row.source.trim().toLowerCase() || "direct";
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }
  return {
    store: snapshot.store,
    audience,
    definition: RETARGETING_AUDIENCES[audience],
    window,
    rows,
    summary: {
      visitors: rows.length,
      potentialValueMinor,
      sourceCount: sources.size,
      previewLimit: RETARGETING_PREVIEW_LIMIT,
    },
    sources: Array.from(sources.entries())
      .map(([source, visitors]) => ({ source, visitors }))
      .sort((left, right) => right.visitors - left.visitors || left.source.localeCompare(right.source)),
  };
}

export async function getRetargetingAudience(
  storeId: string,
  audience: RetargetingAudienceKey,
  days: RetargetingWindowDays,
  repository: RetargetingRepository,
  now = new Date(),
) {
  const window = resolveRetargetingWindow(days, now);
  const snapshot = await repository.getAudience(
    storeId,
    RETARGETING_AUDIENCES[audience].eventName,
    window.startAt,
    window.cutoffAt,
    RETARGETING_PREVIEW_LIMIT,
  );
  if (!snapshot) throw new RetargetingAdminError("The admin store is unavailable.");
  return buildView(snapshot, audience, window);
}
