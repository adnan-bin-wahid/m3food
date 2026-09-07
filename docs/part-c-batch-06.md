# Part C - Batch 06: First-Party Commerce Events

This batch activates the reusable visitor, session, and commerce-event schema
that was introduced in the backend foundation.

## Public event flow

`POST /api/v1/events` accepts only these browser-originated events:

- `PAGE_VIEW`
- `VIEW_CONTENT`
- `ADD_TO_CART`
- `BEGIN_CHECKOUT`

`PURCHASE` is deliberately excluded from the public contract. A purchase event
is written only by the transactional order service after an order is actually
persisted.

Every accepted event is:

- validated with a bounded 8 KiB JSON body;
- protected by persistent HMAC-keyed rate limiting;
- attached to an active store and, when relevant, an active product/variant;
- linked to idempotently upserted visitor and session records;
- assigned the server's authoritative time and database product value;
- deduplicated by the store-scoped event ID; and
- stored with first-party campaign attribution and hashed client IP.

## Landing instrumentation

The landing page now emits `PAGE_VIEW` and `VIEW_CONTENT` after load, records
`ADD_TO_CART` when an order CTA or quantity control shows product intent, and
records `BEGIN_CHECKOUT` on the first form interaction/submission. Tracking
failures never block catalog loading or checkout.

## Live verification

`npm run db:verify:event-flow` invokes the real Route Handler and retains four
fixed, idempotent system-test events using attribution source
`batch-06-verification`. They can be inspected in Supabase Table Editor under
`commerce_events`, `visitors`, and `visitor_sessions`.

Consent gating and external Meta/GA/GTM delivery remain separate batches so
the collection contract can be verified independently before third-party tags
are enabled.
