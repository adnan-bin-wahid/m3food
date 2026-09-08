import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) throw new Error("Database URL missing.");

const sql = postgres(url, { max: 1, prepare: false });

async function enumValues(typeName: string) {
  const rows = await sql<{ value: string }[]>`
    select e.enumlabel as value
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = ${typeName}
    order by e.enumsortorder
  `;
  return rows.map((row) => row.value);
}

async function tableExists(tableName: string) {
  const [row] = await sql<{ exists: boolean }[]>`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = ${tableName}
    ) as exists
  `;
  return row?.exists === true;
}

async function main() {
  const paymentMethods = await enumValues("payment_method");
  if (!paymentMethods.includes("ONLINE")) {
    throw new Error("payment_method is missing ONLINE.");
  }

  const providers = await enumValues("payment_provider");
  if (
    providers.length !== 1 ||
    providers[0] !== "SSL_COMMERZ"
  ) {
    throw new Error(
      `Unexpected payment_provider values: ${providers.join(", ")}`,
    );
  }

  const intentStatuses = await enumValues(
    "payment_intent_status",
  );
  for (const status of [
    "CREATED",
    "INITIATING",
    "REQUIRES_ACTION",
    "PROCESSING",
    "SUCCEEDED",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
  ]) {
    if (!intentStatuses.includes(status)) {
      throw new Error(
        `payment_intent_status is missing ${status}.`,
      );
    }
  }

  for (const table of [
    "payment_intents",
    "payment_provider_events",
  ]) {
    if (!(await tableExists(table))) {
      throw new Error(`Missing table: ${table}`);
    }
  }

  const [integrity] = await sql<{
    orphanIntents: number;
    orderPaymentMismatch: number;
    duplicateEventKeys: number;
  }[]>`
    select
      (
        select count(*)::int
        from payment_intents pi
        left join payments p
          on p.id = pi.payment_id
         and p.store_id = pi.store_id
         and p.order_id = pi.order_id
        where p.id is null
      ) as "orphanIntents",
      (
        select count(*)::int
        from payment_intents pi
        join payments p
          on p.id = pi.payment_id
        join orders o
          on o.id = pi.order_id
        where p.method <> 'ONLINE'
           or o.payment_method <> 'ONLINE'
           or p.status <> o.payment_status
      ) as "orderPaymentMismatch",
      (
        select count(*)::int
        from (
          select
            store_id,
            provider,
            event_key,
            count(*)
          from payment_provider_events
          group by store_id, provider, event_key
          having count(*) > 1
        ) duplicates
      ) as "duplicateEventKeys"
  `;

  if ((integrity?.orphanIntents ?? -1) !== 0) {
    throw new Error(
      `Found ${integrity?.orphanIntents ?? -1} orphan payment intents.`,
    );
  }

  if ((integrity?.orderPaymentMismatch ?? -1) !== 0) {
    throw new Error(
      `Found ${integrity?.orderPaymentMismatch ?? -1} payment-intent/order mismatches.`,
    );
  }

  if ((integrity?.duplicateEventKeys ?? -1) !== 0) {
    throw new Error(
      `Found ${integrity?.duplicateEventKeys ?? -1} duplicate provider event keys.`,
    );
  }

  console.log(
    "payment_method ONLINE:",
    paymentMethods.includes("ONLINE") ? "PASS" : "FAIL",
  );
  console.log(
    "payment_provider:",
    providers.join(", "),
  );
  console.log(
    "payment_intents table: PASS",
  );
  console.log(
    "payment_provider_events table: PASS",
  );
  console.log("Orphan payment intents: 0");
  console.log("Intent/order/payment consistency: PASS");
  console.log("Duplicate provider event keys: 0");
  console.log("");
  console.log(
    "PART T BATCH 01 LIVE PAYMENT INTENT FOUNDATION VERIFIED",
  );
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
