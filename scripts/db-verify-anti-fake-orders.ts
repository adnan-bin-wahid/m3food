import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { getServerEnvironment } from "../src/lib/config/server-env";

async function main() {
  loadEnvConfig(process.cwd());
  const { DATABASE_URL } = getServerEnvironment();
  const client = postgres(DATABASE_URL, { max: 1 });

  try {
    const [table] = await client<{
      exists: boolean;
      rls: boolean;
    }[]>`
      select
        to_regclass('public.phone_verification_challenges') is not null as exists,
        coalesce((
          select c.relrowsecurity
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public'
            and c.relname = 'phone_verification_challenges'
        ), false) as rls
    `;
    if (!table?.exists || !table.rls) {
      throw new Error(
        "phone_verification_challenges table/RLS is not ready.",
      );
    }

    const columns = await client<{ column_name: string }[]>`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name in (
          'phone_verification_challenge_id',
          'phone_verified_at',
          'risk_level',
          'risk_reasons',
          'risk_snapshot',
          'manual_review_required'
        )
    `;
    if (columns.length !== 6) {
      throw new Error(
        `Expected 6 anti-fake order columns, found ${columns.length}.`,
      );
    }

    const [integrity] = await client<{
      bad_hashes: number;
      consumed_unverified: number;
      high_without_review: number;
    }[]>`
      select
        (
          select count(*)::int
          from phone_verification_challenges
          where length(code_hash) <> 64
        ) as bad_hashes,
        (
          select count(*)::int
          from phone_verification_challenges
          where consumed_at is not null
            and verified_at is null
        ) as consumed_unverified,
        (
          select count(*)::int
          from orders
          where risk_level = 'HIGH'
            and manual_review_required = false
        ) as high_without_review
    `;

    if (
      (integrity?.bad_hashes ?? 0) !== 0 ||
      (integrity?.consumed_unverified ?? 0) !== 0 ||
      (integrity?.high_without_review ?? 0) !== 0
    ) {
      throw new Error(
        `Anti-fake DB integrity failed: ${JSON.stringify(integrity)}.`,
      );
    }

    console.log("ANTI-FAKE ORDER LIVE DB VERIFIED");
    console.log("phone_verification_challenges + RLS: PASS");
    console.log("Order verification/risk columns: PASS");
    console.log("Plain/invalid OTP hash rows: 0");
    console.log("Consumed without verified rows: 0");
    console.log("HIGH risk without manual-review flag: 0");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Anti-fake-order DB verification failed.",
  );
  process.exitCode = 1;
});
