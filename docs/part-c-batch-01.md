# Part C - Batch 01: Reusable Backend Foundation

This batch adds the data and domain foundation for a reusable landing-commerce
backend. It does not connect the current M3Food order form yet.

## Included

- PostgreSQL/Neon access through Drizzle ORM.
- Store-scoped products, variants, inventory, customers, orders and payments.
- Phone-first guest order contract; email remains optional.
- Visitor and session identity foundation.
- Commerce events and order attribution, including UTM, referrer, `fbclid` and
  `gclid` fields.
- Idempotency keys and order status-transition rules.
- Integer minor-unit money fields to avoid floating-point price errors.
- Domain tests, static foundation verification, strict TypeScript and production
  build checks.

## Intentionally deferred

- Applying the migration to a real database.
- Seeding the M3Food store, product and offer.
- Public order and tracking APIs.
- Wiring the current landing-page form.
- Thank-you page and admin dashboard.
- Meta Pixel/CAPI, GA4/GTM and courier integrations.

Those are delivered in later Part C batches after this foundation passes on the
target machine.
