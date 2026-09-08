# Part S Batch 02 — Settlement-aware Profitability

## Purpose

S01 created trustworthy, revision-guarded payment settlement truth. S02 makes
financial recognition consume that truth.

A lifecycle status by itself is no longer sufficient to claim realized revenue.

## Recognition matrix

### Delivered

- `DELIVERED + PAID`
  - revenue is realized;
  - immutable item COGS is recognized;
  - actual fulfillment cost is recognized;
  - contribution is `revenue - COGS - fulfillment`.

- `DELIVERED + REFUNDED`
  - revenue is zero/reversed;
  - delivered item COGS remains an economic loss;
  - fulfillment cost remains an economic loss;
  - contribution is `-(COGS + fulfillment)`.

- `DELIVERED + UNPAID/PENDING/FAILED`
  - settlement is unresolved;
  - profitability fails closed;
  - the system does not silently report the order as realized profit.

### Cancelled / Returned

`CANCELLED` and `RETURNED` keep the Part Q reversal model: revenue is not
recognized and only recorded fulfillment loss is recognized when settlement is
financially resolved.

- `UNPAID`, `FAILED`, or `REFUNDED` are settlement-resolved reversal outcomes.
- `PAID` or `PENDING` are unresolved because cash/refund reconciliation is still
  outstanding; profitability fails closed until settlement is corrected.

## Store and channel truth

Store and acquisition-channel summaries now expose:

- paid delivered orders;
- refunded delivered orders;
- unresolved settlement orders;
- settlement coverage;
- settlement-aware realized contribution.

An unresolved order suppresses profitability for the affected channel. The store
summary fails closed if any financially relevant order in the selected cohort has
unresolved settlement.

Meta/Google spend currency rules remain unchanged. No FX conversion is invented.

## Campaign profitability

Paid campaign profitability continues to use canonical last-touch attribution and
first-party current `DELIVERED` orders, but now separates:

- paid delivered;
- refunded delivered;
- unsettled delivered.

Campaign contribution is suppressed while any delivered campaign order is
unsettled. A refunded delivered order contributes its known COGS and fulfillment
as a loss with zero recognized revenue.

Provider conversions and provider revenue remain excluded from commerce truth.

## Order detail

Order-level recognized contribution now uses the same settlement classifier as
store, channel, and campaign calculations. This prevents financial semantics from
drifting between surfaces.

## Verification forward compatibility

S01 legitimately introduces migration `0019`, and S02 legitimately evolves Part Q/R
financial recognition. Historical Q02/Q03/R01/R02/R03 static verifiers are therefore
updated only to distinguish their original batch contract from later Part S state.
They continue to verify their original cost, attribution, currency, and UI foundations
while tolerating the later S01 migration and S02 recognition layer.

The master `npm run check` remains executable after Part S.

## Persistence

S02 is a derived recognition change over the S01 payment status foundation.

- Migration `0019` remains the migration head.
- No `0020` migration is required.
