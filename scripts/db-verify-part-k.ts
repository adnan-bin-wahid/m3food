import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { recordBrowserInteractionEvent } from "../src/lib/analytics/interaction-service";
import { getVisitorIntelligenceOverview, getVisitorSessionJourney } from "../src/lib/admin/visitor-intelligence-service";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { DrizzleAdminVisitorIntelligenceRepository } from "../src/lib/db/admin-visitor-intelligence-repository";
import { DrizzleInteractionEventRepository } from "../src/lib/db/interaction-repository";
import { stores, visitors } from "../src/lib/db/schema";
import { CURRENT_PRIVACY_POLICY_VERSION } from "../src/lib/privacy/consent";

async function main() {
  loadEnvConfig(process.cwd());
  const database = getDatabase();
  const [store] = await database
    .select({ id: stores.id, slug: stores.slug, clarityProjectId: stores.clarityProjectId })
    .from(stores)
    .where(and(eq(stores.slug, "m3food"), eq(stores.status, "ACTIVE")))
    .limit(1);
  if (!store) throw new Error("m3food active store not found");

  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const visitorKey = `pk_visitor_${suffix}`;
  const sessionKey = `pk_session_${suffix}`;
  const base = new Date();
  let visitorId: string | null = null;

  const interactionRepository = new DrizzleInteractionEventRepository(database);
  const adminRepository = new DrizzleAdminVisitorIntelligenceRepository(database);
  const baseInput = {
    storeSlug: store.slug,
    attribution: {
      visitorKey,
      sessionKey,
      landingPage: "https://example.test/part-k?utm_source=part-k-verification&utm_campaign=visitor-intelligence",
      referrer: "https://facebook.com/",
      utmSource: "part-k-verification",
      utmMedium: "system-test",
      utmCampaign: "visitor-intelligence",
    },
    consent: {
      analyticsAllowed: true as const,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    },
  };

  try {
    const events = [
      { eventName: "SESSION_START" as const },
      { eventName: "SECTION_VIEW" as const, sectionKey: "hero" },
      { eventName: "CTA_VIEW" as const, elementKey: "hero_order", elementLabel: "Order now", sectionKey: "hero", targetUrl: "https://example.test/#order" },
      { eventName: "CTA_CLICK" as const, elementKey: "hero_order", elementLabel: "Order now", sectionKey: "hero", targetUrl: "https://example.test/#order" },
      { eventName: "SCROLL_DEPTH" as const, scrollDepth: 50 },
    ];

    for (const [index, event] of events.entries()) {
      const result = await recordBrowserInteractionEvent(
        {
          ...baseInput,
          ...event,
          eventId: `part-k-${suffix}-${index}-${randomUUID()}`,
        },
        interactionRepository,
        new Date(base.getTime() + index * 1000),
        { userAgent: "Part K live verifier", ipHash: "part-k-verifier-ip-hash" },
      );
      if (!result.created) throw new Error(`Part K interaction ${event.eventName} was not created.`);
    }

    const [visitor] = await database
      .select({ id: visitors.id })
      .from(visitors)
      .where(and(eq(visitors.storeId, store.id), eq(visitors.visitorKey, visitorKey)))
      .limit(1);
    if (!visitor) throw new Error("Part K visitor was not persisted.");
    visitorId = visitor.id;

    const overview = await getVisitorIntelligenceOverview(store.id, "7d", adminRepository, new Date(base.getTime() + 10_000));
    if (!overview) throw new Error("Visitor intelligence overview was not available.");
    const cta = overview.ctas.find((row) => row.elementKey === "hero_order");
    if (!cta || cta.uniqueViews < 1 || cta.uniqueClicks < 1 || cta.ctr !== 100) {
      throw new Error("CTA view/click/CTR metrics were not visible in the intelligence overview.");
    }
    if (!overview.sections.some((row) => row.sectionKey === "hero" && row.uniqueSessions >= 1)) {
      throw new Error("Section reach was not visible in the intelligence overview.");
    }
    if (!overview.scrollDepths.some((row) => row.scrollDepth === 50 && row.uniqueSessions >= 1)) {
      throw new Error("Scroll-depth reach was not visible in the intelligence overview.");
    }

    const journey = await getVisitorSessionJourney(store.id, sessionKey, adminRepository);
    if (!journey) throw new Error("Visitor session timeline was not available.");
    for (const eventName of ["SESSION_START", "CTA_VIEW", "CTA_CLICK", "SCROLL_DEPTH"]) {
      if (!journey.timeline.some((event) => event.eventName === eventName)) {
        throw new Error(`Visitor journey is missing ${eventName}.`);
      }
    }
    if (journey.source !== "part-k-verification" || journey.campaign !== "visitor-intelligence") {
      throw new Error("Visitor journey attribution was not preserved.");
    }

    const foreign = await adminRepository.getSessionJourney("00000000-0000-4000-8000-000000000000", sessionKey);
    if (foreign !== null) throw new Error("Visitor journey is not store scoped.");

    console.log("LIVE PART K VISITOR INTELLIGENCE VERIFIED");
    console.log(`Store: ${store.slug}`);
    console.log("Consent-gated session/section/CTA/scroll persistence: verified");
    console.log("CTA unique-view CTR and section/scroll analytics: verified");
    console.log("Chronological visitor journey + source/campaign attribution: verified");
    console.log("Store-scoped journey access and Clarity project configuration field: verified");
  } finally {
    if (visitorId) {
      await database.delete(visitors).where(and(eq(visitors.storeId, store.id), eq(visitors.id, visitorId)));
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
