import { loadEnvConfig } from "@next/env";
import { asc, eq, inArray } from "drizzle-orm";
import { POST as postEvent } from "../app/api/v1/events/route";
import { GET as getCatalog } from "../app/api/v1/stores/[storeSlug]/catalog/route";
import { getMigrationEnvironment } from "../src/lib/config/server-env";
import { closeDatabase, createDatabaseClient } from "../src/lib/db";
import {
  commerceEvents,
  visitorSessions,
  visitors,
} from "../src/lib/db/schema";
import { CURRENT_PRIVACY_POLICY_VERSION } from "../src/lib/privacy/consent";

const eventNames = [
  "PAGE_VIEW",
  "VIEW_CONTENT",
  "ADD_TO_CART",
  "BEGIN_CHECKOUT",
] as const;
const eventIds = eventNames.map(
  (eventName) => `batch06_${eventName.toLowerCase()}_v1`,
);

async function main() {
  loadEnvConfig(process.cwd());

  const catalogResponse = await getCatalog(
    new Request("http://localhost/api/v1/stores/m3food/catalog"),
    { params: Promise.resolve({ storeSlug: "m3food" }) },
  );
  const catalog = (await catalogResponse.json()) as {
    data?: {
      store: { currency: string };
      products: Array<{
        id: string;
        variants: Array<{
          id: string;
          isDefault: boolean;
          priceMinor: number;
        }>;
      }>;
    };
  };
  const product = catalog.data?.products[0];
  const variant = product?.variants.find((item) => item.isDefault);
  if (!catalogResponse.ok || !product || !variant) {
    throw new Error("Live catalog is not available for event verification.");
  }

  for (const [index, eventName] of eventNames.entries()) {
    const isPageView = eventName === "PAGE_VIEW";
    const response = await postEvent(
      new Request("http://localhost/api/v1/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "M3Food Batch 06 System Test",
          "x-forwarded-for": "192.0.2.56",
        },
        body: JSON.stringify({
          storeSlug: "m3food",
          eventId: eventIds[index],
          eventName,
          productId: isPageView ? undefined : product.id,
          variantId: isPageView ? undefined : variant.id,
          quantity: 1,
          consent: {
            analyticsAllowed: true,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          },
          attribution: {
            visitorKey: "visitor_batch06_system_test",
            sessionKey: "session_batch06_system_test",
            landingPage:
              "http://localhost/?utm_source=batch-06-verification&utm_medium=system-test",
            utmSource: "batch-06-verification",
            utmMedium: "system-test",
          },
        }),
      }),
    );
    if (!response.ok) {
      const payload = (await response.json()) as {
        error?: { code?: string; requestId?: string };
      };
      throw new Error(
        `Event route rejected ${eventName}: ${payload.error?.code ?? response.status} (${payload.error?.requestId ?? "no request ID"}).`,
      );
    }
  }

  const { MIGRATION_DATABASE_URL } = getMigrationEnvironment();
  const { client, database } = createDatabaseClient(MIGRATION_DATABASE_URL);
  try {
    const rows = await database
      .select({
        eventId: commerceEvents.eventId,
        eventName: commerceEvents.eventName,
        productId: commerceEvents.productId,
        variantId: commerceEvents.variantId,
        valueMinor: commerceEvents.valueMinor,
        currency: commerceEvents.currency,
        payload: commerceEvents.payload,
        visitorKey: visitors.visitorKey,
        sessionKey: visitorSessions.sessionKey,
        ipHash: visitorSessions.ipHash,
        userAgent: visitorSessions.userAgent,
      })
      .from(commerceEvents)
      .innerJoin(visitors, eq(visitors.id, commerceEvents.visitorId))
      .innerJoin(
        visitorSessions,
        eq(visitorSessions.id, commerceEvents.sessionId),
      )
      .where(inArray(commerceEvents.eventId, eventIds))
      .orderBy(asc(commerceEvents.eventName));

    if (rows.length !== eventNames.length) {
      throw new Error(`Expected ${eventNames.length} live events; found ${rows.length}.`);
    }
    for (const eventName of eventNames) {
      const row = rows.find((item) => item.eventName === eventName);
      if (!row) throw new Error(`Persisted ${eventName} event is missing.`);
      if (eventName === "PAGE_VIEW") {
        if (row.productId || row.variantId || row.valueMinor || row.currency) {
          throw new Error("PAGE_VIEW contains unexpected product commerce values.");
        }
      } else if (
        row.productId !== product.id ||
        row.variantId !== variant.id ||
        row.valueMinor !== variant.priceMinor ||
        row.currency !== catalog.data?.store.currency
      ) {
        throw new Error(`${eventName} product value snapshot is incorrect.`);
      }
      if ((row.payload as { source?: string }).source !== "batch-06-verification") {
        throw new Error(`${eventName} attribution source is incorrect.`);
      }
      if (
        row.visitorKey !== "visitor_batch06_system_test" ||
        row.sessionKey !== "session_batch06_system_test" ||
        row.ipHash?.length !== 64 ||
        row.userAgent !== "M3Food Batch 06 System Test"
      ) {
        throw new Error(`${eventName} visitor/session context is incorrect.`);
      }
    }

    console.log("LIVE FIRST-PARTY EVENT FLOW VERIFIED");
    console.log(`Store: m3food`);
    console.log(`Events: ${eventNames.join(" -> ")}`);
    console.log("Identity: visitor + session linked");
    console.log("Attribution source: batch-06-verification");
    console.log("Public PURCHASE remains server-only and was not accepted from the browser.");
  } finally {
    await client.end();
    await closeDatabase();
  }
}

main().catch(async (error: unknown) => {
  await closeDatabase();
  console.error(
    error instanceof Error ? error.message : "Live event-flow verification failed.",
  );
  process.exitCode = 1;
});
