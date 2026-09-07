# Reusable Landing Frontend Contract

A client landing page may use any visual design, section order, copy, media, animation, or component structure. It must preserve the following backend/tracking contract.

## 1. Store identity

Never hardcode a client store slug inside shared runtime logic.

The public frontend resolves:

```text
NEXT_PUBLIC_STORE_SLUG
```

and backend/bootstrap uses:

```text
DEFAULT_STORE_SLUG
```

For the current single-client deployment model, both values must match the store config slug.

## 2. Catalog is backend-owned

Product identity, variant identity, SKU, selling price, compare-at price and stock state must come from:

```text
/api/v1/stores/[storeSlug]/catalog
```

Do not make a visual hardcoded price become the checkout source of truth.

## 3. Trackable sections

Every meaningful landing-page section should expose a stable unique `id`.

Examples:

```html
<section id="hero">
<section id="benefits">
<section id="reviews">
<section id="offer">
<section id="order">
```

The wording/design may change. Avoid renaming IDs merely for cosmetic revisions because historical section-reach comparisons depend on stable identities.

## 4. Trackable CTA contract

Every important conversion-oriented button/link must expose:

```html
data-track-cta="stable_machine_key"
data-track-label="Human readable label"
```

Examples:

```html
<a
  href="#order"
  data-track-cta="hero_order"
  data-track-label="Order Now"
>
  Order Now
</a>
```

```html
<a
  href="https://wa.me/..."
  data-track-cta="floating_whatsapp"
  data-track-label="WhatsApp"
>
  WhatsApp
</a>
```

`data-track-cta` is analytics identity, not CSS identity. Keep it stable across redesigns when the business action is still the same.

## 5. Commerce funnel events

The frontend must preserve the existing business-event flow where applicable:

```text
PAGE_VIEW
VIEW_CONTENT
ADD_TO_CART
BEGIN_CHECKOUT
PURCHASE
```

Interaction tracking remains separate:

```text
SESSION_START
SECTION_VIEW
CTA_VIEW
CTA_CLICK
SCROLL_DEPTH
WHATSAPP_CLICK
MESSENGER_CLICK
```

## 6. Order form contract

A replacement order UI must still supply the checkout service with the required customer/shipping/business fields used by the current order API.

Current M3Food form names include:

```text
name
phone
email
address
district
privacyAcknowledged
emailMarketingConsent
smsMarketingConsent
whatsappMarketingConsent
```

A future UI may rename internal component state, but the final API payload must preserve the order API contract.

## 7. Attribution

Do not strip campaign/query attribution before the tracker can capture it.

Preserve support for:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
fbclid
gclid
referrer
visitorKey
sessionKey
```

## 8. Privacy and PII

Never put customer name, phone, email, address, CV/file metadata, or other sensitive field values into generic analytics event metadata.

Third-party session-replay masking and consent behavior must remain intact unless the privacy architecture is deliberately changed and reverified.

## 9. Frontend handoff gate

Before a new client frontend is accepted:

- public catalog loads for the configured store;
- section IDs are stable;
- important CTAs have stable tracking keys/labels;
- order/checkout still works;
- attribution is preserved;
- analytics contains no form-field PII;
- `npm run check` passes.
