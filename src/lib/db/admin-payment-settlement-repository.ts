import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AdminPaymentSettlementRepository,
  UpdatePaymentSettlementInput,
  UpdatePaymentSettlementResult,
} from "../admin/payment-settlement-repository";
import { getDatabase, type Database } from "./index";
import { orders, payments, paymentStatusHistory } from "./schema";

export class DrizzleAdminPaymentSettlementRepository
  implements AdminPaymentSettlementRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async getSettlement(storeId: string, publicId: string) {
    const [order] = await this.database
      .select({
        orderId: orders.id,
        publicId: orders.publicId,
        orderPaymentStatus: orders.paymentStatus,
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

    const [payment] = await this.database
      .select({
        paymentId: payments.id,
        method: payments.method,
        status: payments.status,
        amountMinor: payments.amountMinor,
        currency: payments.currency,
        providerReference: payments.providerReference,
        revision: payments.revision,
        updatedAt: payments.updatedAt,
      })
      .from(payments)
      .where(
        and(
          eq(payments.storeId, storeId),
          eq(payments.orderId, order.orderId),
        ),
      )
      .orderBy(desc(payments.createdAt), desc(payments.id))
      .limit(1);

    if (!payment) return null;
    return { ...order, ...payment };
  }

  async updateSettlement(
    input: UpdatePaymentSettlementInput,
  ): Promise<UpdatePaymentSettlementResult> {
    return this.database.transaction(async (transaction) => {
      const [order] = await transaction
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, input.storeId),
            eq(orders.publicId, input.publicId),
          ),
        )
        .limit(1)
        .for("update");

      if (!order) return { kind: "NOT_FOUND" } as const;

      const [current] = await transaction
        .select({
          id: payments.id,
          status: payments.status,
          providerReference: payments.providerReference,
          revision: payments.revision,
        })
        .from(payments)
        .where(
          and(
            eq(payments.storeId, input.storeId),
            eq(payments.orderId, order.id),
          ),
        )
        .orderBy(desc(payments.createdAt), desc(payments.id))
        .limit(1)
        .for("update");

      if (!current) return { kind: "NOT_FOUND" } as const;

      if (
        current.id !== input.expectedPaymentId ||
        current.revision !== input.expectedRevision ||
        current.status !== input.expectedStatus
      ) {
        return {
          kind: "CONFLICT",
          currentPaymentId: current.id,
          currentRevision: current.revision,
          currentStatus: current.status,
        } as const;
      }

      const [updated] = await transaction
        .update(payments)
        .set({
          status: input.toStatus,
          providerReference: input.providerReference,
          revision: sql`${payments.revision} + 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(payments.id, current.id),
            eq(payments.storeId, input.storeId),
            eq(payments.revision, input.expectedRevision),
            eq(payments.status, input.expectedStatus),
          ),
        )
        .returning({
          revision: payments.revision,
          status: payments.status,
          providerReference: payments.providerReference,
        });

      if (!updated) {
        const [latest] = await transaction
          .select({
            id: payments.id,
            revision: payments.revision,
            status: payments.status,
          })
          .from(payments)
          .where(
            and(
              eq(payments.storeId, input.storeId),
              eq(payments.orderId, order.id),
            ),
          )
          .orderBy(desc(payments.createdAt), desc(payments.id))
          .limit(1);

        return {
          kind: "CONFLICT",
          currentPaymentId: latest?.id ?? null,
          currentRevision: latest?.revision ?? null,
          currentStatus: latest?.status ?? null,
        } as const;
      }

      await transaction
        .update(orders)
        .set({
          paymentStatus: input.toStatus,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(orders.id, order.id),
            eq(orders.storeId, input.storeId),
          ),
        );

      await transaction.insert(paymentStatusHistory).values({
        storeId: input.storeId,
        orderId: order.id,
        paymentId: current.id,
        fromStatus: current.status,
        toStatus: input.toStatus,
        beforeProviderReference: current.providerReference,
        afterProviderReference: input.providerReference,
        note: input.note,
        changedByAdminUserId: input.actor.id,
        changedByAdminEmail: input.actor.email,
        createdAt: input.now,
      });

      return {
        kind: "UPDATED",
        revision: updated.revision,
        status: updated.status,
        providerReference: updated.providerReference,
      } as const;
    });
  }
}
