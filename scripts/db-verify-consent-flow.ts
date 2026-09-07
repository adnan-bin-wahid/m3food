import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { POST as postOrder } from "../app/api/v1/orders/route";
import { GET as getCatalog } from "../app/api/v1/stores/[storeSlug]/catalog/route";
import { getMigrationEnvironment } from "../src/lib/config/server-env";
import { closeDatabase, createDatabaseClient } from "../src/lib/db";
import { orderConsents, orders, stores } from "../src/lib/db/schema";
import { CURRENT_PRIVACY_POLICY_VERSION } from "../src/lib/privacy/consent";

const idempotencyKey = "batch07_live_consent_flow_v1";

async function main() {
  loadEnvConfig(process.cwd());

  const catalogResponse = await getCatalog(
    new Request("http://localhost/api/v1/stores/m3food/catalog"),
    { params: Promise.resolve({ storeSlug: "m3food" }) },
  );
  const catalog = (await catalogResponse.json()) as {
    data?: {
      products: Array<{
        variants: Array<{ id: string; isDefault: boolean }>;
      }>;
    };
  };
  const variants = catalog.data?.products.flatMap((product) => product.variants);
  const variant = variants?.find((item) => item.isDefault) ?? variants?.[0];
  if (!catalogResponse.ok || !variant) {
    throw new Error("Live catalog is not available for consent verification.");
  }

  const response = await postOrder(
    new Request("http://localhost/api/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
        "x-forwarded-for": "192.0.2.57",
      },
      body: JSON.stringify({
        storeSlug: "m3food",
        variantId: variant.id,
        quantity: 1,
        customer: {
          name: "M3Food Consent Test",
          phone: "+8801000000001",
          email: "consent-test@example.invalid",
        },
        shippingAddress: {
          addressLine1: "Automated consent verification only",
          district: "Khulna",
        },
        note: "Batch 07 synthetic consent order - safe to delete after inspection",
        consent: {
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          analyticsAllowed: true,
          emailMarketingAllowed: false,
          smsMarketingAllowed: true,
          whatsappMarketingAllowed: true,
        },
        attribution: {
          visitorKey: "visitor_batch07_consent_test",
          sessionKey: "session_batch07_consent_test",
          landingPage:
            "http://localhost/?utm_source=batch-07-verification&utm_medium=system-test",
          utmSource: "batch-07-verification",
          utmMedium: "system-test",
        },
      }),
    }),
  );
  const payload = (await response.json()) as {
    data?: { publicId: string; created: boolean };
    error?: { code?: string; requestId?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(
      `Consent order was rejected: ${payload.error?.code ?? response.status} (${payload.error?.requestId ?? "no request ID"}).`,
    );
  }

  const { MIGRATION_DATABASE_URL } = getMigrationEnvironment();
  const { client, database } = createDatabaseClient(MIGRATION_DATABASE_URL);
  try {
    const [row] = await database
      .select({
        publicId: orders.publicId,
        policyVersion: orderConsents.privacyPolicyVersion,
        analyticsAllowed: orderConsents.analyticsAllowed,
        emailAllowed: orderConsents.emailMarketingAllowed,
        smsAllowed: orderConsents.smsMarketingAllowed,
        whatsappAllowed: orderConsents.whatsappMarketingAllowed,
        capturedAt: orderConsents.capturedAt,
        orderCreatedAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(stores, eq(stores.id, orders.storeId))
      .innerJoin(orderConsents, eq(orderConsents.orderId, orders.id))
      .where(
        and(
          eq(stores.slug, "m3food"),
          eq(orders.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (!row || row.publicId !== payload.data.publicId) {
      throw new Error("The persisted consent order could not be reloaded.");
    }
    if (
      row.policyVersion !== CURRENT_PRIVACY_POLICY_VERSION ||
      row.analyticsAllowed !== true ||
      row.emailAllowed !== false ||
      row.smsAllowed !== true ||
      row.whatsappAllowed !== true ||
      row.capturedAt.getTime() !== row.orderCreatedAt.getTime()
    ) {
      throw new Error("The persisted order consent snapshot is incorrect.");
    }

    console.log("LIVE ORDER CONSENT FLOW VERIFIED");
    console.log(`Public order: ${row.publicId}`);
    console.log(`Result: ${payload.data.created ? "created" : "idempotently reused"}`);
    console.log(`Privacy policy: ${row.policyVersion}`);
    console.log("Analytics: allowed");
    console.log("Email marketing: declined");
    console.log("SMS + WhatsApp marketing: allowed");
  } finally {
    await client.end();
    await closeDatabase();
  }
}

main().catch(async (error: unknown) => {
  await closeDatabase();
  console.error(
    error instanceof Error ? error.message : "Live consent-flow verification failed.",
  );
  process.exitCode = 1;
});
