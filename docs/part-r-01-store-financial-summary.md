# Part R — Batch 01: Store Financial Summary Foundation

Part R Batch 01 introduces a store-scoped financial truth layer on top of the cost,
order contribution, attribution, and paid-ads foundations already completed in
Parts O–Q.

## Financial recognition

For the selected 7d / 30d / 90d / all-time marketing window:

```text
Delivered Revenue
- Delivered Order COGS
- Delivered Fulfillment Cost
- Cancelled / Returned Fulfillment Loss
= Realized Commerce Contribution

Realized Commerce Contribution
- Comparable Paid-Ad Spend
= Store Net Contribution
```

The order cohort follows the existing Q03 range convention: orders are selected by
`orders.created_at`, then current lifecycle status determines recognition.

## Commerce truth

Only first-party order data is authoritative for revenue and lifecycle recognition.
Provider conversion or provider revenue fields are not imported into store financial
truth.

Current `DELIVERED` orders recognize revenue and contribution only when every order
item has an immutable Q01 cost snapshot and the Q02 fulfillment cost is known.

Current `CANCELLED` and `RETURNED` orders reverse revenue. Their recognized financial
effect is the recorded fulfillment cost as an operational loss, matching Q02
semantics. Item COGS is not required for reversed orders because that revenue is not
recognized.

## Fail-closed coverage

Unknown financial inputs never become zero:

- incomplete delivered item COGS => realized commerce contribution is unknown;
- unknown delivered fulfillment cost => realized commerce contribution is unknown;
- unknown cancelled/returned fulfillment cost => reversed loss is unknown;
- incomplete commerce cost coverage => after-ad profitability is also unknown.

The summary reports both cost coverage percentage and a strict complete/incomplete
flag.

## Paid-ad spend and currency

Paid-ad spend is aggregated from existing paid-ad account/mapping/daily-metric
sources using provider-local metric dates.

- no mapped paid-ad accounts => comparable spend is explicitly zero in the store currency;
- one spend currency matching the store currency => spend is comparable;
- one non-store spend currency => no FX is invented and after-ad profitability is
  suppressed;
- multiple paid account currencies => no FX is invented and after-ad profitability
  is suppressed.

Commerce contribution remains available when commerce costs are complete even if ad
spend is not comparable.

## Persistence

No new financial table is introduced in Batch 01. The summary is derived from the
existing immutable order-item cost snapshots, order fulfillment cost, order status,
store currency, and paid-ad delivery sources.

Therefore no `0019` migration is expected.
