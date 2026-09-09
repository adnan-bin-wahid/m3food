export const ORDER_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type OrderRiskLevel = (typeof ORDER_RISK_LEVELS)[number];

export interface OrderRiskHistory {
  totalOrders: number;
  delivered: number;
  cancelled: number;
  returned: number;
  recent1h: number;
  recent24h: number;
  sameAddress24h: number;
  exactDuplicate10m: boolean;
}

export interface OrderRiskSnapshot {
  totalOrders: number;
  delivered: number;
  cancelled: number;
  returned: number;
  recent1h: number;
  recent24h: number;
  sameAddress24h: number;
  resolvedOrders: number;
  failedOutcomes: number;
  failedOutcomeRate: number | null;
}

export interface OrderRiskAssessment {
  level: OrderRiskLevel;
  reasons: string[];
  manualReviewRequired: boolean;
  snapshot: OrderRiskSnapshot;
}

function safeCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function assessOrderRisk(
  history: OrderRiskHistory,
): OrderRiskAssessment {
  const totalOrders = safeCount(history.totalOrders);
  const delivered = safeCount(history.delivered);
  const cancelled = safeCount(history.cancelled);
  const returned = safeCount(history.returned);
  const recent1h = safeCount(history.recent1h);
  const recent24h = safeCount(history.recent24h);
  const sameAddress24h = safeCount(history.sameAddress24h);
  const failedOutcomes = cancelled + returned;
  const resolvedOrders = delivered + failedOutcomes;
  const failedOutcomeRate =
    resolvedOrders > 0 ? failedOutcomes / resolvedOrders : null;

  const highReasons: string[] = [];
  const mediumReasons: string[] = [];

  if (recent1h >= 3) {
    highReasons.push("3+ previous orders from this phone in the last hour");
  }
  if (recent24h >= 5) {
    highReasons.push("5+ previous orders from this phone in the last 24 hours");
  }
  if (
    resolvedOrders >= 3 &&
    failedOutcomeRate !== null &&
    failedOutcomeRate >= 0.6
  ) {
    highReasons.push("60%+ cancelled/returned rate across resolved orders");
  }

  if (recent1h >= 1) {
    mediumReasons.push("recent order from this phone within the last hour");
  }
  if (recent24h >= 3) {
    mediumReasons.push("3+ previous orders from this phone in the last 24 hours");
  }
  if (sameAddress24h >= 1) {
    mediumReasons.push("same phone and address used for another order today");
  }
  if (
    resolvedOrders >= 3 &&
    failedOutcomeRate !== null &&
    failedOutcomeRate >= 0.4
  ) {
    mediumReasons.push("40%+ cancelled/returned rate across resolved orders");
  }

  const level: OrderRiskLevel =
    highReasons.length > 0
      ? "HIGH"
      : mediumReasons.length > 0
        ? "MEDIUM"
        : "LOW";

  const reasons =
    level === "HIGH"
      ? [...highReasons, ...mediumReasons]
      : level === "MEDIUM"
        ? mediumReasons
        : [];

  return {
    level,
    reasons: [...new Set(reasons)],
    manualReviewRequired: level === "HIGH",
    snapshot: {
      totalOrders,
      delivered,
      cancelled,
      returned,
      recent1h,
      recent24h,
      sameAddress24h,
      resolvedOrders,
      failedOutcomes,
      failedOutcomeRate,
    },
  };
}
