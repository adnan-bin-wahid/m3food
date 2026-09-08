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
    recognizedOrders: number;
    fullyCostedDeliveredOrders: number;
    reversedOrders: number;
    reversedWithKnownFulfillment: number;
    attributedRecognizedOrders: number;
    mappedPaidProviders: number;
    mappedPaidCurrencies: number;
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
      (
        select count(*)::int
        from orders
        where status in ('DELIVERED', 'CANCELLED', 'RETURNED')
      ) as "recognizedOrders",
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
        select count(*)::int
        from orders o
        inner join order_attributions oa
          on oa.order_id = o.id
         and oa.store_id = o.store_id
        where o.status in ('DELIVERED', 'CANCELLED', 'RETURNED')
      ) as "attributedRecognizedOrders",
      (
        select count(distinct paa.provider)::int
        from paid_ad_campaign_mappings pacm
        inner join paid_ad_accounts paa
          on paa.id = pacm.account_id
         and paa.store_id = pacm.store_id
      ) as "mappedPaidProviders",
      (
        select count(distinct paa.currency)::int
        from paid_ad_campaign_mappings pacm
        inner join paid_ad_accounts paa
          on paa.id = pacm.account_id
         and paa.store_id = pacm.store_id
      ) as "mappedPaidCurrencies"
  `;

  const [integrity] = await sql<{
    duplicateAttributionOrders: number;
    inconsistentItemCostPairs: number;
    negativeFulfillmentCosts: number;
    negativePaidSpend: number;
  }[]>`
    select
      (
        select count(*)::int
        from (
          select order_id
          from order_attributions
          group by order_id
          having count(*) > 1
        ) duplicates
      ) as "duplicateAttributionOrders",
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

  if ((integrity?.duplicateAttributionOrders ?? -1) !== 0) {
    throw new Error("One-order-one-attribution integrity failed.");
  }

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
  console.log("Recognized lifecycle orders:", sources?.recognizedOrders ?? 0);
  console.log(
    "Fully costed current DELIVERED orders:",
    sources?.fullyCostedDeliveredOrders ?? 0,
  );
  console.log("Current CANCELLED/RETURNED orders:", sources?.reversedOrders ?? 0);
  console.log(
    "Reversed orders with known fulfillment cost:",
    `${sources?.reversedWithKnownFulfillment ?? 0}/${sources?.reversedOrders ?? 0}`,
  );
  console.log(
    "Recognized orders with attribution:",
    `${sources?.attributedRecognizedOrders ?? 0}/${sources?.recognizedOrders ?? 0}`,
  );
  console.log("Mapped paid providers:", sources?.mappedPaidProviders ?? 0);
  console.log("Mapped paid currencies:", sources?.mappedPaidCurrencies ?? 0);
  console.log("One-order-one-attribution integrity: PASS");
  console.log("Q01 item cost-pair integrity: PASS");
  console.log("Q02 fulfillment-cost integrity: PASS");
  console.log("Paid-ad spend integrity: PASS");
  console.log("");
  console.log("PART R BATCH 03 LIVE DASHBOARD SOURCES VERIFIED");
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
