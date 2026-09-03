# Part C - Batch 02: Transactional Order Core

This batch turns the Batch 01 data model into a reusable application and
persistence layer. It still does not expose a public HTTP endpoint or alter the
current landing page.

## Included

- Strict server-side PostgreSQL environment validation.
- Transaction-capable Drizzle/Postgres.js database client, suitable for a
  PostgreSQL or Neon pooled connection string.
- Provider-independent landing-order service and persistence interfaces.
- Active store/product/variant resolution from database data.
- Immutable price and product snapshots on each order.
- SHA-256 request fingerprints for safe idempotency handling.
- Conditional stock reservation inside the order transaction.
- Database checks for non-negative inventory and money plus consistent line and
  order totals.
- Atomic customer, visitor, session, order, item, initial status, COD payment,
  attribution and purchase-event persistence.
- Deterministic source fallback: UTM, Meta click ID, Google click ID, referrer,
  then direct.
- Unit coverage for duplicate requests, conflicting idempotency payloads,
  stock failure, inactive catalog data and concurrent duplicate resolution.

## Transaction boundary

All writes for a newly accepted order run in one database transaction. A
failure rolls back stock reservation and every dependent record. Database
unique constraints remain the final concurrency guard.

## Intentionally deferred

- Running migrations against a real database and seeding M3Food catalog data.
- Public order/event/tracking APIs and request rate limiting.
- Landing-page form integration and thank-you page.
- Admin, courier, Meta CAPI, GA4/GTM and retargeting integrations.
