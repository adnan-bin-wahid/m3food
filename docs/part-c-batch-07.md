# Part C - Batch 07: Consent and Privacy

This batch prevents the first-party funnel introduced in Batch 06 from running
before the visitor makes an explicit analytics choice.

## Visitor choice

The landing page presents two equally available paths:

- **Necessary only**: no behavioural analytics events are sent and durable
  visitor/session keys are removed. Checkout still works with ephemeral IDs so
  the transactional order graph can remain internally consistent.
- **Allow analytics**: the versioned choice is stored locally and the approved
  first-party funnel begins. Each event carries an explicit consent assertion.

The footer lets the visitor reopen the preference prompt. A policy-version
change automatically makes the old choice unknown so it must be selected again.

## Order communication consent

The order form separates required order-processing acknowledgement from an
optional SMS/WhatsApp marketing choice. Each new order atomically inserts one
immutable `order_consents` record with:

- privacy-policy version;
- analytics choice;
- email marketing choice;
- SMS marketing choice;
- WhatsApp marketing choice; and
- the same authoritative timestamp used to create the order.

The new table is protected by RLS. Existing orders remain valid; consent is not
backfilled or inferred for historical rows.

## Privacy page

`/privacy` explains required order data, optional analytics, pseudonymous
identity, hashed IP storage, marketing communication, third-party delivery and
how a visitor can change their preference.

## Live verification

`npm run db:verify:consent-flow` creates or reuses one clearly marked synthetic
order and verifies its complete consent snapshot directly in Supabase.
