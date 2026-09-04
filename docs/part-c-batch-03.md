# Part C - Batch 03: Supabase Bootstrap

This batch connects the reusable commerce core to Supabase PostgreSQL, applies
the checked-in migrations, and inserts the first M3Food store and catalog data.
It does not expose a public order endpoint or change the landing-page UI.

## Connection model

- `DATABASE_URL` is the server runtime connection. For serverless deployment,
  use the Supabase transaction pooler URL (normally port 6543).
- `MIGRATION_DATABASE_URL` is only for trusted migration and bootstrap scripts.
  Use the direct connection or the session pooler (normally port 5432).
- Both values are server-only secrets in `.env.local`; neither uses the
  `NEXT_PUBLIC_` prefix or enters Git history.
- Prepared statements are disabled for transaction-pooler compatibility.

## Applied to Supabase

- All existing Drizzle migrations.
- Row Level Security enabled on all 13 public commerce tables. No browser/anon
  policies are added, so catalog and customer/order data remain blocked through
  the Supabase Data API until an explicit API design is implemented.
- An idempotent M3Food store/product/variant/inventory seed.
- Read-back verification of catalog values and the RLS flag on every table.

## Reuse for another product

Create another validated JSON file in `config/stores/` and run the generic
bootstrap script with `--config <file>`. Core database code contains no M3Food
product, price, domain, or SKU literals. Existing unrelated records are not
deleted by the seed.

## Local commands

```powershell
npm run db:bootstrap:m3food
npm run db:verify:m3food
npm run db:studio
```

Drizzle Studio provides a table/row view when a trusted migration connection is
available. Supabase Table Editor can also visualize the same live data.

## Intentionally deferred

- Public order and analytics endpoints, rate limiting, and request validation.
- Landing form integration and a thank-you/order-status experience.
- Admin authentication and store-scoped RLS policies.
- Deployment environment variables and production rollout.
