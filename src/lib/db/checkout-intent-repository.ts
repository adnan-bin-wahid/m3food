import { and, eq } from "drizzle-orm";
import type {
  CheckoutIntentRepository,
  PersistCheckoutIntentInput,
} from "../commerce/checkout-intent-repository";
import { getDatabase, type Database } from "./index";
import {
  checkoutIntents,
  products,
  productVariants,
  stores,
  visitorSessions,
  visitors,
} from "./schema";

export class DrizzleCheckoutIntentRepository implements CheckoutIntentRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async upsertIntent(input: PersistCheckoutIntentInput) {
    return this.database.transaction(async (transaction) => {
      const [selection] = await transaction
        .select({
          storeId: stores.id,
          productId: products.id,
          variantId: productVariants.id,
        })
        .from(productVariants)
        .innerJoin(
          products,
          and(
            eq(products.id, productVariants.productId),
            eq(products.storeId, productVariants.storeId),
          ),
        )
        .innerJoin(stores, eq(stores.id, productVariants.storeId))
        .where(
          and(
            eq(stores.slug, input.storeSlug),
            eq(stores.status, "ACTIVE"),
            eq(products.status, "ACTIVE"),
            eq(products.id, input.productId),
            eq(productVariants.id, input.variantId),
            eq(productVariants.isActive, true),
          ),
        )
        .limit(1);
      if (!selection) return { kind: "STORE_OR_VARIANT_NOT_FOUND" } as const;

      const [visitor] = await transaction
        .insert(visitors)
        .values({
          storeId: selection.storeId,
          visitorKey: input.attribution.visitorKey,
          firstSeenAt: input.now,
          lastSeenAt: input.now,
        })
        .onConflictDoUpdate({
          target: [visitors.storeId, visitors.visitorKey],
          set: { lastSeenAt: input.now },
        })
        .returning({ id: visitors.id });
      if (!visitor) throw new Error("Checkout-intent visitor upsert returned no row.");

      const [session] = await transaction
        .insert(visitorSessions)
        .values({
          storeId: selection.storeId,
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
          startedAt: input.now,
          lastSeenAt: input.now,
        })
        .onConflictDoUpdate({
          target: [visitorSessions.storeId, visitorSessions.sessionKey],
          set: { lastSeenAt: input.now },
        })
        .returning({ id: visitorSessions.id, visitorId: visitorSessions.visitorId });
      if (!session) throw new Error("Checkout-intent session upsert returned no row.");
      if (session.visitorId !== visitor.id) {
        throw new Error("Checkout-intent session belongs to another visitor.");
      }

      const [intent] = await transaction
        .insert(checkoutIntents)
        .values({
          storeId: selection.storeId,
          intentKey: input.intentKey,
          visitorId: visitor.id,
          sessionId: session.id,
          productId: selection.productId,
          variantId: selection.variantId,
          phone: input.contact.phone,
          email: input.contact.email,
          quantity: input.quantity,
          privacyPolicyVersion: input.consent.privacyPolicyVersion,
          emailMarketingAllowed: input.consent.emailMarketingAllowed,
          smsMarketingAllowed: input.consent.smsMarketingAllowed,
          whatsappMarketingAllowed: input.consent.whatsappMarketingAllowed,
          lastActivityAt: input.now,
          createdAt: input.now,
          updatedAt: input.now,
        })
        .onConflictDoUpdate({
          target: [checkoutIntents.storeId, checkoutIntents.intentKey],
          set: {
            phone: input.contact.phone,
            email: input.contact.email,
            quantity: input.quantity,
            privacyPolicyVersion: input.consent.privacyPolicyVersion,
            emailMarketingAllowed: input.consent.emailMarketingAllowed,
            smsMarketingAllowed: input.consent.smsMarketingAllowed,
            whatsappMarketingAllowed: input.consent.whatsappMarketingAllowed,
            lastActivityAt: input.now,
            updatedAt: input.now,
          },
        })
        .returning({ updatedAt: checkoutIntents.updatedAt });
      if (!intent) throw new Error("Checkout intent upsert returned no row.");
      return { kind: "OK", updatedAt: intent.updatedAt } as const;
    });
  }
}
