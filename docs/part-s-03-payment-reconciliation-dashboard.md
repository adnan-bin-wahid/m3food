# Part S Batch 03 — Payment Reconciliation Dashboard

## Objective

S03 closes the operational gap between the S01 payment settlement mutation path and the S02 settlement-aware profitability model.

The dashboard does **not** create a second payment-write implementation. It is a read-oriented exception queue that routes admins back to the existing S01 mutation path.

## Queue rules

The queue surfaces:

- `DELIVERED + UNPAID/PENDING/FAILED` — delivery happened but cash settlement is unresolved.
- `CANCELLED/RETURNED + PAID/PENDING` — the commercial lifecycle reversed but refund/settlement reconciliation remains outstanding.
- Latest payment status different from `orders.payment_status` — integrity mismatch.
- Order without a payment record — integrity exception.

Settled financial outcomes remain outside the queue:

- `DELIVERED + PAID`
- `DELIVERED + REFUNDED`
- `CANCELLED/RETURNED + UNPAID/FAILED/REFUNDED`

The service reuses the S02 `classifyFinancialPaymentRecognition` classifier rather than inventing another financial settlement matrix.

## Operational UI

Route:

`/admin/payments`

The page exposes:

- total unresolved count
- delivered unsettled count
- cancelled/returned refund-outstanding count
- order/latest-payment status mismatch count
- missing-payment count
- oldest unresolved attention age
- filters by issue, payment status, search, and page
- order/customer context
- lifecycle and payment status
- amount, provider reference, payment revision
- a direct link to the order detail payment reconciliation section

## Mutation boundary

S03 performs **no duplicate payment mutation**.

The queue links to the existing S01 mutation path on the order detail page. That path retains:

- latest payment identity protection
- expected revision guard
- expected status guard
- row locking
- atomic payment status update
- atomic `orders.payment_status` synchronization
- immutable `payment_status_history`
- actor identity
- provider reference and note audit context

`OWNER`, `ADMIN`, and `ORDER_MANAGER` may reconcile through S01.

`ANALYST` remains read-only.

## Data integrity

Candidate loading always resolves the latest payment deterministically using:

1. `payments.created_at DESC`
2. `payments.id DESC`

The queue treats order/latest-payment status mismatch and missing payment as integrity exceptions.

## Migration

No `0020` migration is required.

S03 is application/repository/service/UI/test/documentation work on top of the existing S01 `0019` payment settlement schema.
