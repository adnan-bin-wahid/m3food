import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) throw new Error("Database URL missing.");

const sql = postgres(url, { max: 1, prepare: false });

async function main() {
  const columns = await sql<{
    column_name: string;
    is_nullable: "YES" | "NO";
    column_default: string | null;
  }[]>`
    select column_name, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name in (
        'fulfillment_cost_minor',
        'fulfillment_cost_revision'
      )
    order by column_name
  `;

  if (columns.length !== 2) {
    throw new Error(
      `Expected 2 order cost columns, found ${columns.length}.`,
    );
  }

  const costColumn = columns.find(
    (column) => column.column_name === "fulfillment_cost_minor",
  );
  const revisionColumn = columns.find(
    (column) => column.column_name === "fulfillment_cost_revision",
  );

  if (!costColumn || costColumn.is_nullable !== "YES") {
    throw new Error("fulfillment_cost_minor must remain nullable.");
  }

  if (
    !revisionColumn ||
    revisionColumn.is_nullable !== "NO"
  ) {
    throw new Error(
      "fulfillment_cost_revision must be non-null.",
    );
  }

  const [table] = await sql<{
    relrowsecurity: boolean;
  }[]>`
    select c.relrowsecurity
    from pg_class c
    inner join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'order_cost_history'
    limit 1
  `;

  if (!table?.relrowsecurity) {
    throw new Error("order_cost_history RLS is not enabled.");
  }

  const constraints = await sql<{ conname: string }[]>`
    select c.conname
    from pg_constraint c
    inner join pg_class t on t.oid = c.conrelid
    inner join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and c.conname in (
        'orders_fulfillment_cost_nonnegative',
        'orders_fulfillment_cost_revision_nonnegative',
        'order_cost_history_before_nonnegative',
        'order_cost_history_after_nonnegative'
      )
    order by c.conname
  `;

  if (constraints.length !== 4) {
    throw new Error(
      `Expected 4 order-cost constraints, found ${constraints.length}.`,
    );
  }

  const [state] = await sql<{
    total: number;
    configured: number;
    nonzeroRevision: number;
  }[]>`
    select
      count(*)::int as total,
      count(*) filter (
        where fulfillment_cost_minor is not null
      )::int as configured,
      count(*) filter (
        where fulfillment_cost_revision <> 0
      )::int as "nonzeroRevision"
    from orders
  `;

  const [history] = await sql<{ total: number }[]>`
    select count(*)::int as total
    from order_cost_history
  `;

  console.log("Nullable fulfillment cost: PASS");
  console.log("Non-null optimistic cost revision: PASS");
  console.log("Order cost history RLS: PASS");
  console.log("Order cost integrity constraints: PASS");
  console.log(
    "Orders with configured fulfillment cost:",
    `${state?.configured ?? 0}/${state?.total ?? 0}`,
  );
  console.log(
    "Orders with nonzero cost revision:",
    state?.nonzeroRevision ?? 0,
  );
  console.log(
    "Order cost audit rows:",
    history?.total ?? 0,
  );
  console.log("");
  console.log("PART Q BATCH 02 LIVE SCHEMA VERIFIED");
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
