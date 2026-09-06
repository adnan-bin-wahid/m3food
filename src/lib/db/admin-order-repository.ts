import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import type {
  AdminOrderListQuery,
  AdminOrderRepository,
  AdminOrderTransitionInput,
  AdminOrderTransitionResult,
} from "../admin/order-admin-repository";
import { getOrderInventoryEffect } from "../admin/order-admin-service";
import { getDatabase, type Database } from "./index";
import {
  inventory,
  orderAttributions,
  orderConsents,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
  stores,
} from "./schema";

class InventoryConflictError extends Error {}
class StatusConflictError extends Error {
  constructor(readonly currentStatus: AdminOrderTransitionInput["expectedStatus"]) {
    super("The order status changed concurrently.");
  }
}

const sourceExpression = sql<string>`coalesce(nullif(trim(${orderAttributions.source}), ''), 'direct')`;

export class DrizzleAdminOrderRepository implements AdminOrderRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async listOrders(storeId: string, query: AdminOrderListQuery) {
    const conditions = [eq(orders.storeId, storeId)];
    if (query.status) conditions.push(eq(orders.status, query.status));
    if (query.query) {
      const pattern = `%${query.query}%`;
      const searchCondition = or(
        ilike(orders.publicId, pattern),
        ilike(orders.customerName, pattern),
        ilike(orders.customerPhone, pattern),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const [rows, countRows] = await Promise.all([
      this.database
        .select({
          publicId: orders.publicId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          district: orders.district,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          totalMinor: orders.totalMinor,
          currency: orders.currency,
          timezone: stores.timezone,
          source: sourceExpression.as("source"),
          createdAt: orders.createdAt,
        })
        .from(orders)
        .innerJoin(stores, eq(stores.id, orders.storeId))
        .leftJoin(orderAttributions, eq(orderAttributions.orderId, orders.id))
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt), desc(orders.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.database
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .where(and(...conditions)),
    ]);
    return { orders: rows, total: countRows[0]?.total ?? 0 };
  }

  async getOrderDetail(storeId: string, publicId: string) {
    const [base] = await this.database
      .select({
        id: orders.id,
        publicId: orders.publicId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customerEmail: orders.customerEmail,
        addressLine1: orders.addressLine1,
        addressLine2: orders.addressLine2,
        area: orders.area,
        district: orders.district,
        note: orders.note,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        currency: orders.currency,
        subtotalMinor: orders.subtotalMinor,
        discountMinor: orders.discountMinor,
        shippingMinor: orders.shippingMinor,
        totalMinor: orders.totalMinor,
        timezone: stores.timezone,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        attributionId: orderAttributions.id,
        source: sourceExpression.as("source"),
        medium: orderAttributions.medium,
        campaign: orderAttributions.campaign,
        content: orderAttributions.content,
        term: orderAttributions.term,
        landingPage: orderAttributions.landingPage,
        referrer: orderAttributions.referrer,
      })
      .from(orders)
      .innerJoin(stores, eq(stores.id, orders.storeId))
      .leftJoin(orderAttributions, eq(orderAttributions.orderId, orders.id))
      .where(and(eq(orders.storeId, storeId), eq(orders.publicId, publicId)))
      .limit(1);
    if (!base) return null;

    const [items, history, paymentRows, consentRows] = await Promise.all([
      this.database
        .select({
          id: orderItems.id,
          productName: orderItems.productName,
          variantLabel: orderItems.variantLabel,
          sku: orderItems.sku,
          quantity: orderItems.quantity,
          unitPriceMinor: orderItems.unitPriceMinor,
          totalMinor: orderItems.totalMinor,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, base.id))
        .orderBy(asc(orderItems.id)),
      this.database
        .select({
          id: orderStatusHistory.id,
          fromStatus: orderStatusHistory.fromStatus,
          toStatus: orderStatusHistory.toStatus,
          note: orderStatusHistory.note,
          changedByAdminEmail: orderStatusHistory.changedByAdminEmail,
          createdAt: orderStatusHistory.createdAt,
        })
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, base.id))
        .orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
      this.database
        .select({
          method: payments.method,
          status: payments.status,
          amountMinor: payments.amountMinor,
          currency: payments.currency,
          providerReference: payments.providerReference,
        })
        .from(payments)
        .where(and(eq(payments.storeId, storeId), eq(payments.orderId, base.id)))
        .orderBy(desc(payments.createdAt))
        .limit(1),
      this.database
        .select({
          privacyPolicyVersion: orderConsents.privacyPolicyVersion,
          analyticsAllowed: orderConsents.analyticsAllowed,
          emailMarketingAllowed: orderConsents.emailMarketingAllowed,
          smsMarketingAllowed: orderConsents.smsMarketingAllowed,
          whatsappMarketingAllowed: orderConsents.whatsappMarketingAllowed,
          capturedAt: orderConsents.capturedAt,
        })
        .from(orderConsents)
        .where(
          and(eq(orderConsents.storeId, storeId), eq(orderConsents.orderId, base.id)),
        )
        .limit(1),
    ]);

