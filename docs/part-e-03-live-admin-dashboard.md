# Part E-03 — Live Admin Dashboard

This batch replaces the authenticated dashboard placeholder with live,
store-scoped Supabase aggregates. The Server Component reads the database
directly after `requireCurrentAdmin()` resolves the active admin and store.

## Visible metrics

- Rolling 7, 30, 90 day and all-time windows.
- Tracked visitors, page views, product views, orders, conversion rate, and
  gross order value.
- First-party activity funnel from visitor to order.
- All seven order statuses with count and value.
- Meta, Organic, and Other channel totals plus exact stored order sources.
- Eight most recent orders for the selected window.

Gross order value excludes cancelled and returned orders. Visitors and browser
events reflect explicit analytics consent; orders remain necessary commerce
records and can therefore produce a conversion rate above 100% in sparse or
test data.

## Security and architecture

- No public dashboard API is introduced.
- Every query is constrained by the authenticated `admin.storeId`.
- Credentials and database access remain server-only.
- Loading, empty, database-error, mobile, and narrow-screen states are included.

## Verification

`npm run check` executes the static E-03 verifier, dashboard domain tests,
TypeScript, and the production build. `npm run db:verify:admin-dashboard`
queries live Supabase and reconciles order totals across status, source, and
channel aggregates without printing customer information.
