import { and, desc, eq, sql } from "drizzle-orm";
import type { AdminFulfillmentRepository } from "../admin/fulfillment-repository";
import { getDatabase, type Database } from "./index";
import { fulfillmentShipments, orderItems, orders } from "./schema";

export class DrizzleAdminFulfillmentRepository implements AdminFulfillmentRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async getOrderCandidate(storeId: string, publicId: string) {
    const [order] = await this.database
      .select({
        orderId: orders.id,
        publicId: orders.publicId,
        status: orders.status,
        currency: orders.currency,
        totalMinor: orders.totalMinor,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        addressLine1: orders.addressLine1,
        addressLine2: orders.addressLine2,
        area: orders.area,
        district: orders.district,
        note: orders.note,
      })
      .from(orders)
      .where(and(eq(orders.storeId, storeId), eq(orders.publicId, publicId)))
      .limit(1);
    if (!order) return null;

    const [items, shipments] = await Promise.all([
      this.database
        .select({ productName: orderItems.productName, sku: orderItems.sku, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.orderId)),
      this.database
        .select({
          id: fulfillmentShipments.id,
          provider: fulfillmentShipments.provider,
          status: fulfillmentShipments.status,
          requestFingerprint: fulfillmentShipments.requestFingerprint,
          consignmentId: fulfillmentShipments.consignmentId,
          trackingCode: fulfillmentShipments.trackingCode,
          providerStatus: fulfillmentShipments.providerStatus,
          lastError: fulfillmentShipments.lastError,
          submittedAt: fulfillmentShipments.submittedAt,
          updatedAt: fulfillmentShipments.updatedAt,
        })
        .from(fulfillmentShipments)
        .where(and(eq(fulfillmentShipments.storeId, storeId), eq(fulfillmentShipments.orderId, order.orderId)))
        .orderBy(desc(fulfillmentShipments.updatedAt))
        .limit(1),
    ]);

    return {
      ...order,
      itemDescription: items.map((item) => `${item.productName}${item.sku ? ` (${item.sku})` : ""} × ${item.quantity}`).join("; ").slice(0, 250),
      totalLot: items.reduce((total, item) => total + item.quantity, 0),
      shipment: shipments[0] ?? null,
    };
  }

  async claimSubmission(input: { storeId: string; orderId: string; requestFingerprint: string; now: Date }) {
    const nowIso = input.now.toISOString();
    const staleBeforeIso = new Date(input.now.getTime() - 5 * 60 * 1000).toISOString();
    const claimed = await this.database.execute(sql<{ status: string }>`
      insert into fulfillment_shipments (
        store_id, order_id, provider, status, request_fingerprint, last_error, created_at, updated_at
      ) values (
        ${input.storeId}, ${input.orderId}, 'STEADFAST', 'PENDING', ${input.requestFingerprint}, null,
        ${nowIso}::timestamptz, ${nowIso}::timestamptz
      )
      on conflict (store_id, order_id) do update set
        status = 'PENDING',
        request_fingerprint = excluded.request_fingerprint,
        last_error = null,
        updated_at = excluded.updated_at
      where fulfillment_shipments.status = 'FAILED'
         or (fulfillment_shipments.status = 'PENDING' and fulfillment_shipments.updated_at <= ${staleBeforeIso}::timestamptz)
      returning status
    `);
    if (claimed.length) return "ACQUIRED" as const;

    const [existing] = await this.database
      .select({ status: fulfillmentShipments.status })
      .from(fulfillmentShipments)
      .where(and(eq(fulfillmentShipments.storeId, input.storeId), eq(fulfillmentShipments.orderId, input.orderId)))
      .limit(1);
    return existing?.status === "SUBMITTED" ? "SUBMITTED" as const : "BUSY" as const;
  }

  async markSubmitted(input: { storeId: string; orderId: string; consignmentId: string; trackingCode: string; providerStatus: string | null; providerResponse: unknown; now: Date }) {
    await this.database
      .update(fulfillmentShipments)
      .set({
        status: "SUBMITTED",
        consignmentId: input.consignmentId,
        trackingCode: input.trackingCode,
        providerStatus: input.providerStatus,
        providerResponse: input.providerResponse,
        lastError: null,
        submittedAt: input.now,
        updatedAt: input.now,
      })
      .where(and(eq(fulfillmentShipments.storeId, input.storeId), eq(fulfillmentShipments.orderId, input.orderId)));
  }

  async markFailed(input: { storeId: string; orderId: string; error: string; now: Date }) {
    await this.database
      .update(fulfillmentShipments)
      .set({ status: "FAILED", lastError: input.error, updatedAt: input.now })
      .where(and(eq(fulfillmentShipments.storeId, input.storeId), eq(fulfillmentShipments.orderId, input.orderId), sql`${fulfillmentShipments.status} <> 'SUBMITTED'`));
  }
}
