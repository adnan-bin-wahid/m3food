import { and, asc, desc, eq, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { deriveAttributionSource } from "../commerce/attribution";
import type { AttributionInput, LandingOrderInput } from "../commerce/contracts";
import {
  normalizeCampaignKey,
  resolveRegisteredCampaignAttribution,
} from "../marketing/campaigns";
import type {
  ExistingLandingOrder,
  LandingOrderRepository,
  LandingOrderTransaction,
  NewLandingOrderGraph,
  PurchasableVariant,
  TrackingIdentity,
} from "../commerce/order-repository";
import { getDatabase, type Database } from "./index";
import {
  commerceEvents,
  customers,
  inventory,
  marketingCampaigns,
  orderAttributions,
  orderConsents,
  orderItems,
  orders,
  orderStatusHistory,
  paymentIntents,
  payments,
  phoneVerificationChallenges,
  products,
  productVariants,
  stores,
  visitorSessions,
  visitors,
} from "./schema";

type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
type QueryExecutor = Database | DatabaseTransaction;

async function findExistingOrder(
  executor: QueryExecutor,
  storeSlug: string,
  idempotencyKey: string,
): Promise<ExistingLandingOrder | null> {
  const [row] = await executor
    .select({
      id: orders.id,
      storeId: orders.storeId,
      customerId: orders.customerId,
      publicId: orders.publicId,
      requestHash: orders.requestHash,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      totalMinor: orders.totalMinor,
      currency: orders.currency,
      createdAt: orders.createdAt,
      paymentIntentId: paymentIntents.id,
      paymentIntentProvider: paymentIntents.provider,
      paymentIntentStatus: paymentIntents.status,
    })
    .from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .leftJoin(
      paymentIntents,
      and(
        eq(paymentIntents.storeId, orders.storeId),
        eq(paymentIntents.orderId, orders.id),
      ),
    )
    .where(
      and(
        eq(stores.slug, storeSlug),
        eq(orders.idempotencyKey, idempotencyKey),
      ),
    )
    .orderBy(
      desc(paymentIntents.createdAt),
      desc(paymentIntents.id),
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    storeId: row.storeId,
    customerId: row.customerId ?? undefined,
    publicId: row.publicId,
    requestHash: row.requestHash,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    paymentIntent:
      row.paymentIntentId &&
      row.paymentIntentProvider &&
      row.paymentIntentStatus
        ? {
            id: row.paymentIntentId,
            provider: row.paymentIntentProvider,
            status: row.paymentIntentStatus,
          }
        : undefined,
    totalMinor: row.totalMinor,
    currency: row.currency,
    createdAt: row.createdAt,
  };
}

class DrizzleLandingOrderTransaction implements LandingOrderTransaction {
  constructor(private readonly transaction: DatabaseTransaction) {}

  findExistingOrder(storeSlug: string, idempotencyKey: string) {
    return findExistingOrder(this.transaction, storeSlug, idempotencyKey);
  }

  async findPurchasableVariant(
    storeSlug: string,
    variantId: string,
  ): Promise<PurchasableVariant | null> {
    const [row] = await this.transaction
      .select({
        storeId: stores.id,
        currency: stores.currency,
        metaPixelId: stores.metaPixelId,
        productId: products.id,
        productName: products.name,
        variantId: productVariants.id,
        variantLabel: productVariants.label,
        sku: productVariants.sku,
        unitPriceMinor: productVariants.priceMinor,
        unitCostMinor: productVariants.unitCostMinor,
        trackStock: inventory.trackStock,
        available: inventory.available,
        reserved: inventory.reserved,
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
      .leftJoin(
        inventory,
        and(
          eq(inventory.storeId, stores.id),
          eq(inventory.variantId, productVariants.id),
        ),
      )
      .where(
        and(
          eq(stores.slug, storeSlug),
          eq(stores.status, "ACTIVE"),
          eq(products.status, "ACTIVE"),
          eq(productVariants.id, variantId),
          eq(productVariants.isActive, true),
        ),
      )
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      trackStock: row.trackStock ?? false,
      available: row.available ?? 0,
      reserved: row.reserved ?? 0,
    };
  }


  async consumePhoneVerification(
    storeId: string,
    challengeId: string,
    phone: string,
    now: Date,
  ): Promise<boolean> {
    const rows = await this.transaction
      .update(phoneVerificationChallenges)
      .set({
        consumedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(phoneVerificationChallenges.id, challengeId),
          eq(phoneVerificationChallenges.storeId, storeId),
          eq(phoneVerificationChallenges.phone, phone),
          isNotNull(phoneVerificationChallenges.verifiedAt),
          isNull(phoneVerificationChallenges.consumedAt),
          isNull(phoneVerificationChallenges.invalidatedAt),
        ),
      )
      .returning({ id: phoneVerificationChallenges.id });

    return rows.length === 1;
  }

  async getOrderRiskHistory(
    storeId: string,
    phone: string,
    addressLine1: string,
    variantId: string,
    quantity: number,
    now: Date,
  ) {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const normalizedAddress = addressLine1.trim().toLowerCase();

    const [history] = await this.transaction
      .select({
        totalOrders: sql<number>`count(*)::int`,
        delivered: sql<number>`count(*) filter (where ${orders.status} = 'DELIVERED')::int`,
        cancelled: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')::int`,
        returned: sql<number>`count(*) filter (where ${orders.status} = 'RETURNED')::int`,
        recent1h: sql<number>`count(*) filter (where ${orders.createdAt} >= ${oneHourAgo})::int`,
        recent24h: sql<number>`count(*) filter (where ${orders.createdAt} >= ${oneDayAgo})::int`,
        sameAddress24h: sql<number>`count(*) filter (
          where ${orders.createdAt} >= ${oneDayAgo}
          and lower(trim(${orders.addressLine1})) = ${normalizedAddress}
        )::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.customerPhone, phone),
        ),
      );

    const [duplicate] = await this.transaction
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.customerPhone, phone),
          eq(orderItems.variantId, variantId),
          eq(orderItems.quantity, quantity),
          sql`${orders.createdAt} >= ${tenMinutesAgo}`,
          sql`lower(trim(${orders.addressLine1})) = ${normalizedAddress}`,
          sql`${orders.status} in ('PENDING', 'CONFIRMED', 'PROCESSING')`,
        ),
      )
      .limit(1);

    return {
      totalOrders: history?.totalOrders ?? 0,
      delivered: history?.delivered ?? 0,
      cancelled: history?.cancelled ?? 0,
      returned: history?.returned ?? 0,
      recent1h: history?.recent1h ?? 0,
      recent24h: history?.recent24h ?? 0,
      sameAddress24h: history?.sameAddress24h ?? 0,
      exactDuplicate10m: Boolean(duplicate),
    };
  }

  async upsertCustomer(
    storeId: string,
    customer: LandingOrderInput["customer"],
    now: Date,
  ): Promise<string> {
    const [row] = await this.transaction
      .insert(customers)
      .values({
        storeId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [customers.storeId, customers.phone],
        set: {
          name: customer.name,
          email: customer.email,
          updatedAt: now,
        },
      })
      .returning({ id: customers.id });

    if (!row) throw new Error("Customer upsert returned no row.");
    return row.id;
  }

  async upsertTrackingIdentity(
    storeId: string,
    attribution: AttributionInput,
    now: Date,
  ): Promise<TrackingIdentity> {
    const normalizedCampaignKey = normalizeCampaignKey(attribution.utmCampaign);
    const [registeredCampaign] = normalizedCampaignKey
      ? await this.transaction
          .select({ id: marketingCampaigns.id })
          .from(marketingCampaigns)
          .where(
            and(
              eq(marketingCampaigns.storeId, storeId),
              eq(marketingCampaigns.campaignKey, normalizedCampaignKey),
            ),
          )
          .limit(1)
      : [];
    const campaignId = registeredCampaign?.id ?? null;

    const [visitor] = await this.transaction
      .insert(visitors)
      .values({
        storeId,
        visitorKey: attribution.visitorKey,
        firstSeenAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: [visitors.storeId, visitors.visitorKey],
        set: { lastSeenAt: now },
      })
      .returning({ id: visitors.id });
    if (!visitor) throw new Error("Visitor upsert returned no row.");

    const [session] = await this.transaction
      .insert(visitorSessions)
      .values({
        storeId,
        visitorId: visitor.id,
        sessionKey: attribution.sessionKey,
        campaignId,
        landingPage: attribution.landingPage,
        referrer: attribution.referrer,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        utmContent: attribution.utmContent,
        utmTerm: attribution.utmTerm,
        fbclid: attribution.fbclid,
        gclid: attribution.gclid,
        startedAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: [visitorSessions.storeId, visitorSessions.sessionKey],
        set: { lastSeenAt: now },
      })
      .returning({
        id: visitorSessions.id,
        visitorId: visitorSessions.visitorId,
        campaignId: visitorSessions.campaignId,
      });
    if (!session) throw new Error("Session upsert returned no row.");
    if (session.visitorId !== visitor.id) {
      throw new Error("Session key is already bound to another visitor.");
    }
    if (!session.campaignId && campaignId) {
      await this.transaction
        .update(visitorSessions)
        .set({ campaignId })
        .where(
          and(
            eq(visitorSessions.id, session.id),
            isNull(visitorSessions.campaignId),
          ),
        );
    }

    return { visitorId: visitor.id, sessionId: session.id };
  }

  async reserveStock(
    variant: PurchasableVariant,
    quantity: number,
    now: Date,
  ): Promise<boolean> {
    const reserved = await this.transaction
      .update(inventory)
      .set({
        reserved: sql`${inventory.reserved} + ${quantity}`,
        revision: sql`${inventory.revision} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(inventory.storeId, variant.storeId),
          eq(inventory.variantId, variant.variantId),
          eq(inventory.trackStock, true),
          sql`${inventory.available} - ${inventory.reserved} >= ${quantity}`,
        ),
      )
      .returning({ id: inventory.id });

    return reserved.length === 1;
  }

  async insertOrderGraph(
    graph: NewLandingOrderGraph,
  ): Promise<ExistingLandingOrder> {
    const { order, item, payment, paymentIntent, consent, attribution, purchaseEvent } = graph;

    const [createdOrder] = await this.transaction
      .insert(orders)
      .values({
        ...order,
        status: "PENDING",
        paymentMethod: payment.method,
        paymentStatus: payment.status,
        discountMinor: 0,
        shippingMinor: 0,
        updatedAt: order.createdAt,
      })
      .returning({
        id: orders.id,
        storeId: orders.storeId,
        customerId: orders.customerId,
        publicId: orders.publicId,
        requestHash: orders.requestHash,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalMinor: orders.totalMinor,
        currency: orders.currency,
        createdAt: orders.createdAt,
      });
    if (!createdOrder) throw new Error("Order insert returned no row.");

    await this.transaction.insert(orderItems).values({
      ...item,
      orderId: createdOrder.id,
    });
    await this.transaction.insert(orderStatusHistory).values({
      orderId: createdOrder.id,
      fromStatus: null,
      toStatus: "PENDING",
      note: "Landing order created",
      createdAt: order.createdAt,
    });
    await this.transaction.insert(payments).values({
      ...payment,
      storeId: order.storeId,
      orderId: createdOrder.id,
      method: payment.method,
      status: payment.status,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
    });
    if (paymentIntent) {
      await this.transaction.insert(paymentIntents).values({
        ...paymentIntent,
        storeId: order.storeId,
        orderId: createdOrder.id,
        paymentId: payment.id,
        updatedAt: paymentIntent.createdAt,
      });
    }

    await this.transaction.insert(orderConsents).values({
      storeId: order.storeId,
      orderId: createdOrder.id,
      privacyPolicyVersion: consent.privacyPolicyVersion,
      analyticsAllowed: consent.analyticsAllowed,
      emailMarketingAllowed: consent.emailMarketingAllowed,
      smsMarketingAllowed: consent.smsMarketingAllowed,
      whatsappMarketingAllowed: consent.whatsappMarketingAllowed,
      capturedAt: order.createdAt,
    });

    const sessionTouches = await this.transaction
      .select({
        sessionKey: visitorSessions.sessionKey,
        startedAt: visitorSessions.startedAt,
        utmSource: visitorSessions.utmSource,
        utmMedium: visitorSessions.utmMedium,
        utmCampaign: visitorSessions.utmCampaign,
        utmContent: visitorSessions.utmContent,
        utmTerm: visitorSessions.utmTerm,
        referrer: visitorSessions.referrer,
        landingPage: visitorSessions.landingPage,
      })
      .from(visitorSessions)
      .where(
        and(
          eq(visitorSessions.storeId, order.storeId),
          eq(visitorSessions.visitorId, order.visitorId),
          lte(visitorSessions.startedAt, order.createdAt),
        ),
      )
      .orderBy(asc(visitorSessions.startedAt), asc(visitorSessions.sessionKey));

    const registeredCampaigns = await this.transaction
      .select({
        id: marketingCampaigns.id,
        campaignKey: marketingCampaigns.campaignKey,
      })
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.storeId, order.storeId));

    const resolvedAttribution = resolveRegisteredCampaignAttribution(
      sessionTouches,
      registeredCampaigns,
    );
    const source = deriveAttributionSource(attribution);

    await this.transaction.insert(orderAttributions).values({
      storeId: order.storeId,
      orderId: createdOrder.id,
      visitorId: order.visitorId,
      sessionId: order.sessionId,
      firstTouchCampaignId: resolvedAttribution.firstTouchCampaignId,
      lastTouchCampaignId: resolvedAttribution.lastTouchCampaignId,
      source,
      medium: attribution.utmMedium,
      campaign: attribution.utmCampaign,
      content: attribution.utmContent,
      term: attribution.utmTerm,
      referrer: attribution.referrer,
      landingPage: attribution.landingPage,
      fbclid: attribution.fbclid,
      gclid: attribution.gclid,
      firstTouch: resolvedAttribution.firstTouch,
      lastTouch: resolvedAttribution.lastTouch,
      createdAt: order.createdAt,
    });
    await this.transaction.insert(commerceEvents).values({
      ...purchaseEvent,
      storeId: order.storeId,
      visitorId: order.visitorId,
      sessionId: order.sessionId,
      orderId: createdOrder.id,
      productId: item.productId,
      variantId: item.variantId,
      eventName: "PURCHASE",
      valueMinor: order.totalMinor,
      currency: order.currency,
      pageUrl: attribution.landingPage,
      payload: {
        source,
        firstTouchCampaignId: resolvedAttribution.firstTouchCampaignId,
        lastTouchCampaignId: resolvedAttribution.lastTouchCampaignId,
      },
      receivedAt: order.createdAt,
    });

    return {
      ...createdOrder,
      customerId: createdOrder.customerId ?? undefined,
      paymentIntent: paymentIntent
        ? {
            id: paymentIntent.id,
            provider: paymentIntent.provider,
            status: paymentIntent.status,
          }
        : undefined,
    };
  }
}

export class DrizzleLandingOrderRepository implements LandingOrderRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  withTransaction<T>(
    operation: (transaction: LandingOrderTransaction) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction((transaction) =>
      operation(new DrizzleLandingOrderTransaction(transaction)),
    );
  }

  findExistingOrder(storeSlug: string, idempotencyKey: string) {
    return findExistingOrder(this.database, storeSlug, idempotencyKey);
  }

  isIdempotencyConflict(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const postgresError = error as { code?: string; constraint_name?: string };
    return (
      postgresError.code === "23505" &&
      postgresError.constraint_name === "orders_store_idempotency_uniq"
    );
  }
}
