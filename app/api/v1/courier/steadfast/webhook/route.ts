import { NextResponse } from "next/server";
import { getDatabase } from "@/src/lib/db";
import { orders, fulfillmentShipments, orderStatusHistory } from "@/src/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { mapSteadfastStatusToOrderStatus } from "@/src/lib/fulfillment/steadfast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Health check & Steadfast webhook verification ping
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Steadfast Courier Webhook Receiver",
    provider: "STEADFAST",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST: Incoming Steadfast webhook notifications
 * Triggered automatically when parcel status changes (e.g. delivered, cancelled, in_transit)
 */
export async function POST(request: Request) {
  try {
    let body: Record<string, unknown> = {};

    // Optional Bearer token check (if STEADFAST_WEBHOOK_TOKEN or STEADFAST_SECRET_KEY is configured as webhook secret)
    const expectedToken = process.env.STEADFAST_WEBHOOK_TOKEN;
    const authHeader = request.headers.get("authorization") || "";
    if (expectedToken && expectedToken.trim()) {
      const cleanToken = expectedToken.trim();
      const cleanAuth = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (cleanAuth !== cleanToken) {
        return NextResponse.json({ success: false, error: "Unauthorized: invalid bearer token" }, { status: 401 });
      }
    }

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => new FormData());
      const parsed: Record<string, unknown> = {};
      formData.forEach((val, key) => {
        parsed[key] = val;
      });
      body = parsed;
    } else {
      // Fallback try JSON
      body = await request.json().catch(() => ({}));
    }

    // Extract potential fields from various payload variations
    const consignmentIdRaw = body.consignment_id ?? body.consignmentId ?? body.id;
    const trackingCodeRaw = body.tracking_code ?? body.trackingCode;
    const invoiceRaw = body.invoice ?? body.invoice_id ?? body.order_id ?? body.publicId;
    const rawStatusRaw = body.status ?? body.order_status;
    const noteRaw = body.note ?? body.comment ?? body.message;

    const consignmentId = consignmentIdRaw !== undefined && consignmentIdRaw !== null ? String(consignmentIdRaw).trim() : "";
    const trackingCode = trackingCodeRaw !== undefined && trackingCodeRaw !== null ? String(trackingCodeRaw).trim() : "";
    const invoice = invoiceRaw !== undefined && invoiceRaw !== null ? String(invoiceRaw).trim().toUpperCase() : "";
    const rawStatus = rawStatusRaw !== undefined && rawStatusRaw !== null ? String(rawStatusRaw).trim() : "";
    const note = noteRaw ? String(noteRaw).trim() : "";

    if (!consignmentId && !trackingCode && !invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "No consignment_id, tracking_code, or invoice found in payload",
        },
        { status: 400 }
      );
    }

    if (!rawStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "No status found in payload",
        },
        { status: 400 }
      );
    }

    const database = getDatabase();

    // 1. Locate fulfillment shipment
    let shipment: typeof fulfillmentShipments.$inferSelect | null = null;
    if (consignmentId || trackingCode) {
      const conditions = [];
      if (consignmentId) conditions.push(eq(fulfillmentShipments.consignmentId, consignmentId));
      if (trackingCode) conditions.push(eq(fulfillmentShipments.trackingCode, trackingCode));

      const [foundShipment] = await database
        .select()
        .from(fulfillmentShipments)
        .where(or(...conditions))
        .limit(1);

      if (foundShipment) {
        shipment = foundShipment;
      }
    }

    // 2. Locate order
    let order: typeof orders.$inferSelect | null = null;
    if (shipment) {
      const [foundOrder] = await database
        .select()
        .from(orders)
        .where(eq(orders.id, shipment.orderId))
        .limit(1);
      order = foundOrder || null;
    } else if (invoice) {
      const [foundOrder] = await database
        .select()
        .from(orders)
        .where(eq(orders.publicId, invoice))
        .limit(1);
      order = foundOrder || null;
    }

    if (!order) {
      // Order not found in database: return 200 so Steadfast doesn't retry as a failure
      return NextResponse.json({
        success: true,
        message: "Webhook received but order not found in database",
        received: { consignmentId, trackingCode, invoice, rawStatus },
      });
    }

    const now = new Date();

    // 3. Update fulfillment shipment record if it exists
    if (shipment) {
      await database
        .update(fulfillmentShipments)
        .set({
          providerStatus: rawStatus,
          providerResponse: body,
          updatedAt: now,
        })
        .where(eq(fulfillmentShipments.id, shipment.id));
    }

    // 4. Map Steadfast status to store OrderStatus
    const { targetOrderStatus, shouldMarkPaid } = mapSteadfastStatusToOrderStatus(rawStatus, order.status);

    let updatedStatus = order.status;
    if (targetOrderStatus && targetOrderStatus !== order.status) {
      const updateData: Record<string, unknown> = {
        status: targetOrderStatus,
        updatedAt: now,
      };

      if (shouldMarkPaid && order.paymentMethod === "COD") {
        updateData.paymentStatus = "PAID";
      }

      await database
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, order.id));

      // Insert status history entry
      await database.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: targetOrderStatus,
        note: `Steadfast Webhook: status changed to "${rawStatus}"` + (note ? ` - ${note}` : ""),
        changedByAdminEmail: "steadfast-webhook@system",
        createdAt: now,
      });

      updatedStatus = targetOrderStatus;
    }

    return NextResponse.json({
      success: true,
      message: "Steadfast webhook processed successfully",
      orderPublicId: order.publicId,
      previousStatus: order.status,
      currentStatus: updatedStatus,
      providerStatus: rawStatus,
    });
  } catch (error) {
    console.error("[Steadfast Webhook Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal webhook processing error",
      },
      { status: 500 }
    );
  }
}
