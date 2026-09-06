import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import {
  addAdminCustomerNote,
  addAdminCustomerTag,
  getAdminCustomer,
  getAdminMarketingAudience,
  listAdminCustomers,
  parseAdminCustomerQuery,
  removeAdminCustomerTag,
} from "../src/lib/admin/customer-admin-service";
import type { AdminIdentity } from "../src/lib/auth/admin-repository";
import { DrizzleAdminCustomerRepository } from "../src/lib/db/admin-customer-repository";
import { closeDatabase, getDatabase } from "../src/lib/db/index";
import { customers, orderConsents, orders, stores } from "../src/lib/db/schema";


async function main() {
  loadEnvConfig(process.cwd());
const database = getDatabase();
const repository = new DrizzleAdminCustomerRepository(database);
let temporaryCustomerId: string | null = null;
const temporaryOrderIds: string[] = [];

try {
  const storeRows = await database
    .select({ id: stores.id, slug: stores.slug })
    .from(stores)
    .where(eq(stores.slug, "m3food"))
    .limit(1);
  const store = storeRows[0];
  if (!store) throw new Error("M3Food store is missing.");

  const rls = await database.execute(sql<{ tableName: string; enabled: boolean }>`
    select c.relname as "tableName", c.relrowsecurity as enabled
    from pg_catalog.pg_class c
    inner join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('customer_notes', 'customer_tags', 'customer_activity_history')
  `);
  const rlsMap = new Map(rls.map((row) => [row.tableName, row.enabled]));
  for (const table of ["customer_notes", "customer_tags", "customer_activity_history"]) {
    if (rlsMap.get(table) !== true) throw new Error(`${table} does not have RLS enabled.`);
  }

  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const email = `verify-${suffix}@example.invalid`;
  const phone = `verify-${suffix}`;
  const inserted = await database
    .insert(customers)
    .values({ storeId: store.id, name: "Part G CRM Verify", phone, email })
    .returning({ id: customers.id });
  temporaryCustomerId = inserted[0]?.id ?? null;
  if (!temporaryCustomerId) throw new Error("Temporary customer could not be created.");

  const identity: AdminIdentity = {
    id: randomUUID(),
    storeId: store.id,
    storeSlug: store.slug,
    email: "part-g-verify@example.invalid",
    displayName: "Part G Verify",
    role: "OWNER",
  };

  await addAdminCustomerTag(identity, { customerId: temporaryCustomerId, tag: " Verification " }, repository);
  await addAdminCustomerNote(identity, { customerId: temporaryCustomerId, note: "Temporary Part G verification note." }, repository);

  const firstOrder = await database
    .insert(orders)
    .values({
      publicId: `PG-${suffix}-A`.toUpperCase(),
      storeId: store.id,
      customerId: temporaryCustomerId,
      status: "DELIVERED",
      subtotalMinor: 500_000,
      discountMinor: 0,
      shippingMinor: 0,
      totalMinor: 500_000,
      customerName: "Part G CRM Verify",
      customerPhone: phone,
      customerEmail: email,
      addressLine1: "Verification only",
      district: "Dhaka",
      idempotencyKey: `part-g-${suffix}-a`,
      requestHash: "a".repeat(64),
    })
    .returning({ id: orders.id });
  if (!firstOrder[0]) throw new Error("Temporary order could not be created.");
  temporaryOrderIds.push(firstOrder[0].id);
  await database.insert(orderConsents).values({
    storeId: store.id,
    orderId: firstOrder[0].id,
    privacyPolicyVersion: "part-g-verify",
    emailMarketingAllowed: true,
    smsMarketingAllowed: false,
    whatsappMarketingAllowed: false,
    capturedAt: new Date("2026-09-07T00:00:00Z"),
  });

  const firstAudience = await getAdminMarketingAudience(identity, "EMAIL", repository);
  if (!firstAudience.some((row) => row.customerId === temporaryCustomerId)) {
    throw new Error("Explicit latest Email consent did not include the customer.");
  }

  const secondOrder = await database
    .insert(orders)
    .values({
      publicId: `PG-${suffix}-B`.toUpperCase(),
      storeId: store.id,
      customerId: temporaryCustomerId,
      status: "PENDING",
      subtotalMinor: 0,
      discountMinor: 0,
      shippingMinor: 0,
      totalMinor: 0,
      customerName: "Part G CRM Verify",
      customerPhone: phone,
      customerEmail: email,
      addressLine1: "Verification only",
      district: "Dhaka",
      idempotencyKey: `part-g-${suffix}-b`,
      requestHash: "b".repeat(64),
    })
    .returning({ id: orders.id });
  if (!secondOrder[0]) throw new Error("Second temporary order could not be created.");
  temporaryOrderIds.push(secondOrder[0].id);
  await database.insert(orderConsents).values({
    storeId: store.id,
    orderId: secondOrder[0].id,
    privacyPolicyVersion: "part-g-verify",
    emailMarketingAllowed: false,
    smsMarketingAllowed: false,
    whatsappMarketingAllowed: false,
    capturedAt: new Date("2026-09-07T00:01:00Z"),
  });

  const detail = await getAdminCustomer(identity, temporaryCustomerId, repository);
  if (!detail) throw new Error("Store-scoped customer detail did not resolve.");
  if (!detail.tags.includes("verification")) throw new Error("CRM tag did not persist.");
  if (detail.notes[0]?.note !== "Temporary Part G verification note.") throw new Error("CRM note did not persist.");
  if (detail.activity.length < 2) throw new Error("CRM activity history was not recorded.");
  if (detail.orderCount !== 2 || detail.deliveredOrderCount !== 1 || detail.deliveredRevenueMinor !== 500_000) {
    throw new Error("Customer lifetime metrics are not derived from live orders correctly.");
  }
  if (detail.consent.emailMarketingAllowed) {
    throw new Error("A later Email decline did not supersede an older allow.");
  }

  const secondAudience = await getAdminMarketingAudience(identity, "EMAIL", repository);
  if (secondAudience.some((row) => row.customerId === temporaryCustomerId)) {
    throw new Error("Latest Email decline was ignored by the marketing audience.");
  }

  const list = await listAdminCustomers(
    identity,
    parseAdminCustomerQuery({ q: "Part G CRM Verify", segment: "REPEAT" }),
    repository,
  );
  if (list.customers.length !== 1 || list.customers[0]?.id !== temporaryCustomerId) {
    throw new Error("Customer search/segment filtering is not store scoped or deterministic.");
  }

  const otherStoreIdentity: AdminIdentity = { ...identity, storeId: randomUUID(), storeSlug: "other" };
  const crossStore = await getAdminCustomer(otherStoreIdentity, temporaryCustomerId, repository);
  if (crossStore !== null) throw new Error("Cross-store customer detail leaked.");

  await removeAdminCustomerTag(identity, { customerId: temporaryCustomerId, tag: "verification" }, repository);
  const afterRemoval = await getAdminCustomer(identity, temporaryCustomerId, repository);
  if (!afterRemoval || afterRemoval.tags.includes("verification")) throw new Error("Customer tag removal failed.");
  if (!afterRemoval.activity.some((entry) => entry.action === "TAG_REMOVED")) {
    throw new Error("Tag removal audit was not recorded.");
  }

  console.log("LIVE ADMIN CUSTOMER CRM VERIFIED");
  console.log(`Store: ${store.slug}`);
  console.log("RLS-protected CRM tables: verified");
  console.log("Store-scoped customer search/detail and lifetime metrics: verified");
  console.log("Tags, append-only notes, and immutable CRM activity: verified");
  console.log("Latest-consent allow/decline audience behaviour: verified");
  console.log("Cross-store customer isolation: verified");
} finally {
  if (temporaryOrderIds.length) {
    await database.delete(orders).where(inArray(orders.id, temporaryOrderIds));
  }
  if (temporaryCustomerId) {
    await database.delete(customers).where(eq(customers.id, temporaryCustomerId));
  }
  await closeDatabase();
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
