import { loadEnvConfig } from "@next/env";
import { and, count, eq } from "drizzle-orm";
import { GET as getCatalog } from "../app/api/v1/stores/[storeSlug]/catalog/route";
import { POST as postOrder } from "../app/api/v1/orders/route";
import { getMigrationEnvironment } from "../src/lib/config/server-env";
import { closeDatabase, createDatabaseClient } from "../src/lib/db";
import {
  commerceEvents,
  orderAttributions,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
  stores,
} from "../src/lib/db/schema";

// Version 2 adds the mandatory consent snapshot introduced in Batch 07.
const idempotencyKey = "batch05_live_order_flow_v2";

async function rowCount(
  database: ReturnType<typeof createDatabaseClient>["database"],
  table:
    | typeof orderItems
    | typeof orderStatusHistory
    | typeof payments
    | typeof orderAttributions
    | typeof commerceEvents,
  orderId: string,
) {
  const orderColumn =
    table === orderItems
      ? orderItems.orderId
      : table === orderStatusHistory
        ? orderStatusHistory.orderId
        : table === payments
          ? payments.orderId
          : table === orderAttributions
            ? orderAttributions.orderId
            : commerceEvents.orderId;
  const [result] = await database
    .select({ value: count() })
    .from(table)
    .where(eq(orderColumn, orderId));
  return result?.value ?? 0;
}

async function main() {
  loadEnvConfig(process.cwd());

  const catalogResponse = await getCatalog(
    new Request("http://localhost/api/v1/stores/m3food/catalog"),
    { params: Promise.resolve({ storeSlug: "m3food" }) },
  );
  const catalogPayload = (await catalogResponse.json()) as {
    data?: {
      products: Array<{
        variants: Array<{ id: string; isDefault: boolean }>;
      }>;
    };
    error?: { code: string };
  };
  if (!catalogResponse.ok || !catalogPayload.data) {
    throw new Error(
      `Catalog route verification failed: ${catalogPayload.error?.code ?? catalogResponse.status}.`,
    );
  }

  const variants = catalogPayload.data.products.flatMap(
    (product) => product.variants,
  );
  const variant = variants.find((item) => item.isDefault) ?? variants[0];
  if (!variant) throw new Error("Catalog route returned no purchasable variant.");

  const orderResponse = await postOrder(
    new Request("http://localhost/api/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
        "x-forwarded-for": "192.0.2.55",
      },
      body: JSON.stringify({
        storeSlug: "m3food",
        variantId: variant.id,
        quantity: 1,
        customer: {
          name: "M3Food System Test",
          phone: "+8801000000000",
          email: "system-test@example.invalid",
        },
        shippingAddress: {
          addressLine1: "Automated verification only",
          district: "Khulna",
        },
        note: "Batch 05 synthetic order - safe to delete after visual inspection",
        consent: {
          privacyPolicyVersion: "2026-09-04",
          analyticsAllowed: false,
          emailMarketingAllowed: false,
          smsMarketingAllowed: false,
          whatsappMarketingAllowed: false,
        },
        attribution: {
          visitorKey: "visitor_batch05_system_test",
          sessionKey: "session_batch05_system_test",
          landingPage:
            "http://localhost/?utm_source=batch-05-verification&utm_medium=system-test",
          utmSource: "batch-05-verification",
          utmMedium: "system-test",
        },
      }),
    }),
  );
  const orderPayload = (await orderResponse.json()) as {
    data?: { publicId: string; totalMinor: number; created: boolean };
    error?: { code: string; requestId: string };
  };
  if (!orderResponse.ok || !orderPayload.data) {
    throw new Error(
      `Order route verification failed: ${orderPayload.error?.code ?? orderResponse.status} (${orderPayload.error?.requestId ?? "no request ID"}).`,
    );
  }

  const { MIGRATION_DATABASE_URL } = getMigrationEnvironment();
  const { client, database } = createDatabaseClient(MIGRATION_DATABASE_URL);

  try {
    const [order] = await database
      .select({
        id: orders.id,
        publicId: orders.publicId,
        customerId: orders.customerId,
        visitorId: orders.visitorId,
        sessionId: orders.sessionId,
        totalMinor: orders.totalMinor,
      })
      .from(orders)
      .innerJoin(stores, eq(stores.id, orders.storeId))
      .where(
        and(
          eq(stores.slug, "m3food"),
          eq(orders.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (!order || !order.customerId || !order.visitorId || !order.sessionId) {
      throw new Error("The persisted order graph is incomplete.");
    }
    if (
      order.publicId !== orderPayload.data.publicId ||
      order.totalMinor !== orderPayload.data.totalMinor
    ) {
      throw new Error("The API response does not match the persisted order.");
    }

    const counts = {
      items: await rowCount(database, orderItems, order.id),
      statusHistory: await rowCount(database, orderStatusHistory, order.id),
      payments: await rowCount(database, payments, order.id),
      attribution: await rowCount(database, orderAttributions, order.id),
      purchaseEvents: await rowCount(database, commerceEvents, order.id),
    };
    if (Object.values(counts).some((value) => value !== 1)) {
      throw new Error(`Unexpected persisted order graph: ${JSON.stringify(counts)}.`);
    }

    console.log("LIVE LANDING ORDER FLOW VERIFIED");
    console.log(`Public order: ${order.publicId}`);
    console.log(`Result: ${orderPayload.data.created ? "created" : "idempotently reused"}`);
    console.log(`Total minor: ${order.totalMinor}`);
    console.log("Order graph: customer + visitor + session + item + status + payment + attribution + purchase event");
    console.log("Synthetic marker: Batch 05 synthetic order - safe to delete after visual inspection");
  } finally {
    await client.end();
    await closeDatabase();
  }
}

main().catch(async (error: unknown) => {
  await closeDatabase();
  console.error(
    error instanceof Error ? error.message : "Live landing order flow failed.",
  );
  process.exitCode = 1;
});