    return {
      publicId: base.publicId,
      customerName: base.customerName,
      customerPhone: base.customerPhone,
      customerEmail: base.customerEmail,
      addressLine1: base.addressLine1,
      addressLine2: base.addressLine2,
      area: base.area,
      district: base.district,
      note: base.note,
      status: base.status,
      paymentMethod: base.paymentMethod,
      paymentStatus: base.paymentStatus,
      currency: base.currency,
      subtotalMinor: base.subtotalMinor,
      discountMinor: base.discountMinor,
      shippingMinor: base.shippingMinor,
      totalMinor: base.totalMinor,
      timezone: base.timezone,
      source: base.source,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      items,
      history,
      payment: paymentRows[0] ?? null,
      attribution: base.attributionId
        ? {
            source: base.source,
            medium: base.medium,
            campaign: base.campaign,
            content: base.content,
            term: base.term,
            landingPage: base.landingPage,
            referrer: base.referrer,
          }
        : null,
      consent: consentRows[0] ?? null,
    };
  }

  async transitionOrder(
    input: AdminOrderTransitionInput,
  ): Promise<AdminOrderTransitionResult> {
    try {
      return await this.database.transaction(async (transaction) => {
        const [current] = await transaction
          .select({ id: orders.id, status: orders.status })
          .from(orders)
          .where(
            and(
              eq(orders.storeId, input.storeId),
              eq(orders.publicId, input.publicId),
            ),
          )
          .limit(1)
          .for("update");
        if (!current) return { kind: "NOT_FOUND" } as const;
        if (current.status !== input.expectedStatus) {
          return { kind: "CONFLICT", currentStatus: current.status } as const;
        }

        const inventoryEffect = getOrderInventoryEffect(input.toStatus);
        if (inventoryEffect !== "NONE") {
          const itemRows = await transaction
            .select({
              variantId: orderItems.variantId,
              quantity: orderItems.quantity,
              inventoryId: inventory.id,
              trackStock: inventory.trackStock,
            })
            .from(orderItems)
            .leftJoin(
              inventory,
              and(
                eq(inventory.storeId, input.storeId),
                eq(inventory.variantId, orderItems.variantId),
              ),
            )
            .where(eq(orderItems.orderId, current.id));
          const quantities = new Map<string, number>();
          for (const item of itemRows) {
            if (!item.inventoryId || !item.trackStock) continue;
            quantities.set(
              item.inventoryId,
              (quantities.get(item.inventoryId) ?? 0) + item.quantity,
            );
          }

          for (const [inventoryId, quantity] of quantities) {
            const updated =
              inventoryEffect === "RESTOCK"
                ? await transaction
                    .update(inventory)
                    .set({
                      available: sql`${inventory.available} + ${quantity}`,
                      revision: sql`${inventory.revision} + 1`,
                      updatedAt: input.now,
                    })
                    .where(
                      and(
                        eq(inventory.id, inventoryId),
                        eq(inventory.storeId, input.storeId),
                        eq(inventory.trackStock, true),
                      ),
                    )
                    .returning({ id: inventory.id })
                : inventoryEffect === "COMMIT_RESERVATION"
                  ? await transaction
                    .update(inventory)
                    .set({
                      available: sql`${inventory.available} - ${quantity}`,
                      reserved: sql`${inventory.reserved} - ${quantity}`,
                      revision: sql`${inventory.revision} + 1`,
                      updatedAt: input.now,
                    })
                    .where(
                      and(
                        eq(inventory.id, inventoryId),
                        eq(inventory.storeId, input.storeId),
                        eq(inventory.trackStock, true),
                        sql`${inventory.reserved} >= ${quantity}`,
                        sql`${inventory.available} >= ${quantity}`,
                      ),
                    )
                    .returning({ id: inventory.id })
                  : await transaction
                    .update(inventory)
                    .set({
                      reserved: sql`${inventory.reserved} - ${quantity}`,
                      revision: sql`${inventory.revision} + 1`,
                      updatedAt: input.now,
                    })
                    .where(
                      and(
                        eq(inventory.id, inventoryId),
                        eq(inventory.storeId, input.storeId),
                        eq(inventory.trackStock, true),
                        sql`${inventory.reserved} >= ${quantity}`,
                      ),
                    )
                    .returning({ id: inventory.id });
            if (updated.length !== 1) throw new InventoryConflictError();
          }
        }

        const updated = await transaction
          .update(orders)
          .set({ status: input.toStatus, updatedAt: input.now })
          .where(
            and(
              eq(orders.id, current.id),
              eq(orders.storeId, input.storeId),
              eq(orders.status, input.expectedStatus),
            ),
          )
          .returning({ publicId: orders.publicId, status: orders.status });
        if (updated.length !== 1) {
          throw new StatusConflictError(current.status);
        }

        await transaction.insert(orderStatusHistory).values({
          orderId: current.id,
          fromStatus: input.expectedStatus,
          toStatus: input.toStatus,
          note: input.note,
          changedByAdminUserId: input.actor.id,
          changedByAdminEmail: input.actor.email,
          createdAt: input.now,
        });
        return { kind: "UPDATED", ...updated[0] } as const;
      });
    } catch (error) {
      if (error instanceof InventoryConflictError) {
        return { kind: "INVENTORY_CONFLICT" };
      }
      if (error instanceof StatusConflictError) {
        return { kind: "CONFLICT", currentStatus: error.currentStatus };
      }
      throw error;
    }
  }
}
