import { and, eq } from "drizzle-orm";
import { deriveAttributionSource } from "../commerce/attribution";
import type { BrowserCommerceEventInput } from "../commerce/contracts";
import { CommerceError } from "../commerce/commerce-error";
import type {
  BrowserEventRequestContext,
  CommerceEventRepository,
} from "../commerce/event-repository";
import { multiplyMinorAmount } from "../commerce/money";
import { getDatabase, type Database } from "./index";
import {
  commerceEvents,
  products,
  productVariants,
  stores,
  visitorSessions,
  visitors,
} from "./schema";

export class DrizzleCommerceEventRepository
  implements CommerceEventRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  recordBrowserEvent(
    input: BrowserCommerceEventInput,
    occurredAt: Date,
    requestContext: BrowserEventRequestContext,
  ) {
    return this.database.transaction(async (transaction) => {
      const [store] = await transaction
        .select({ id: stores.id, currency: stores.currency })
        .from(stores)
        .where(and(eq(stores.slug, input.storeSlug), eq(stores.status, "ACTIVE")))
        .limit(1);
      if (!store) {
        throw new CommerceError(
          "STORE_NOT_AVAILABLE",
          "The requested store is not available.",
        );
      }

      let productId: string | null = null;
      let variantId: string | null = null;
      let valueMinor: number | null = null;
      if (input.productId && input.variantId) {
        const [variant] = await transaction
          .select({
            productId: products.id,
            variantId: productVariants.id,
            priceMinor: productVariants.priceMinor,
          })
          .from(productVariants)
          .innerJoin(
            products,
            and(
              eq(products.id, productVariants.productId),
              eq(products.storeId, productVariants.storeId),
            ),
          )
          .where(
            and(
              eq(productVariants.storeId, store.id),
              eq(productVariants.id, input.variantId),
              eq(productVariants.productId, input.productId),
              eq(productVariants.isActive, true),
              eq(products.status, "ACTIVE"),
            ),
          )
          .limit(1);
        if (!variant) {
          throw new CommerceError(
            "VARIANT_NOT_AVAILABLE",
            "The requested product or variant is not available.",
          );
        }
        productId = variant.productId;
        variantId = variant.variantId;
        valueMinor = multiplyMinorAmount(variant.priceMinor, input.quantity);
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
        .returning({
          id: visitorSessions.id,
          visitorId: visitorSessions.visitorId,
        });
      if (!session) throw new Error("Visitor session upsert returned no row.");
      if (session.visitorId !== visitor.id) {
        throw new Error("Session key is already bound to another visitor.");
      }

      const source = deriveAttributionSource(input.attribution);
      const inserted = await transaction
        .insert(commerceEvents)
        .values({
          storeId: store.id,
          visitorId: visitor.id,
          sessionId: session.id,
          productId,
          variantId,
          eventName: input.eventName,
          eventId: input.eventId,
          valueMinor,
          currency: valueMinor === null ? null : store.currency,
          pageUrl: input.attribution.landingPage,
          payload: { quantity: input.quantity, source },
          occurredAt,
          receivedAt: occurredAt,
        })
        .onConflictDoNothing({
          target: [commerceEvents.storeId, commerceEvents.eventId],
        })
        .returning({ id: commerceEvents.id });

      return { eventId: input.eventId, created: inserted.length === 1 };
    });
  }
}
