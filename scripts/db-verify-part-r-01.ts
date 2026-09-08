import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) throw new Error("Database URL missing.");

const sql = postgres(url, { max: 1, prepare: false });

async function main() {
  const [sources] = await sql<{
    stores: number;
    deliveredOrders: number;
    fullyCostedDeliveredOrders: number;
    reversedOrders: number;
    reversedWithKnownFulfillment: number;
    paidAccounts: number;
    paidCurrencies: number;
  }[]>`
    with delivered as (
      select
        o.id,
        o.fulfillment_cost_minor,
        count(oi.id)::int as item_count,
        count(oi.total_cost_minor)::int as known_item_cost_count
      from orders o
      left join order_items oi
        on oi.order_id = o.id
      where o.status = 'DELIVERED'
      group by o.id, o.fulfillment_cost_minor
    ),
    reversed as (
      select
        o.id,
        o.fulfillment_cost_minor
      from orders o
      where o.status in ('CANCELLED', 'RETURNED')
    )
    select
      (select count(*)::int from stores) as "stores",
      (select count(*)::int from delivered) as "deliveredOrders",
      (
        select count(*)::int
        from delivered
        where item_count > 0
          and known_item_cost_count = item_count
          and fulfillment_cost_minor is not null
      ) as "fullyCostedDeliveredOrders",
      (select count(*)::int from reversed) as "reversedOrders",
      (
        select count(*)::int
        from reversed
        where fulfillment_cost_minor is not null
      ) as "reversedWithKnownFulfillment",
      (
        select count(distinct paa.id)::int
        from paid_ad_accounts paa
        inner join paid_ad_campaign_mappings pacm
          on pacm.account_id = paa.id
         and pacm.store_id = paa.store_id
      ) as "paidAccounts",
      (
        select count(distinct paa.currency)::int
        from paid_ad_accounts paa
        inner join paid_ad_campaign_mappings pacm
          on pacm.account_id = paa.id
         and pacm.store_id = paa.store_id
      ) as "paidCurrencies"
  `;

  const [integrity] = await sql<{
    inconsistentItemCostPairs: number;
    negativeFulfillmentCosts: number;
    negativePaidSpend: number;
  }[]>`
    select
      (
        select count(*)::int
        from order_items
        where (unit_cost_minor is null) <> (total_cost_minor is null)
      ) as "inconsistentItemCostPairs",
      (
        select count(*)::int
        from orders
        where fulfillment_cost_minor < 0
      ) as "negativeFulfillmentCosts",
      (
        select count(*)::int
        from paid_ad_daily_metrics
        where spend_minor < 0
      ) as "negativePaidSpend"
  `;

  if ((integrity?.inconsistentItemCostPairs ?? -1) !== 0) {
    throw new Error("Q01 item cost-pair integrity failed.");
  }

  if ((integrity?.negativeFulfillmentCosts ?? -1) !== 0) {
    throw new Error("Q02 fulfillment-cost integrity failed.");
  }

  if ((integrity?.negativePaidSpend ?? -1) !== 0) {
    throw new Error("Paid-ad spend integrity failed.");
  }

  console.log("Stores:", sources?.stores ?? 0);
  console.log("Current DELIVERED orders:", sources?.deliveredOrders ?? 0);
  console.log(
    "Fully costed DELIVERED orders:",
    `${sources?.fullyCostedDeliveredOrders ?? 0}/${sources?.deliveredOrders ?? 0}`,
  );
  console.log("Current CANCELLED/RETURNED orders:", sources?.reversedOrders ?? 0);
  console.log(
    "Reversed orders with known fulfillment cost:",
    `${sources?.reversedWithKnownFulfillment ?? 0}/${sources?.reversedOrders ?? 0}`,
  );
  console.log("Mapped paid ad accounts:", sources?.paidAccounts ?? 0);
  console.log("Distinct mapped paid account currencies:", sources?.paidCurrencies ?? 0);
  console.log("Q01 item cost-pair integrity: PASS");
  console.log("Q02 fulfillment-cost integrity: PASS");
  console.log("Paid-ad spend integrity: PASS");
  console.log("");
  console.log("PART R BATCH 01 LIVE SOURCES VERIFIED");
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
