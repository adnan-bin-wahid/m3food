# Part O Batch 02 — Paid Acquisition Performance

## Goal

Join provider delivery evidence to first-party commerce outcomes through the canonical Campaign Registry without trusting provider-reported conversions as commerce truth.

## Performance grain

The report is **one row per canonical marketing campaign**, not one row per provider mapping.

This matters because more than one Meta/Google provider campaign may point to the same canonical campaign. Provider delivery is aggregated across those mappings, while first-party sessions/orders/revenue are counted once. This avoids double-counting orders.

## Metrics

Delivery:
- provider mix
- mapping count
- spend by provider-account currency
- impressions
- clicks
- CTR
- CPC when one spend currency is available

First-party:
- visitors
- sessions
- first-touch orders
- last-touch placed orders
- placed revenue
- orders/revenue that reached CONFIRMED
- orders/revenue that reached DELIVERED

Economics:
- placed CPA
- delivered CPA
- placed ROAS
- delivered ROAS

## Currency safety

No FX rate is invented.

- one spend currency: CPA can be shown in that spend currency
- spend currency equals store revenue currency: ROAS can be calculated
- one non-store spend currency: CPA is shown, ROAS is suppressed
- mixed spend currencies: combined CPA and ROAS are suppressed

## Attribution semantics

Paid acquisition outcomes use canonical **last-touch campaign attribution** for placed/confirmed/delivered order metrics. First-touch order count remains available as diagnostic evidence.

"Reached confirmed" and "reached delivered" use order status history, so later cancellation/return does not erase the fact that the lifecycle stage was reached.

Placed revenue deliberately means revenue value at order placement and may include orders later cancelled/returned. Delivered-reached revenue is the stricter operational outcome.

## Database

No new migration is introduced in Batch 02. It reads the Part N `0014` attribution linkage and Part O Batch 01 `0015` paid ads tables.
