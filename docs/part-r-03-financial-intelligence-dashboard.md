# Part R — Batch 03: Financial Intelligence Dashboard and Closure

Part R Batch 03 exposes the R01 store financial summary and R02 channel acquisition
profitability as an admin decision surface at `/admin/financials`.

## Dashboard

The Financials page supports the existing bounded marketing ranges:

- 7 days
- 30 days
- 90 days
- all time

It displays:

- delivered first-party revenue;
- known immutable item COGS;
- known fulfillment cost and reversed operational loss;
- realized commerce contribution;
- mapped paid-ad spend;
- net contribution after comparable paid spend;
- contribution margin;
- recognized-order cost coverage;
- Meta / Google / Organic / Other channel profitability.

## Reconciliation boundary

The dashboard does not blindly place R01 and R02 calculations beside each other.
`financial-intelligence-service.ts` fails closed unless store-level and channel-level
truth reconcile for:

- delivered order count;
- cancelled/returned recognized order count;
- total recognized orders;
- delivered revenue;
- known item COGS;
- known delivered fulfillment cost;
- known reversed fulfillment loss;
- recognized cost-complete order count;
- paid spend by currency;
- commerce contribution when cost-complete;
- net contribution when cost and spend are comparable.

The store and channel services must also receive the exact same time window.

## Decision safeguards

The dashboard explicitly warns when:

- one or more recognized orders are missing required cost truth;
- mapped paid-ad spend cannot be compared with the store currency.

Unknown financial inputs are never rendered as zero profitability. Mixed or non-store
paid currencies never trigger an invented FX conversion.

Provider conversions and provider revenue remain excluded from commerce truth.

## Persistence

Part R remains a derived financial intelligence layer over existing first-party
commerce, immutable cost snapshots, fulfillment cost, attribution, and paid-ad
delivery tables.

No `0019` migration is required.

## Part R closure

After Batch 03 passes static contracts, targeted financial tests, full domain
regression, TypeScript, production build, live source verification, exact file-set
verification, and remote commit equality, Part R is complete.
