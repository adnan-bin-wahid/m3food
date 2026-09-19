export type DashboardChannel = "Meta" | "Organic" | "Other";

export function normalizeSource(source: string) {
  const normalized = source.trim().toLowerCase();
  return normalized || "direct";
}

export function classifyDashboardSource(
  source: string,
  medium: string | null = null,
  hasMetaClick = false,
): DashboardChannel {
  const normalized = normalizeSource(source);
  if (
    hasMetaClick ||
    normalized === "facebook" ||
    normalized === "instagram" ||
    normalized === "meta" ||
    normalized === "fb" ||
    normalized.includes("facebook") ||
    normalized.includes("instagram")
  ) {
    return "Meta";
  }
  const normalizedMedium = medium?.trim().toLowerCase() ?? "";
  if (
    normalized === "direct" ||
    normalized === "organic" ||
    normalizedMedium === "organic" ||
    normalizedMedium === "seo"
  ) {
    return "Organic";
  }
  return "Other";
}
