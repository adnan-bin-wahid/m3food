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
    recognizedOrders: number;
    ordersWithAttribution: number;
    ordersWithLastCampaign: number;
    metaMappings: number;
    googleMappings: number;
    metaCurrencies: number;
    googleCurrencies: number;
  }[]>`
    select
      (
        select count(*)::int
        from orders
        where status in ('DELIVERED', 'CANCELLED', 'RETURNED')
      ) as "recognizedOrders",
      (
        select count(*)::int
        from orders o
        inner join order_attributions oa
          on oa.order_id = o.id
         and oa.store_id = o.store_id
        where o.status in ('DELIVERED', 'CANCELLED', 'RETURNED')
      ) as "ordersWithAttribution",
      (
        select count(*)::int
        from orders o
        inner join order_attributions oa
          on oa.order_id = o.id
         and oa.store_id = o.store_id
        where o.status in ('DELIVERED', 'CANCELLED', 'RETURNED')
          and oa.last_touch_campaign_id is not null
      ) as "ordersWithLastCampaign",
      (
        select count(*)::int
        from paid_ad_campaign_mappings pacm
        inner join paid_ad_accounts paa
          on paa.id = pacm.account_id
         and paa.store_id = pacm.store_id
        where paa.provider = 'META'
      ) as "metaMappings",
      (
        select count(*)::int
        from paid_ad_campaign_mappings pacm
        inner join paid_ad_accounts paa
          on paa.id = pacm.account_id
         and paa.store_id = pacm.store_id
        where paa.provider = 'GOOGLE'
      ) as "googleMappings",
      (
        select count(distinct paa.currency)::int
        from paid_ad_campaign_mappings pacm
        inner join paid_ad_accounts paa
          on paa.id = pacm.account_id
         and paa.store_id = pacm.store_id
        where paa.provider = 'META'
      ) as "metaCurrencies",
      (
        select count(distinct paa.currency)::int
        from paid_ad_campaign_mappings pacm
        inner join paid_ad_accounts paa
          on paa.id = pacm.account_id
         and paa.store_id = pacm.store_id
        where paa.provider = 'GOOGLE'
      ) as "googleCurrencies"
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

  console.log("Recognized lifecycle orders:", sources?.recognizedOrders ?? 0);
  console.log(
    "Recognized orders with attribution:",
    `${sources?.ordersWithAttribution ?? 0}/${sources?.recognizedOrders ?? 0}`,
  );
  console.log(
    "Recognized orders with canonical last-touch campaign:",
    sources?.ordersWithLastCampaign ?? 0,
  );
  console.log("Meta mapped campaigns:", sources?.metaMappings ?? 0);
  console.log("Google mapped campaigns:", sources?.googleMappings ?? 0);
  console.log("Meta mapped currencies:", sources?.metaCurrencies ?? 0);
  console.log("Google mapped currencies:", sources?.googleCurrencies ?? 0);
  console.log("One-order-one-attribution integrity: PASS");
  console.log("Q01 item cost-pair integrity: PASS");
  console.log("Q02 fulfillment-cost integrity: PASS");
  console.log("Paid-ad spend integrity: PASS");
  console.log("");
  console.log("PART R BATCH 02 LIVE SOURCES VERIFIED");
}

main()
  .then(async () => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exitCode = 1;
  });
