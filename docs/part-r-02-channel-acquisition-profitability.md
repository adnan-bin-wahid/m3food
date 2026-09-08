# Part R — Batch 02: Channel / Acquisition Profitability

Part R Batch 02 decomposes the R01 store financial truth into deterministic
last-touch acquisition channels without changing first-party commerce recognition.

## Channels

Every current `DELIVERED`, `CANCELLED`, or `RETURNED` order in the selected
7d / 30d / 90d / all-time range is assigned to exactly one channel:

- `META`
- `GOOGLE`
- `ORGANIC`
- `OTHER`

Classification uses the immutable order-attribution snapshot and canonical
last-touch campaign mappings.

Priority:

1. `gclid` => Google;
2. `fbclid` => Meta;
3. Facebook / Instagram / Meta source => Meta;
4. direct / explicit organic / SEO => Organic;
5. Google paid source/medium or Google mapping => Google;
6. one unambiguous paid provider mapping => that provider;
7. ambiguous or unmatched => Other.

A campaign mapped to more than one provider is never guessed when source/click
evidence cannot disambiguate it.

## Channel financial recognition

Each channel uses the same Q01 / Q02 / R01 rules:

```text
Delivered Revenue
- Delivered COGS
- Delivered Fulfillment Cost
- Cancelled / Returned Fulfillment Loss
= Realized Channel Commerce Contribution
```

Unknown delivered COGS, unknown delivered fulfillment cost, or unknown reversed
fulfillment loss fails closed for only the affected channel.

## Paid spend

Meta and Google spend are aggregated independently from mapped paid-ad delivery
metrics using provider-local metric dates.

```text
Realized Channel Commerce Contribution
- Comparable Provider Spend
= Channel Net Contribution
```

Organic and Other have explicit zero paid-ad spend.

If a provider uses multiple currencies, or a single non-store currency, no FX is
invented. Only that provider channel's after-ad profitability is suppressed.

Provider conversion/revenue fields are never used as commerce truth.

## Reconciliation

Every recognized order is assigned once. The sum of channel recognized-order counts
must equal the source recognized-order count.

This prevents channel-level order double-counting.

## Persistence

Batch 02 derives profitability from existing attribution, Q01/Q02 costs, and paid-ad
delivery data. No new persistent financial table is required.

No `0019` migration is expected.
