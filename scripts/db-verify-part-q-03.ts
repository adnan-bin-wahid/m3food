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
    paidCampaigns: number;
    deliveredPaidOrders: number;
    completeCogsOrders: number;
    knownFulfillmentOrders: number;
    fullyCostedOrders: number;
  }[]>`
    with paid_campaigns as (
      select distinct
        pacm.store_id,
        pacm.marketing_campaign_id
      from paid_ad_campaign_mappings pacm
      where pacm.marketing_campaign_id is not null
    ),
    delivered_paid_orders as (
      select
        o.id,
        o.fulfillment_cost_minor,
        count(oi.id)::int as item_count,
        count(oi.total_cost_minor)::int as known_item_cost_count
      from order_attributions oa
      inner join orders o
        on o.id = oa.order_id
       and o.store_id = oa.store_id
      inner join paid_campaigns pc
        on pc.store_id = oa.store_id
       and pc.marketing_campaign_id = oa.last_touch_campaign_id
      left join order_items oi
        on oi.order_id = o.id
      where o.status = 'DELIVERED'
      group by o.id, o.fulfillment_cost_minor
    )
    select
      (select count(*)::int from paid_campaigns) as "paidCampaigns",
      count(*)::int as "deliveredPaidOrders",
      count(*) filter (
        where item_count > 0
          and known_item_cost_count = item_count
      )::int as "completeCogsOrders",
      count(*) filter (
        where fulfillment_cost_minor is not null
      )::int as "knownFulfillmentOrders",
      count(*) filter (
        where item_count > 0
          and known_item_cost_count = item_count
          and fulfillment_cost_minor is not null
      )::int as "fullyCostedOrders"
    from delivered_paid_orders
  `;

  const [integrity] = await sql<{
    inconsistentItemCostPairs: number;
    negativeFulfillmentCosts: number;
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
      ) as "negativeFulfillmentCosts"
  `;

  if ((integrity?.inconsistentItemCostPairs ?? -1) !== 0) {
    throw new Error("Q01 item cost-pair integrity failed.");
  }

  if ((integrity?.negativeFulfillmentCosts ?? -1) !== 0) {
    throw new Error("Q02 fulfillment-cost integrity failed.");
  }

  console.log("Paid canonical campaigns:", sources?.paidCampaigns ?? 0);
  console.log(
    "Current DELIVERED last-touch paid orders:",
    sources?.deliveredPaidOrders ?? 0,
  );
  console.log(
    "Delivered orders with complete item COGS:",
    `${sources?.completeCogsOrders ?? 0}/${sources?.deliveredPaidOrders ?? 0}`,
  );
  console.log(
    "Delivered orders with known fulfillment cost:",
    `${sources?.knownFulfillmentOrders ?? 0}/${sources?.deliveredPaidOrders ?? 0}`,
  );
  console.log(
    "Fully costed delivered paid orders:",
    `${sources?.fullyCostedOrders ?? 0}/${sources?.deliveredPaidOrders ?? 0}`,
  );
  console.log("Q01 item cost-pair integrity: PASS");
  console.log("Q02 fulfillment-cost integrity: PASS");
  console.log("");
  console.log("PART Q BATCH 03 LIVE SOURCE VERIFIED");
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
