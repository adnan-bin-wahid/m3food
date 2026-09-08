# Part Q Batch 02 — Order Contribution Intelligence

## Goal

Turn Q01 cost snapshots into order-level economics without inventing missing costs.

## Cost semantics

Order revenue uses the first-party commerce total already stored on the order.

Item COGS comes only from immutable `order_items.total_cost_minor` snapshots created by Q01.

Fulfillment cost is an optional order-level actual operational cost. Blank means unknown; zero is a valid explicit value.

Unknown cost is never treated as zero.

## Profit definitions

When every order item has a known cost snapshot:

- gross profit = order revenue - item COGS
- projected contribution = gross profit - fulfillment cost
- projected contribution margin = projected contribution / revenue

Projected contribution requires both complete item COGS and a known fulfillment cost.

## Lifecycle recognition

- PENDING / CONFIRMED / PROCESSING / SHIPPED: contribution is provisional only; no recognized contribution is reported.
- DELIVERED: recognized contribution equals projected contribution when all required costs are known.
- CANCELLED: revenue is reversed and inventory reservations are released, so recognized contribution is the negative recorded fulfillment cost when that cost is known.
- RETURNED: revenue is reversed and inventory is restocked, so recognized contribution is the negative recorded fulfillment cost when that cost is known.

For CANCELLED / RETURNED, the fulfillment cost field should contain the actual total operational cost incurred for that order, including return-related courier cost if applicable.

## Admin control

OWNER, ADMIN, and ORDER_MANAGER can update fulfillment cost from the order detail page.

The write is:

- store scoped
- optimistic via `fulfillment_cost_revision`
- audit logged in `order_cost_history`

ANALYST remains read-only.

## Historical orders

Q02 does not backfill Q01 item cost snapshots. Historical orders with unknown item COGS remain incomplete for gross/projected contribution.

This is intentional: incomplete cost truth is shown as unknown instead of overstating profit.

## Scope boundary

Q02 calculates order economics only.

Q03 will aggregate delivered first-party contribution into campaign profitability and combine it with paid acquisition spend without importing provider conversions or provider revenue as commerce truth.
