import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { DrizzleAdminCustomerRepository } from "../src/lib/db/admin-customer-repository";
import { DrizzleAdminFulfillmentRepository } from "../src/lib/db/admin-fulfillment-repository";
import { DrizzleAdminMarketingAnalyticsRepository } from "../src/lib/db/admin-marketing-analytics-repository";
import { DrizzleAdminOrderRepository } from "../src/lib/db/admin-order-repository";
import { DrizzleCheckoutIntentRepository } from "../src/lib/db/checkout-intent-repository";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { DrizzleMarketingPreferenceRepository } from "../src/lib/db/marketing-preference-repository";
import {
  customers,
  orderAttributions,
  orders,
  products,
  productVariants,
  stores,
  visitorSessions,
  visitors,
} from "../src/lib/db/schema";
import { captureCheckoutIntent } from "../src/lib/commerce/checkout-intent-service";
import { createMarketingPreferenceToken, updateMarketingPreference } from "../src/lib/privacy/preferences";

async function main() {
  loadEnvConfig(process.cwd());
  const database = getDatabase();
  const [store] = await database
    .select({ id: stores.id, slug: stores.slug })
    .from(stores)
    .where(and(eq(stores.slug, "m3food"), eq(stores.status, "ACTIVE")))
    .limit(1);
  if (!store) throw new Error("m3food active store not found");

  const [variant] = await database
    .select({ productId: products.id, variantId: productVariants.id })
    .from(productVariants)
    .innerJoin(products, and(eq(products.id, productVariants.productId), eq(products.storeId, productVariants.storeId)))
    .where(and(eq(productVariants.storeId, store.id), eq(productVariants.isActive, true), eq(products.status, "ACTIVE")))
    .limit(1);
  if (!variant) throw new Error("No active product variant is available for Part J verification.");

  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const recoveryVisitorKey = `pj_recovery_visitor_${suffix}`;
  const recoverySessionKey = `pj_recovery_session_${suffix}`;
  const orderVisitorKey = `pj_order_visitor_${suffix}`;
  const orderSessionKey = `pj_order_session_${suffix}`;
  const publicId = `PJ-${suffix.toUpperCase()}`;
  const phone = `019${suffix.slice(0, 8)}`;
  const email = `part-j-${suffix}@example.test`;
  const now = new Date();
  const recoveryAt = new Date(now.getTime() - 45 * 60 * 1000);
  const createdVisitorIds: string[] = [];
  let createdCustomerId: string | null = null;
  let createdOrderId: string | null = null;

  try {
    const checkoutRepository = new DrizzleCheckoutIntentRepository(database);
    const checkout = await captureCheckoutIntent({
      storeSlug: store.slug,
      intentKey: `intent_${randomUUID()}`,
      productId: variant.productId,
      variantId: variant.variantId,
      quantity: 1,
      contact: { email },
      attribution: {
        visitorKey: recoveryVisitorKey,
        sessionKey: recoverySessionKey,
        landingPage: "https://example.test/part-j",
        utmSource: "part-j-recovery",
        utmMedium: "verification",
        utmCampaign: "part-j-closure",
      },
      consent: {
        privacyPolicyVersion: "2026-09-07.2",
        privacyAcknowledged: true,
        emailMarketingAllowed: true,
        smsMarketingAllowed: false,
        whatsappMarketingAllowed: false,
      },
    }, checkoutRepository, recoveryAt);
    if (checkout.kind !== "OK") throw new Error("Checkout intent capture did not succeed.");

    const [recoveryVisitor] = await database
      .select({ id: visitors.id })
      .from(visitors)
      .where(and(eq(visitors.storeId, store.id), eq(visitors.visitorKey, recoveryVisitorKey)))
      .limit(1);
    if (!recoveryVisitor) throw new Error("Checkout recovery visitor was not persisted.");
    createdVisitorIds.push(recoveryVisitor.id);

    const analyticsRepository = new DrizzleAdminMarketingAnalyticsRepository(database);
    const overview = await analyticsRepository.getOverview(
      store.id,
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      now,
    );
    if (!overview) throw new Error("Marketing overview was not available.");
    if (overview.recoverableCheckoutContacts < 1) throw new Error("Consented 30-minute checkout recovery was not visible in marketing analytics.");
    if (!overview.sources.some((row) => row.source === "part-j-recovery")) throw new Error("Checkout recovery source was not visible in source analytics.");

    const [customer] = await database
      .insert(customers)
      .values({ storeId: store.id, name: "Part J Verify", phone, email, createdAt: now, updatedAt: now })
      .returning({ id: customers.id });
    if (!customer) throw new Error("Synthetic Part J customer creation failed.");
    createdCustomerId = customer.id;

    const preferenceRepository = new DrizzleMarketingPreferenceRepository(database);
    const preferenceToken = createMarketingPreferenceToken(
      { storeId: store.id, customerId: customer.id },
      "part-j-verifier-server-only-preference-secret",
    );
    await updateMarketingPreference(preferenceToken, {
      emailMarketingAllowed: true,
      smsMarketingAllowed: false,
      whatsappMarketingAllowed: false,
      privacyPolicyVersion: "2026-09-07.2",
    }, "part-j-verifier-server-only-preference-secret", preferenceRepository, now);

    const customerRepository = new DrizzleAdminCustomerRepository(database);
    const optedIn = await customerRepository.listMarketingAudience(store.id, "EMAIL");
    if (!optedIn.some((row) => row.customerId === customer.id)) throw new Error("Self-service opt-in did not reach the CRM audience.");
    await updateMarketingPreference(preferenceToken, {
      emailMarketingAllowed: false,
      smsMarketingAllowed: false,
      whatsappMarketingAllowed: false,
      privacyPolicyVersion: "2026-09-07.2",
    }, "part-j-verifier-server-only-preference-secret", preferenceRepository, new Date(now.getTime() + 1000));
    const optedOut = await customerRepository.listMarketingAudience(store.id, "EMAIL");
    if (optedOut.some((row) => row.customerId === customer.id)) throw new Error("Self-service unsubscribe did not remove the customer from the CRM audience.");

    const [orderVisitor] = await database
      .insert(visitors)
      .values({ storeId: store.id, visitorKey: orderVisitorKey, firstSeenAt: now, lastSeenAt: now })
      .returning({ id: visitors.id });
    if (!orderVisitor) throw new Error("Synthetic order visitor creation failed.");
    createdVisitorIds.push(orderVisitor.id);
    const [orderSession] = await database
      .insert(visitorSessions)
      .values({
        storeId: store.id,
        visitorId: orderVisitor.id,
        sessionKey: orderSessionKey,
        landingPage: "https://example.test/offer",
        referrer: "https://facebook.com/",
        utmSource: "facebook",
        utmMedium: "paid_social",
        utmCampaign: "part-j-closure",
        utmContent: "creative-a",
        utmTerm: "chuijhal",
        fbclid: `fbclid-${suffix}`,
        gclid: `gclid-${suffix}`,
        startedAt: now,
        lastSeenAt: now,
      })
      .returning({ id: visitorSessions.id });
    if (!orderSession) throw new Error("Synthetic order session creation failed.");

    const [order] = await database
      .insert(orders)
      .values({
        publicId,
        storeId: store.id,
        customerId: customer.id,
        visitorId: orderVisitor.id,
        sessionId: orderSession.id,
        status: "CONFIRMED",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        currency: "BDT",
        subtotalMinor: 125000,
        discountMinor: 0,
        shippingMinor: 0,
        totalMinor: 125000,
        customerName: "Part J Verify",
        customerPhone: phone,
        customerEmail: email,
        addressLine1: "Part J verification address",
        district: "Khulna",
        idempotencyKey: `part-j-${suffix}`,
        requestHash: "a".repeat(64),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: orders.id });
    if (!order) throw new Error("Synthetic Part J order creation failed.");
    createdOrderId = order.id;

    await database.insert(orderAttributions).values({
      storeId: store.id,
      orderId: order.id,
      visitorId: orderVisitor.id,
      sessionId: orderSession.id,
      source: "facebook",
      medium: "paid_social",
      campaign: "part-j-closure",
      content: "creative-a",
      term: "chuijhal",
      referrer: "https://facebook.com/",
      landingPage: "https://example.test/offer",
      fbclid: `fbclid-${suffix}`,
      gclid: `gclid-${suffix}`,
      createdAt: now,
    });

    const orderDetail = await new DrizzleAdminOrderRepository(database).getOrderDetail(store.id, publicId);
    if (!orderDetail?.attribution) throw new Error("Order attribution detail was not available.");
    if (orderDetail.attribution.content !== "creative-a" || orderDetail.attribution.term !== "chuijhal") throw new Error("Order content/term attribution was not preserved.");
    if (orderDetail.attribution.visitorKey !== orderVisitorKey || orderDetail.attribution.sessionKey !== orderSessionKey) throw new Error("Order visitor/session attribution was not visible.");
    if (!orderDetail.attribution.fbclid || !orderDetail.attribution.gclid) throw new Error("Order click-ID attribution was not visible.");

    const fulfillment = new DrizzleAdminFulfillmentRepository(database);
    const firstClaim = await fulfillment.claimSubmission({ storeId: store.id, orderId: order.id, requestFingerprint: "b".repeat(64), now });
    if (firstClaim !== "ACQUIRED") throw new Error(`Expected first fulfillment claim to be ACQUIRED, received ${firstClaim}.`);
    const concurrentClaim = await fulfillment.claimSubmission({ storeId: store.id, orderId: order.id, requestFingerprint: "b".repeat(64), now: new Date(now.getTime() + 1000) });
    if (concurrentClaim !== "BUSY") throw new Error(`Expected fresh duplicate fulfillment claim to be BUSY, received ${concurrentClaim}.`);
    await fulfillment.markSubmitted({
      storeId: store.id,
      orderId: order.id,
      consignmentId: `CID-${suffix}`,
      trackingCode: `TRACK-${suffix}`,
      providerStatus: "pending",
      providerResponse: { verification: true },
      now: new Date(now.getTime() + 2000),
    });
    const submittedClaim = await fulfillment.claimSubmission({ storeId: store.id, orderId: order.id, requestFingerprint: "b".repeat(64), now: new Date(now.getTime() + 3000) });
    if (submittedClaim !== "SUBMITTED") throw new Error(`Expected submitted fulfillment claim to stay SUBMITTED, received ${submittedClaim}.`);
    const candidate = await fulfillment.getOrderCandidate(store.id, publicId);
    if (candidate?.shipment?.trackingCode !== `TRACK-${suffix}`) throw new Error("Fulfillment tracking code was not persisted.");

    console.log("LIVE PART J / PART C MINIMUM CLOSURE VERIFIED");
    console.log(`Store: ${store.slug}`);
    console.log("30-minute consented checkout recovery + source analytics: verified");
    console.log("Signed marketing preference override + unsubscribe audience exclusion: verified");
    console.log("Full order UTM/click-ID/visitor/session attribution visibility: verified");
    console.log("Steadfast local claim idempotency + tracking persistence: verified");
  } finally {
    try {
      if (createdOrderId) {
        await database.delete(orders).where(and(eq(orders.storeId, store.id), eq(orders.id, createdOrderId)));
      }
      if (createdCustomerId) {
        await database.delete(customers).where(and(eq(customers.storeId, store.id), eq(customers.id, createdCustomerId)));
      }
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
