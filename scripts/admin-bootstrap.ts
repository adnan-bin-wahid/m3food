import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeAdminEmail } from "../src/lib/auth/admin-auth";
import { hashAdminPassword, verifyAdminPassword } from "../src/lib/auth/password";
import { getMigrationEnvironment } from "../src/lib/config/server-env";
import { createDatabaseClient } from "../src/lib/db";
import { adminUsers, stores } from "../src/lib/db/schema";

const bootstrapSchema = z.object({
  ADMIN_BOOTSTRAP_STORE_SLUG: z.string().trim().min(2).max(120),
  ADMIN_BOOTSTRAP_EMAIL: z.email().max(255),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).max(200),
  ADMIN_BOOTSTRAP_NAME: z.string().trim().min(2).max(160).default("Store Owner"),
});

async function main() {
  loadEnvConfig(process.cwd());
  const input = bootstrapSchema.parse(process.env);
  const email = normalizeAdminEmail(input.ADMIN_BOOTSTRAP_EMAIL);
  const { MIGRATION_DATABASE_URL } = getMigrationEnvironment();
  const { client, database } = createDatabaseClient(MIGRATION_DATABASE_URL);
  try {
    const [store] = await database
      .select({ id: stores.id, slug: stores.slug })
      .from(stores)
      .where(and(eq(stores.slug, input.ADMIN_BOOTSTRAP_STORE_SLUG), eq(stores.status, "ACTIVE")))
      .limit(1);
    if (!store) throw new Error("The active bootstrap store does not exist.");

    const [existing] = await database
      .select({ id: adminUsers.id, passwordHash: adminUsers.passwordHash })
      .from(adminUsers)
      .where(and(eq(adminUsers.storeId, store.id), eq(adminUsers.email, email)))
      .limit(1);

    let created = false;
    let adminId = existing?.id;
    if (existing) {
      const matches = await verifyAdminPassword(
        input.ADMIN_BOOTSTRAP_PASSWORD,
        existing.passwordHash,
      );
      if (!matches) {
        throw new Error(
          "This admin already exists but the supplied password does not match; refusing to reset it implicitly.",
        );
      }
    } else {
      const [admin] = await database
        .insert(adminUsers)
        .values({
          storeId: store.id,
          email,
          displayName: input.ADMIN_BOOTSTRAP_NAME,
          passwordHash: await hashAdminPassword(input.ADMIN_BOOTSTRAP_PASSWORD),
          role: "OWNER",
        })
        .returning({ id: adminUsers.id });
      if (!admin) throw new Error("Admin bootstrap returned no account.");
      adminId = admin.id;
      created = true;
    }

    console.log("ADMIN ACCOUNT BOOTSTRAP VERIFIED");
    console.log(`Store: ${store.slug}`);
    console.log(`Admin: ${email}`);
    console.log(`Role: OWNER`);
    console.log(`Result: ${created ? "created" : "idempotently reused"}`);
    console.log(`Admin ID: ${adminId}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Admin bootstrap failed.");
  process.exitCode = 1;
});
