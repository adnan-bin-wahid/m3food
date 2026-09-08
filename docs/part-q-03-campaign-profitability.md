# Part Q Batch 03 — Campaign Profitability

## Goal

Turn paid campaign delivery plus Q01/Q02 first-party cost truth into campaign-level profitability without trusting provider conversion value and without inventing missing costs or FX.

## Commerce truth

Provider-reported conversions and provider-reported revenue are not commerce truth.

Campaign outcomes use first-party orders with canonical **last-touch campaign attribution**. Q03 profitability includes orders whose **current order status is `DELIVERED`**. The older paid-acquisition funnel keeps its separate "reached delivered" lifecycle evidence unchanged.

That distinction prevents an order that later becomes `RETURNED` from remaining in delivered campaign profit simply because it once reached `DELIVERED`.

## Cost truth

Q03 reads only existing Q01/Q02 cost data:

- immutable `order_items.total_cost_minor` snapshots for item COGS
- `orders.fulfillment_cost_minor` for actual order-level fulfillment cost

Unknown COGS or unknown fulfillment cost is never treated as zero.

For a campaign, delivered contribution is complete only when every currently delivered attributed order has:

- at least one order item
- a known COGS snapshot for every order item
- a known fulfillment cost

Known partial cost totals may be displayed as evidence, but contribution and after-ad profitability stay unknown until coverage is complete.

## Profit definitions

When delivered cost coverage is complete:

```text
Delivered Revenue
- Delivered Order COGS
- Fulfillment Cost
= Contribution Before Ads
```

When ad spend is also currency-comparable to the store currency:

```text
Contribution Before Ads
- Ad Spend
= Net Contribution After Ads
```

Campaign contribution margin is:

```text
Net Contribution After Ads / Delivered Revenue
```

Profit efficiency is:

```text
Contribution Before Ads / Ad Spend
```

A profit-efficiency value of `1.00x` is the break-even point before subtracting ad spend from contribution. Greater than `1.00x` implies positive net contribution after ads.

If a campaign has spend but no delivered orders, delivered contribution is `0`, net contribution is negative ad spend, and profit efficiency is `0x` when the spend currency is comparable.

## Currency safety

No FX rate is invented.

- one spend currency matching store currency: after-ad profitability is calculated
- one non-store spend currency: contribution before ads is shown, after-ad profitability is suppressed
- mixed spend currencies: contribution before ads is shown, after-ad profitability is suppressed

## Attribution and range semantics

Q03 preserves existing canonical last-touch attribution.

The selected marketing range applies to:

- provider spend by provider-local metric date
- first-party order cohort by `orders.created_at`

This matches the paid-acquisition report's existing range semantics.

## Scope boundary

Q03 is a read-only analytics batch. It does not mutate orders, attribution, paid-ad metrics, or cost snapshots.

No new persistence is required, so **no `0019` migration is introduced**.

Q02 cancelled/returned reversal semantics remain available at order level. Q03 specifically reports delivered campaign contribution and therefore excludes orders whose current status is no longer `DELIVERED`.
