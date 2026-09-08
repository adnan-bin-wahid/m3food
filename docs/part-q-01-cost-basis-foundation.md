# Part Q Batch 01 — Cost Basis Foundation

## Goal

Introduce a trustworthy product cost basis for future profitability work without fabricating historical cost.

## Variant cost basis

Each product variant can carry an optional `unit_cost_minor`.

- cost uses the application's existing minor-unit money convention
- cost must be a nonnegative integer when known
- `NULL` means unknown / not configured
- unknown cost is never treated as zero
- OWNER / ADMIN manage cost through Catalog variant forms
- catalog change history snapshots include cost changes
- the public catalog does not expose internal unit cost

## Immutable order cost snapshot

Future order items snapshot `unit_cost_minor` and `total_cost_minor` when the purchased variant has a known cost at order creation.

`total_cost_minor = unit_cost_minor × quantity`.

If current variant cost is unknown, both order-item cost fields remain `NULL`.

Changing a variant's current cost later does not rewrite old order-item cost snapshots.

## Historical orders

Migration 0017 deliberately does **not** backfill historical order-item cost.

Existing order items remain `NULL` for cost basis unless a separate evidence-backed historical-cost process is introduced later. Treating unknown historical cost as zero would overstate profit.

## Scope boundary

Q01 establishes cost truth only. Q02 adds order contribution and Q03 adds campaign profitability. Provider conversions/revenue remain excluded from first-party commerce truth.
