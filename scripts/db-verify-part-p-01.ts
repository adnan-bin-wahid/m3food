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
  const accountColumns = await sql<{
    column_name: string;
  }[]>`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'paid_ad_accounts'
      and column_name in (
        'sync_enabled',
        'sync_lookback_days'
      )
    order by column_name
  `;

  if (accountColumns.length !== 2) {
    throw new Error(
      "Paid ad account scheduling columns are missing.",
    );
  }

  const [runTable] = await sql<{
    relrowsecurity: boolean;
  }[]>`
    select c.relrowsecurity
    from pg_class c
    inner join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'paid_ad_sync_runs'
      and c.relkind = 'r'
    limit 1
  `;

  if (!runTable) {
    throw new Error("paid_ad_sync_runs table is missing.");
  }

  if (!runTable.relrowsecurity) {
    throw new Error(
      "paid_ad_sync_runs must have RLS enabled.",
    );
  }

  const indexes = await sql<{
    indexname: string;
  }[]>`
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'paid_ad_sync_runs'
  `;

  if (
    !indexes.some(
      (row) =>
        row.indexname ===
        'paid_ad_sync_runs_schedule_key_uniq',
    )
  ) {
    throw new Error(
      "Scheduled sync run deduplication index is missing.",
    );
  }

  const [{ count: enabledCount }] = await sql<{
    count: number;
  }[]>`
    select count(*)::int as count
    from paid_ad_accounts
    where sync_enabled = true
  `;

  console.log(
    "Paid ad account schedule columns: PASS",
  );
  console.log("Paid sync run history table: PASS");
  console.log("Paid sync run RLS: PASS");
  console.log("Schedule-key deduplication: PASS");
  console.log(
    "Currently scheduled accounts:",
    enabledCount,
  );
  console.log("");
  console.log(
    "PART P BATCH 01 LIVE SCHEMA VERIFIED",
  );
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
