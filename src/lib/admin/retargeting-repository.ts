export type RetargetingAudienceKey =
  | "CART_ABANDONERS"
  | "CHECKOUT_ABANDONERS"
  | "VIEWED_NO_PURCHASE";

export interface RetargetingAudienceRow {
  visitorId: string;
  visitorKey: string;
  sessionId: string;
  sessionKey: string;
  source: string;
  campaign: string | null;
  productName: string | null;
  sku: string | null;
  valueMinor: number;
  lastActionAt: Date;
  lastSeenAt: Date;
}

export interface RetargetingAudienceSnapshot {
  store: {
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    metaPixelId: string;
  };
  rows: RetargetingAudienceRow[];
}

export interface RetargetingRepository {
  getAudience(
    storeId: string,
    eventName: "ADD_TO_CART" | "BEGIN_CHECKOUT" | "VIEW_CONTENT",
    startAt: Date,
    cutoffAt: Date,
    limit: number,
  ): Promise<RetargetingAudienceSnapshot | null>;
}
