import { NextResponse } from "next/server";
import { getDatabase } from "../../../../../src/lib/db";
import { orders, orderItems, fulfillmentShipments, stores } from "../../../../../src/lib/db/schema";
import { eq, or, and, desc, ilike, inArray } from "drizzle-orm";
import { DrizzleRateLimiter } from "../../../../../src/lib/db/rate-limiter";
import { getOrderApiEnvironment } from "../../../../../src/lib/config/server-env";
import { getRequestClientKey } from "../../../../../src/lib/http/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length >= 10) {
    return clean.slice(0, 3) + "****" + clean.slice(-4);
  }
  return phone.slice(0, 2) + "***" + phone.slice(-2);
}

export async function POST(request: Request) {
  try {
    const { RATE_LIMIT_SALT } = getOrderApiEnvironment();
    const rateLimiter = new DrizzleRateLimiter(RATE_LIMIT_SALT);
    const clientKey = getRequestClientKey(request);

    // Consume rate limit: 20 searches per minute per IP
    const rateLimit = await rateLimiter.consume({
      scope: "order-tracking:search",
      key: clientKey,
      limit: 20,
      windowMs: 60 * 1000,
      now: new Date(),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "অনেকবার ট্র্যাকিং চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। দয়া করে ১ মিনিট পর আবার চেষ্টা করুন।" },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawQuery = String(body?.query || "").trim();
    if (!rawQuery || rawQuery.length < 4) {
      return NextResponse.json(
        { error: "দয়া করে সঠিক ফোন নম্বর অথবা অর্ডার রেফারেন্স আইডি দিন।" },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const storeSlug = process.env.NEXT_PUBLIC_STORE_SLUG || "niyamah-attires";
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ orders: [] });
    }

    const digitsOnly = rawQuery.replace(/\D/g, "");
    const isPhoneQuery = digitsOnly.length >= 7;
    const isIdQuery = rawQuery.length >= 4;

    const searchConditions = [];

    if (isIdQuery) {
      searchConditions.push(ilike(orders.publicId, `%${rawQuery.toUpperCase()}%`));
    }
    if (isPhoneQuery) {
      const localNumber = digitsOnly.startsWith("88") ? digitsOnly.slice(2) : digitsOnly;
      searchConditions.push(ilike(orders.customerPhone, `%${localNumber}%`));
    }

    const whereClause = searchConditions.length > 1
      ? and(eq(orders.storeId, store.id), or(...searchConditions)!)
      : and(eq(orders.storeId, store.id), searchConditions[0]);

    const matchingOrders = await db
      .select({
        id: orders.id,
        publicId: orders.publicId,
        status: orders.status,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        area: orders.area,
        district: orders.district,
        subtotalMinor: orders.subtotalMinor,
        shippingMinor: orders.shippingMinor,
        totalMinor: orders.totalMinor,
        currency: orders.currency,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    if (!matchingOrders.length) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = matchingOrders.map((o) => o.id);
    const [items, shipments] = await Promise.all([
      db
        .select({
          orderId: orderItems.orderId,
          productName: orderItems.productName,
          variantLabel: orderItems.variantLabel,
          quantity: orderItems.quantity,
          unitPriceMinor: orderItems.unitPriceMinor,
          totalMinor: orderItems.totalMinor,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds)),
      db
        .select({
          orderId: fulfillmentShipments.orderId,
          provider: fulfillmentShipments.provider,
          status: fulfillmentShipments.status,
          consignmentId: fulfillmentShipments.consignmentId,
          trackingCode: fulfillmentShipments.trackingCode,
          providerStatus: fulfillmentShipments.providerStatus,
          submittedAt: fulfillmentShipments.submittedAt,
        })
        .from(fulfillmentShipments)
        .where(inArray(fulfillmentShipments.orderId, orderIds)),
    ]);

    const itemsByOrder = new Map<string, typeof items>();
    items.forEach((item) => {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    });

    const shipmentByOrder = new Map<string, (typeof shipments)[0]>();
    shipments.forEach((s) => {
      shipmentByOrder.set(s.orderId, s);
    });

    const results = matchingOrders.map((order) => {
      const ship = shipmentByOrder.get(order.id);
      return {
        publicId: order.publicId,
        status: order.status,
        customerName: order.customerName,
        maskedPhone: maskPhone(order.customerPhone),
        deliveryArea: [order.area, order.district].filter(Boolean).join(", ") || "বাংলাদেশ",
        subtotalMinor: order.subtotalMinor,
        shippingMinor: order.shippingMinor,
        totalMinor: order.totalMinor,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: (itemsByOrder.get(order.id) || []).map((i) => ({
          name: i.productName,
          variant: i.variantLabel,
          quantity: i.quantity,
          priceMinor: i.totalMinor,
        })),
        shipment: ship
          ? {
              provider: ship.provider || "STEADFAST",
              status: ship.status,
              consignmentId: ship.consignmentId,
              trackingCode: ship.trackingCode,
              providerStatus: ship.providerStatus,
              trackingUrl: ship.trackingCode ? `https://steadfast.com.bd/t/${ship.trackingCode}` : null,
              submittedAt: ship.submittedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ orders: results });
  } catch (err) {
    console.error("Tracking API error:", err);
    return NextResponse.json(
      { error: "অর্ডার ট্র্যাকিং সেবা সাময়িকভাবে অনুপলব্ধ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}
