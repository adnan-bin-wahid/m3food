import { and, eq, sql } from "drizzle-orm";
import { deriveAttributionSource } from "../commerce/attribution";
import type { AttributionInput, LandingOrderInput } from "../commerce/contracts";
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
  orderAttributions,
  orderConsents,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
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
      publicId: orders.publicId,
      requestHash: orders.requestHash,
      status: orders.status,
      totalMinor: orders.totalMinor,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(
      and(
        eq(stores.slug, storeSlug),
        eq(orders.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return row ?? null;
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
      });
    if (!session) throw new Error("Session upsert returned no row.");
    if (session.visitorId !== visitor.id) {
      throw new Error("Session key is already bound to another visitor.");
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
    const { order, item, payment, consent, attribution, purchaseEvent } = graph;

    const [createdOrder] = await this.transaction
      .insert(orders)
      .values({
        ...order,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        discountMinor: 0,
        shippingMinor: 0,
        updatedAt: order.createdAt,
      })
      .returning({
        id: orders.id,
        publicId: orders.publicId,
        requestHash: orders.requestHash,
        status: orders.status,
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
      method: "COD",
      status: "UNPAID",
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
    });
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

    const source = deriveAttributionSource(attribution);
    const touch = { ...attribution, source };
    await this.transaction.insert(orderAttributions).values({
      storeId: order.storeId,
      orderId: createdOrder.id,
      visitorId: order.visitorId,
      sessionId: order.sessionId,
      source,
      medium: attribution.utmMedium,
      campaign: attribution.utmCampaign,
      content: attribution.utmContent,
      term: attribution.utmTerm,
      referrer: attribution.referrer,
      landingPage: attribution.landingPage,
      fbclid: attribution.fbclid,
      gclid: attribution.gclid,
      firstTouch: touch,
      lastTouch: touch,
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
      payload: { source },
      receivedAt: order.createdAt,
    });

    return createdOrder;
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
