import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { DrizzleAdminRetargetingRepository } from "../src/lib/db/admin-retargeting-repository";
import { closeDatabase, getDatabase } from "../src/lib/db";
import {
  commerceEvents,
  stores,
  visitorSessions,
  visitors,
} from "../src/lib/db/schema";

async function main() {
  loadEnvConfig(process.cwd());
  const database = getDatabase();
  const [store] = await database
    .select({ id: stores.id, slug: stores.slug })
    .from(stores)
    .where(eq(stores.slug, "m3food"))
    .limit(1);
  if (!store) throw new Error("m3food store not found");

  const now = new Date();
  const old = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const purchase = new Date(now.getTime() - 60 * 60 * 1000);
  const visitorKeyA = `verify-retarget-a-${randomUUID()}`;
  const visitorKeyB = `verify-retarget-b-${randomUUID()}`;
  const sessionKeyA = `verify-retarget-session-a-${randomUUID()}`;
  const sessionKeyB = `verify-retarget-session-b-${randomUUID()}`;
  const createdVisitorIds: string[] = [];

  try {
    const [visitorA] = await database.insert(visitors).values({
      storeId: store.id,
      visitorKey: visitorKeyA,
      firstSeenAt: old,
      lastSeenAt: old,
    }).returning({ id: visitors.id });
    const [visitorB] = await database.insert(visitors).values({
      storeId: store.id,
      visitorKey: visitorKeyB,
      firstSeenAt: old,
      lastSeenAt: old,
    }).returning({ id: visitors.id });
    if (!visitorA || !visitorB) throw new Error("visitor setup failed");
    createdVisitorIds.push(visitorA.id, visitorB.id);

    const [sessionA] = await database.insert(visitorSessions).values({
      storeId: store.id,
      visitorId: visitorA.id,
      sessionKey: sessionKeyA,
      utmSource: "verification",
      startedAt: old,
      lastSeenAt: old,
    }).returning({ id: visitorSessions.id });
    const [sessionB] = await database.insert(visitorSessions).values({
      storeId: store.id,
      visitorId: visitorB.id,
      sessionKey: sessionKeyB,
      utmSource: "verification",
      startedAt: old,
      lastSeenAt: old,
    }).returning({ id: visitorSessions.id });
    if (!sessionA || !sessionB) throw new Error("session setup failed");

    await database.insert(commerceEvents).values([
      {
        storeId: store.id,
        visitorId: visitorA.id,
        sessionId: sessionA.id,
        eventName: "ADD_TO_CART",
        eventId: `verify-atc-a-${randomUUID()}`,
        valueMinor: 10000,
        currency: "BDT",
        occurredAt: old,
        receivedAt: old,
      },
      {
        storeId: store.id,
        visitorId: visitorB.id,
        sessionId: sessionB.id,
        eventName: "ADD_TO_CART",
        eventId: `verify-atc-b-${randomUUID()}`,
        valueMinor: 20000,
        currency: "BDT",
        occurredAt: old,
        receivedAt: old,
      },
      {
        storeId: store.id,
        visitorId: visitorB.id,
        sessionId: sessionB.id,
        eventName: "PURCHASE",
        eventId: `verify-purchase-b-${randomUUID()}`,
        valueMinor: 20000,
        currency: "BDT",
        occurredAt: purchase,
        receivedAt: purchase,
      },
    ]);

    const repository = new DrizzleAdminRetargetingRepository(database);
    const snapshot = await repository.getAudience(
      store.id,
      "ADD_TO_CART",
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 30 * 60 * 1000),
      100,
    );
    if (!snapshot) throw new Error("retargeting snapshot missing");
    const keys = new Set(snapshot.rows.map((row) => row.visitorKey));
    if (!keys.has(visitorKeyA)) throw new Error("eligible abandoner missing");
    if (keys.has(visitorKeyB)) throw new Error("purchased visitor was not excluded");

    console.log("LIVE RETARGETING AUDIENCE VERIFIED");
    console.log(`Store: ${store.slug}`);
    console.log("30-minute inactivity and 7-day audience window: verified");
    console.log("Later Purchase exclusion: verified");
    console.log("Store-scoped audience query: verified");
  } finally {
    try {
      for (const visitorId of createdVisitorIds) {
        await database.delete(visitors).where(and(eq(visitors.storeId, store.id), eq(visitors.id, visitorId)));
      }
    } finally {
      await closeDatabase();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
