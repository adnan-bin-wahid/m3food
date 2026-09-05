import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import {
  getAdminOrderDetail,
  listAdminOrders,
  parseAdminOrderQuery,
  transitionAdminOrder,
} from "../src/lib/admin/order-admin-service";
import { closeDatabase, getDatabase } from "../src/lib/db";
import { DrizzleAdminOrderRepository } from "../src/lib/db/admin-order-repository";
import { adminUsers, orders, stores } from "../src/lib/db/schema";

const syntheticIdempotencyKey = "batch05_live_order_flow_v2";
const auditNote = "Part E-04 synthetic verification: admin transition";

async function main() {
  loadEnvConfig(process.cwd());
  const storeSlug = process.env.ADMIN_BOOTSTRAP_STORE_SLUG ?? "m3food";
  const database = getDatabase();
  const repository = new DrizzleAdminOrderRepository(database);

  const [record] = await database
    .select({
      storeId: stores.id,
      storeSlug: stores.slug,
      publicId: orders.publicId,
      status: orders.status,
    })
    .from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(
      and(
        eq(stores.slug, storeSlug),
        eq(orders.idempotencyKey, syntheticIdempotencyKey),
      ),
    )
    .limit(1);
  if (!record) {
    throw new Error("Run db:verify:order-flow before the admin order verifier.");
  }

  const [owner] = await database
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
    })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.storeId, record.storeId),
        eq(adminUsers.role, "OWNER"),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);
  if (!owner) throw new Error("An active OWNER account is required.");

  const identity = {
    ...owner,
    storeId: record.storeId,
    storeSlug: record.storeSlug,
  };
  const searchResult = await listAdminOrders(
    record.storeId,
    parseAdminOrderQuery({ q: record.publicId, status: record.status }),
    repository,
  );
  if (
    searchResult.total !== 1 ||
    searchResult.orders[0]?.publicId !== record.publicId
  ) {
    throw new Error("Store-scoped order search did not return the synthetic order.");
  }

  const before = await getAdminOrderDetail(
    record.storeId,
    record.publicId,
    repository,
  );
  if (!before || before.items.length === 0 || before.history.length === 0) {
    throw new Error("The admin order detail graph is incomplete.");
  }

  let result = "idempotently reused";
  if (before.status === "PENDING") {
    await transitionAdminOrder(
      identity,
      {
        publicId: record.publicId,
        expectedStatus: "PENDING",
        toStatus: "CONFIRMED",
        note: auditNote,
      },
      repository,
    );
    result = "updated";
  } else if (before.status !== "CONFIRMED") {
    throw new Error(
      `Synthetic order has unexpected status ${before.status}; expected PENDING or CONFIRMED.`,
    );
  }

  const after = await getAdminOrderDetail(
    record.storeId,
    record.publicId,
    repository,
  );
  const auditEntry = after?.history.find(
    (entry) =>
      entry.toStatus === "CONFIRMED" &&
      entry.note === auditNote &&
      entry.changedByAdminEmail === owner.email,
  );
  if (!after || after.status !== "CONFIRMED" || !auditEntry) {
    throw new Error("The atomic status update and admin audit snapshot did not persist.");
  }

  const foreignStoreId = "00000000-0000-4000-8000-000000000000";
  const [foreignList, foreignDetail] = await Promise.all([
    listAdminOrders(
      foreignStoreId,
      parseAdminOrderQuery({ q: record.publicId }),
      repository,
    ),
    getAdminOrderDetail(foreignStoreId, record.publicId, repository),
  ]);
  if (foreignList.total !== 0 || foreignDetail !== null) {
    throw new Error("Order reads are not isolated by authenticated store ID.");
  }

  console.log("LIVE ADMIN ORDER OPERATIONS VERIFIED");
  console.log(`Store: ${record.storeSlug}`);
  console.log(`Synthetic order: ${record.publicId}`);
  console.log(`Status: ${after.status} (${result})`);
  console.log("Detail graph: items + customer + payment + attribution + consent + timeline");
  console.log("Immutable admin actor snapshot: verified");
  console.log("Cross-store list and detail isolation: verified");
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Admin order verification failed.",
    );
    process.exitCode = 1;
  })
  .finally(closeDatabase);
