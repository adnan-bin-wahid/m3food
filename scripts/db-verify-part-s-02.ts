import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) throw new Error("Database URL missing.");

const sql = postgres(url, { max: 1, prepare: false });

async function main() {
  const [state] = await sql<{
    financialOrders: number;
    deliveredOrders: number;
    paidDelivered: number;
    refundedDelivered: number;
    unsettledDelivered: number;
    reversedOrders: number;
    unsettledReversed: number;
  }[]>`
    select
      count(*) filter (
        where status in ('DELIVERED', 'CANCELLED', 'RETURNED')
      )::int as "financialOrders",
      count(*) filter (
        where status = 'DELIVERED'
      )::int as "deliveredOrders",
      count(*) filter (
        where status = 'DELIVERED'
          and payment_status = 'PAID'
      )::int as "paidDelivered",
      count(*) filter (
        where status = 'DELIVERED'
          and payment_status = 'REFUNDED'
      )::int as "refundedDelivered",
      count(*) filter (
        where status = 'DELIVERED'
          and payment_status in ('UNPAID', 'PENDING', 'FAILED')
      )::int as "unsettledDelivered",
      count(*) filter (
        where status in ('CANCELLED', 'RETURNED')
      )::int as "reversedOrders",
      count(*) filter (
        where status in ('CANCELLED', 'RETURNED')
          and payment_status in ('PAID', 'PENDING')
      )::int as "unsettledReversed"
    from orders
  `;

  const [integrity] = await sql<{
    compared: number;
    mismatched: number;
    missingPayment: number;
  }[]>`
    with latest_payment as (
      select distinct on (p.order_id)
        p.order_id,
        p.status
      from payments p
      order by p.order_id, p.created_at desc, p.id desc
    )
    select
      count(*) filter (
        where lp.order_id is not null
      )::int as compared,
      count(*) filter (
        where lp.order_id is not null
          and o.payment_status <> lp.status
      )::int as mismatched,
      count(*) filter (
        where lp.order_id is null
      )::int as "missingPayment"
    from orders o
    left join latest_payment lp
      on lp.order_id = o.id
  `;

  if ((integrity?.mismatched ?? -1) !== 0) {
    throw new Error(
      `Found ${integrity?.mismatched ?? -1} order/latest-payment status mismatches.`,
    );
  }

  if ((integrity?.missingPayment ?? -1) !== 0) {
    throw new Error(
      `Found ${integrity?.missingPayment ?? -1} orders without payment records.`,
    );
  }

  console.log(
    "Financial lifecycle orders:",
    state?.financialOrders ?? 0,
  );
  console.log(
    "Current DELIVERED orders:",
    state?.deliveredOrders ?? 0,
  );
  console.log(
    "DELIVERED + PAID:",
    state?.paidDelivered ?? 0,
  );
  console.log(
    "DELIVERED + REFUNDED:",
    state?.refundedDelivered ?? 0,
  );
  console.log(
    "DELIVERED unsettled:",
    state?.unsettledDelivered ?? 0,
  );
  console.log(
    "Current CANCELLED/RETURNED:",
    state?.reversedOrders ?? 0,
  );
  console.log(
    "Reversed lifecycle with PAID/PENDING settlement:",
    state?.unsettledReversed ?? 0,
  );
  console.log(
    "Orders compared with latest payment:",
    integrity?.compared ?? 0,
  );
  console.log("Latest payment/order status consistency: PASS");
  console.log("Payment record coverage: PASS");
  console.log("");
  console.log(
    "PART S BATCH 02 LIVE SETTLEMENT SOURCES VERIFIED",
  );
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
