import { and, eq } from "drizzle-orm";
import type { BrowserInteractionEventInput } from "../analytics/interaction-contracts";
import type {
  BrowserInteractionRequestContext,
  InteractionEventRepository,
} from "../analytics/interaction-repository";
import { CommerceError } from "../commerce/commerce-error";
import { getDatabase, type Database } from "./index";
import {
  stores,
  visitorInteractionEvents,
  visitorSessions,
  visitors,
} from "./schema";

export class DrizzleInteractionEventRepository implements InteractionEventRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  recordInteractionEvent(
    input: BrowserInteractionEventInput,
    occurredAt: Date,
    requestContext: BrowserInteractionRequestContext,
  ) {
    return this.database.transaction(async (transaction) => {
      const [store] = await transaction
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.slug, input.storeSlug), eq(stores.status, "ACTIVE")))
        .limit(1);
      if (!store) {
        throw new CommerceError("STORE_NOT_AVAILABLE", "The requested store is not available.");
      }

      const [visitor] = await transaction
        .insert(visitors)
        .values({
          storeId: store.id,
          visitorKey: input.attribution.visitorKey,
          firstSeenAt: occurredAt,
          lastSeenAt: occurredAt,
        })
        .onConflictDoUpdate({
          target: [visitors.storeId, visitors.visitorKey],
          set: { lastSeenAt: occurredAt },
        })
        .returning({ id: visitors.id });
      if (!visitor) throw new Error("Visitor upsert returned no row.");

      const [session] = await transaction
        .insert(visitorSessions)
        .values({
          storeId: store.id,
          visitorId: visitor.id,
          sessionKey: input.attribution.sessionKey,
          landingPage: input.attribution.landingPage,
          referrer: input.attribution.referrer,
          utmSource: input.attribution.utmSource,
          utmMedium: input.attribution.utmMedium,
          utmCampaign: input.attribution.utmCampaign,
          utmContent: input.attribution.utmContent,
          utmTerm: input.attribution.utmTerm,
          fbclid: input.attribution.fbclid,
          gclid: input.attribution.gclid,
          userAgent: requestContext.userAgent,
          ipHash: requestContext.ipHash,
          startedAt: occurredAt,
          lastSeenAt: occurredAt,
        })
        .onConflictDoUpdate({
          target: [visitorSessions.storeId, visitorSessions.sessionKey],
          set: {
            lastSeenAt: occurredAt,
            userAgent: requestContext.userAgent,
            ipHash: requestContext.ipHash,
          },
        })
        .returning({ id: visitorSessions.id, visitorId: visitorSessions.visitorId });
      if (!session) throw new Error("Visitor session upsert returned no row.");
      if (session.visitorId !== visitor.id) {
        throw new Error("Session key is already bound to another visitor.");
      }

      const inserted = await transaction
        .insert(visitorInteractionEvents)
        .values({
          storeId: store.id,
          visitorId: visitor.id,
          sessionId: session.id,
          eventName: input.eventName,
          eventId: input.eventId,
          pageUrl: input.attribution.landingPage,
          elementKey: input.elementKey,
          elementLabel: input.elementLabel,
          sectionKey: input.sectionKey,
          targetUrl: input.targetUrl,
          scrollDepth: input.scrollDepth,
          payload: { consent: input.consent },
          occurredAt,
          receivedAt: occurredAt,
        })
        .onConflictDoNothing({
          target: [visitorInteractionEvents.storeId, visitorInteractionEvents.eventId],
        })
        .returning({ id: visitorInteractionEvents.id });

      return { eventId: input.eventId, created: inserted.length === 1 };
    });
  }
}
