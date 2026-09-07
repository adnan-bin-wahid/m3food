export interface VisitorIntelligenceStore {
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  clarityProjectId: string;
}

export interface CtaPerformanceRow {
  elementKey: string;
  elementLabel: string | null;
  sectionKey: string | null;
  uniqueViews: number;
  uniqueClicks: number;
  clicks: number;
  orders: number;
  revenueMinor: number;
}

export interface SectionPerformanceRow {
  sectionKey: string;
  uniqueVisitors: number;
  uniqueSessions: number;
}

export interface ScrollDepthRow {
  scrollDepth: number;
  uniqueSessions: number;
}

export interface VisitorIntelligenceOverviewRaw {
  store: VisitorIntelligenceStore;
  ctas: CtaPerformanceRow[];
  sections: SectionPerformanceRow[];
  scrollDepths: ScrollDepthRow[];
  interactionEvents: number;
}

export type VisitorTimelineKind = "SESSION" | "INTERACTION" | "COMMERCE" | "ORDER" | "ORDER_STATUS";

export interface VisitorTimelineEvent {
  id: string;
  kind: VisitorTimelineKind;
  eventName: string;
  label: string;
  occurredAt: Date;
  pageUrl: string | null;
  sectionKey: string | null;
  elementKey: string | null;
  elementLabel: string | null;
  targetUrl: string | null;
  scrollDepth: number | null;
  valueMinor: number | null;
  currency: string | null;
  metadata: Record<string, unknown>;
}

export interface VisitorSessionJourney {
  store: VisitorIntelligenceStore;
  visitorKey: string;
  sessionKey: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  landingPage: string | null;
  referrer: string | null;
  startedAt: Date;
  lastSeenAt: Date;
  timeline: VisitorTimelineEvent[];
}

export interface VisitorIntelligenceRepository {
  getOverview(
    storeId: string,
    startAt: Date | null,
    endAt: Date,
  ): Promise<VisitorIntelligenceOverviewRaw | null>;
  getSessionJourney(storeId: string, sessionKey: string): Promise<VisitorSessionJourney | null>;
}
