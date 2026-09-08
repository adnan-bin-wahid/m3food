import { and, asc, eq, sql } from "drizzle-orm";
import type {
  AdminOrderProfitabilityRepository,
  UpdateOrderFulfillmentCostInput,
  UpdateOrderFulfillmentCostResult,
} from "../admin/order-profitability-repository";
import { getDatabase, type Database } from "./index";
import {
  orderCostHistory,
  orderItems,
  orders,
} from "./schema";

export class DrizzleAdminOrderProfitabilityRepository
  implements AdminOrderProfitabilityRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getProfitability(storeId: string, publicId: string) {
    const [order] = await this.database
      .select({
        orderId: orders.id,
        publicId: orders.publicId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        currency: orders.currency,
        revenueMinor: orders.totalMinor,
        fulfillmentCostMinor: orders.fulfillmentCostMinor,
        fulfillmentCostRevision: orders.fulfillmentCostRevision,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.publicId, publicId),
        ),
      )
      .limit(1);

    if (!order) return null;

    const items = await this.database
      .select({
        id: orderItems.id,
        productName: orderItems.productName,
        sku: orderItems.sku,
        quantity: orderItems.quantity,
        totalCostMinor: orderItems.totalCostMinor,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.orderId))
      .orderBy(asc(orderItems.id));

    return {
      ...order,
      items,
    };
  }

  async updateFulfillmentCost(
    input: UpdateOrderFulfillmentCostInput,
  ): Promise<UpdateOrderFulfillmentCostResult> {
    return this.database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({
          id: orders.id,
          fulfillmentCostMinor: orders.fulfillmentCostMinor,
          fulfillmentCostRevision: orders.fulfillmentCostRevision,
        })
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

      if (current.fulfillmentCostRevision !== input.expectedRevision) {
        return {
          kind: "CONFLICT",
          currentRevision: current.fulfillmentCostRevision,
        } as const;
      }

      const [updated] = await transaction
        .update(orders)
        .set({
          fulfillmentCostMinor: input.fulfillmentCostMinor,
          fulfillmentCostRevision: sql`${orders.fulfillmentCostRevision} + 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(orders.id, current.id),
            eq(orders.storeId, input.storeId),
            eq(
              orders.fulfillmentCostRevision,
              input.expectedRevision,
            ),
          ),
        )
        .returning({
          revision: orders.fulfillmentCostRevision,
        });

      if (!updated) {
        const [latest] = await transaction
          .select({
            revision: orders.fulfillmentCostRevision,
          })
          .from(orders)
          .where(
            and(
              eq(orders.id, current.id),
              eq(orders.storeId, input.storeId),
            ),
          )
          .limit(1);

        return {
          kind: "CONFLICT",
          currentRevision: latest?.revision ?? input.expectedRevision,
        } as const;
      }

      await transaction.insert(orderCostHistory).values({
        storeId: input.storeId,
        orderId: current.id,
        action: "FULFILLMENT_COST_UPDATED",
        beforeFulfillmentCostMinor: current.fulfillmentCostMinor,
        afterFulfillmentCostMinor: input.fulfillmentCostMinor,
        changedByAdminUserId: input.actor.id,
        changedByAdminEmail: input.actor.email,
        createdAt: input.now,
      });

      return {
        kind: "UPDATED",
        revision: updated.revision,
      } as const;
    });
  }
}
