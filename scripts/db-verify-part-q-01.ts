import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const databaseUrl =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Database URL missing.");
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

async function main() {
  const columns = await sql<{
    table_name: string;
    column_name: string;
    is_nullable: "YES" | "NO";
  }[]>`
    select table_name, column_name, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'product_variants' and column_name = 'unit_cost_minor')
        or
        (
          table_name = 'order_items'
          and column_name in ('unit_cost_minor', 'total_cost_minor')
        )
      )
    order by table_name, column_name
  `;

  if (columns.length !== 3) {
    throw new Error(
      `Expected 3 cost-basis columns, found ${columns.length}.`,
    );
  }

  if (columns.some((column) => column.is_nullable !== "YES")) {
    throw new Error(
      "Cost-basis columns must remain nullable so unknown cost is not fabricated.",
    );
  }

  const constraints = await sql<{ conname: string }[]>`
    select c.conname
    from pg_constraint c
    inner join pg_class t on t.oid = c.conrelid
    inner join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and c.conname in (
        'product_variants_unit_cost_nonnegative',
        'order_items_unit_cost_nonnegative',
        'order_items_total_cost_nonnegative',
        'order_items_cost_pair_consistent',
        'order_items_total_cost_consistent'
      )
    order by c.conname
  `;

  if (constraints.length !== 5) {
    throw new Error(
      `Expected 5 cost-basis checks, found ${constraints.length}.`,
    );
  }

  const [variantCounts] = await sql<{ total: number; configured: number }[]>`
    select
      count(*)::int as total,
      count(*) filter (where unit_cost_minor is not null)::int as configured
    from product_variants
  `;

  const [itemCounts] = await sql<{ total: number; snapshotted: number }[]>`
    select
      count(*)::int as total,
      count(*) filter (where unit_cost_minor is not null)::int as snapshotted
    from order_items
  `;

  console.log("Nullable variant unit cost: PASS");
  console.log("Nullable order-item cost snapshot: PASS");
  console.log("Cost integrity constraints: PASS");
  console.log(
    "Variants with configured cost:",
    `${variantCounts?.configured ?? 0}/${variantCounts?.total ?? 0}`,
  );
  console.log(
    "Order items with cost snapshot:",
    `${itemCounts?.snapshotted ?? 0}/${itemCounts?.total ?? 0}`,
  );
  console.log("");
  console.log("PART Q BATCH 01 LIVE SCHEMA VERIFIED");
}

main()
  .then(async () => {
    await sql.end();
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
