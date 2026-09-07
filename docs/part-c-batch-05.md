# Part C - Batch 05: Landing Checkout Integration

This batch replaces the landing form's external redirect with the versioned
commerce APIs from Batch 04. A successful submission now persists a complete
order graph in Supabase PostgreSQL.

## Browser flow

1. The page loads the active catalog for the configured store.
2. The default variant ID and current prices come from the database response.
3. A stable visitor key is stored in `localStorage`; a tab/session key is stored
   in `sessionStorage`.
4. UTM values, `fbclid`, `gclid`, landing URL, and referrer are captured.
5. The form sends JSON to `POST /api/v1/orders` with a per-attempt
   `Idempotency-Key` header.
6. Loading, validation/failure, out-of-stock, and success states are rendered
   accessibly. A successful order shows its public order number and disables
   duplicate resubmission.

## Live verification record

`npm run db:verify:order-flow` invokes the actual catalog and order Route
Handlers, then verifies the persisted customer, visitor, session, order, item,
status-history, payment, attribution, and purchase-event graph.

The script intentionally leaves one clearly identified synthetic order so the
database flow can be inspected in Supabase Table Editor:

- Customer: `M3Food System Test`
- Phone: `+8801000000000`
- UTM source: `batch-05-verification`
- Note: `Batch 05 synthetic order - safe to delete after visual inspection`

The idempotency key is fixed, so rerunning verification reads the same order
instead of creating duplicates.

## Intentionally deferred

- A dedicated thank-you page and customer order-status lookup.
- Admin authentication, dashboard, and order status management.
- Deployment configuration, monitoring, courier, Meta CAPI, and GA4 delivery.
