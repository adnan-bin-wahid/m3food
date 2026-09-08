# Part T Batch 01 — Payment Intent + Provider Adapter Foundation

## Objective

T01 creates the provider-neutral payment orchestration layer that sits above the existing S01 settlement write path.

It does **not** implement SSLCommerz network calls yet. T02 will provide the first production adapter.

## Backward compatibility

Landing orders remain COD by default.

An omitted payment selection is normalized to:

- method: `COD`
- payment status: `UNPAID`
- no payment intent

No existing storefront must opt into online payment during T01.

## Online selection

The public order contract can explicitly request:

- method: `ONLINE`
- provider: `SSL_COMMERZ`

An online order is created with:

- order/payment method: `ONLINE`
- order/payment status: `PENDING`
- payment intent status: `CREATED`

`CREATED` is orchestration state only. It is **not** proof of payment.

## Payment intent lifecycle

T01 establishes these provider-neutral intent states:

- `CREATED`
- `INITIATING`
- `REQUIRES_ACTION`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `CANCELLED`
- `EXPIRED`

Payment intents are bound to a store, order, and concrete payment row.

Intent initiation has a store-scoped idempotency key.

## Adapter contract

`PaymentAdapter` separates provider-specific code from commerce/payment truth.

Adapters expose:

- `initiate(...)`
- `verifyCallback(...)`

A callback is never trusted merely because it says success.

`verifyCallback(...)` returns a discriminated result:

- `verified: false` — no settlement mutation is permitted
- `verified: true` — T02 may bridge the verified result into the existing S01 revision-protected settlement path

## Replay protection foundation

`payment_provider_events` stores:

- provider
- stable event key
- payload SHA-256
- verification status
- raw provider payload
- received / verified timestamps

The database has a unique store/provider/event-key constraint so the same provider event cannot be processed twice as a new event.

## Security

Provider credentials remain server-only.

T01 reserves optional SSLCommerz environment configuration but performs no outbound gateway request.

## Migration

T01 introduces exactly one `0020` migration generated from the Drizzle schema.

The migration:

- extends `payment_method` with `ONLINE`
- adds provider / intent / event-verification enums
- creates `payment_intents`
- creates `payment_provider_events`
- enables RLS on the new tables

S01 `payment_status_history` and revision-protected settlement semantics remain intact.
