# Part J — Part C Minimum Package Closure

Part J closes the remaining production-minimum gaps for a landing-page client that needs ads, first-party attribution, retargeting, order operations, consent handling, a useful marketing view, and a Steadfast handoff.

## Delivered surface

- `/admin/marketing` — store-scoped overview for visitors, ViewContent, AddToCart, InitiateCheckout, orders, conversion, delivered revenue, recoverable checkout contacts, channel/source performance, and order-status outcomes.
- `/admin/marketing/visitors` — anonymous visitor/session journeys with source, campaign, funnel counts, orders, and revenue.
- `/admin/marketing/funnel` — first-party visitor → product view → cart → checkout → order conversion.
- `/admin/marketing/sources` — UTM/click-ID acquisition performance connected to sessions and orders.
- `/admin/marketing/retargeting` remains the Part I cart/checkout/viewed-no-purchase audience engine and is now inside the Marketing navigation group.
- Order detail exposes source, medium, campaign, content, term, referrer, landing page, fbclid, gclid, visitor key, and session key.

## Checkout recovery and preferences

The landing checkout captures abandoned-checkout contact only when the customer has acknowledged the privacy policy **and** selected a matching optional marketing channel. Anonymous funnel tracking remains available through the existing consented analytics path, so no recovery PII is persisted when all optional marketing channels are off.

A signed self-service `/preferences/<token>` link is returned after a successful order. Email, SMS, and WhatsApp preferences can be changed independently; unticking all channels unsubscribes from all optional marketing communication. Customer CRM audience/export logic uses the self-service preference override ahead of the latest order consent, so an unsubscribe affects future audience selection.

`MARKETING_PREFERENCE_SECRET` is an optional dedicated HMAC secret. Existing deployments remain compatible by falling back to the server-only `RATE_LIMIT_SALT`; production deployments should configure a stable dedicated value before rotating the rate-limit salt.

## Steadfast minimum fulfillment

Server-only environment variables:

- `STEADFAST_BASE_URL` (defaults to `https://portal.packzy.com/api/v1`)
- `STEADFAST_API_KEY`
- `STEADFAST_SECRET_KEY`

OWNER, ADMIN, and ORDER_MANAGER can submit only `CONFIRMED` or `PROCESSING` BDT orders. The adapter stores a local shipment state, consignment ID, tracking code, provider status, sanitized failure reason, and raw provider response. A conditional database claim prevents a fresh concurrent submission from calling Steadfast twice; failed or stale pending claims can be retried. Credentials are never returned to the browser or stored in store settings.

A real Steadfast API receipt cannot be verified without merchant credentials. The automated suite verifies payload shape, credential gating, response parsing, local submission state, concurrency/idempotency, and database persistence. After credentials are configured, perform one manual courier smoke test with a non-customer test order before launch.

## Database migration 0011

Adds RLS-enabled tables:

- `checkout_intents`
- `customer_marketing_preferences`
- `fulfillment_shipments`

No existing Part C–I table is dropped or destructively rewritten.

## Part C minimum checklist

| Requirement | Closure |
| --- | --- |
| Landing page + guest checkout | Existing Part C, reverified by full regression |
| Order backend + order status | Existing Part C/E |
| First-party visitor/session + events | Existing Part C |
| UTM, referrer, fbclid/gclid attribution | Existing Part C + Part J admin visibility |
| Meta Pixel + Meta CAPI | Part H |
| GA4 + GTM | Part H |
| ViewContent / AddToCart / InitiateCheckout / Purchase | Part H |
| Retargeting + purchase exclusion | Part I |
| Simple client marketing dashboard | Part J |
| Checkout abandonment recovery foundation | Part J |
| Email/SMS/WhatsApp preference + unsubscribe | Part J |
| Steadfast submission + tracking identifiers | Part J |
| End-to-end automated closure | `verify:part-j`, domain tests, typecheck, build, migration, `db:verify:part-j` |

## Out of scope after Part C minimum

Pathao/RedX and additional courier adapters, bKash/Nagad/SSLCommerz, automatic Meta Ads/Google audience API sync, automation workflows, accounting, POS, and advanced SaaS billing remain later Effy Market layers.
