import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Database URL missing.");

const sql = postgres(url, { max: 1, prepare: false });

async function main() {
  const [revisionColumn] = await sql<{
    is_nullable: "YES" | "NO";
    column_default: string | null;
  }[]>`
    select is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'revision'
    limit 1
  `;

  if (
    !revisionColumn ||
    revisionColumn.is_nullable !== "NO" ||
    revisionColumn.column_default === null
  ) {
    throw new Error("payments.revision must be non-null with a default.");
  }

  const [historyTable] = await sql<{ relrowsecurity: boolean }[]>`
    select c.relrowsecurity
    from pg_class c
    inner join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'payment_status_history'
    limit 1
  `;

  if (!historyTable?.relrowsecurity) {
    throw new Error("payment_status_history RLS is not enabled.");
  }

  const constraints = await sql<{ conname: string }[]>`
    select c.conname
    from pg_constraint c
    inner join pg_class t on t.oid = c.conrelid
    inner join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and c.conname in (
        'payments_revision_nonnegative',
        'payment_status_history_store_id_stores_id_fk',
        'payment_status_history_order_id_orders_id_fk',
        'payment_status_history_payment_id_payments_id_fk'
      )
    order by c.conname
  `;

  if (constraints.length !== 4) {
    throw new Error(`Expected 4 payment-settlement constraints/FKs, found ${constraints.length}.`);
  }

  const [state] = await sql<{
    payments: number;
    nonzeroRevision: number;
    auditRows: number;
  }[]>`
    select
      (select count(*)::int from payments) as payments,
      (select count(*)::int from payments where revision <> 0) as "nonzeroRevision",
      (select count(*)::int from payment_status_history) as "auditRows"
  `;

  const [integrity] = await sql<{
    compared: number;
    mismatched: number;
    ordersWithoutPayment: number;
  }[]>`
    with latest_payment as (
      select distinct on (p.order_id)
        p.order_id,
        p.status
      from payments p
      order by p.order_id, p.created_at desc, p.id desc
    )
    select
      count(*) filter (where lp.order_id is not null)::int as compared,
      count(*) filter (
        where lp.order_id is not null
          and o.payment_status <> lp.status
      )::int as mismatched,
      count(*) filter (where lp.order_id is null)::int as "ordersWithoutPayment"
    from orders o
    left join latest_payment lp on lp.order_id = o.id
  `;

  if ((integrity?.mismatched ?? 0) !== 0) {
    throw new Error(`Found ${integrity?.mismatched ?? 0} order/latest-payment status mismatches.`);
  }

  console.log("payments.revision integrity: PASS");
  console.log("payment_status_history RLS: PASS");
  console.log("Payment settlement constraints/FKs: PASS");
  console.log("Payment rows:", state?.payments ?? 0);
  console.log("Payments with nonzero revision:", state?.nonzeroRevision ?? 0);
  console.log("Payment audit rows:", state?.auditRows ?? 0);
  console.log("Orders compared with latest payment:", integrity?.compared ?? 0);
  console.log("Orders without payment record:", integrity?.ordersWithoutPayment ?? 0);
  console.log("Latest payment/order status consistency: PASS");
  console.log("");
  console.log("PART S BATCH 01 LIVE PAYMENT SETTLEMENT SCHEMA VERIFIED");
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
