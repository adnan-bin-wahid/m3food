# Part H — Minimum marketing integration foundation

Part H realigns the build to the PDF Part C minimum landing-page growth package. It closes the external tracking foundation before promotions or broader commerce features.

## Delivered

- Store-scoped GA4 Measurement ID and GTM Container ID settings.
- Consent-gated GA4 loader with recommended `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` events.
- Consent-gated GTM loader with normalized `effy_*` dataLayer commerce events.
- Meta Pixel remains consent-gated.
- Browser commerce events now use an explicit shared event ID. The same ID is sent to Meta Pixel and the first-party event API.
- Server-side Meta CAPI forwards browser commerce events using that shared event ID, enabling browser/server deduplication.
- Purchase uses the public order ID as both browser Pixel event ID and server CAPI event ID.
- CAPI identity fields are normalized and SHA-256 hashed where Meta expects hashed customer data. Raw IP is used transiently for delivery when available and is not persisted by this feature.
- CAPI secrets remain server-only via `META_CAPI_ACCESS_TOKEN`; no token is exposed in admin or catalog responses.
- Meta CAPI is non-blocking for commerce: missing credentials or an external delivery failure never invalidates a recorded first-party event or a successfully created order.

## Deployment configuration

Admin Settings:
- Meta Pixel ID
- GA4 Measurement ID (`G-...`)
- GTM Container ID (`GTM-...`)

Server-only environment:
- `META_CAPI_ACCESS_TOKEN`
- `META_GRAPH_API_VERSION` (set to a currently supported Meta Graph API version for the deployment)
- optional `META_CAPI_TEST_EVENT_CODE` while validating Events Manager delivery

## Deliberate boundaries

This part does **not** build retargeting audience rules, abandonment windows, or audience sync. Those belong to Part I. It also does not make a live call to Meta during automated local verification because production credentials are deployment-specific.
