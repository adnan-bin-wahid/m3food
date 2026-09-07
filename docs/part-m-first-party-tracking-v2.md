# Part M — First-Party Tracking V2

## Goal

Keep the Effy/M3Food admin measurement layer useful even when a visitor does not enable optional external analytics.

The system now separates:

```text
First-party privacy-reduced measurement
        ≠
Optional external analytics / advertising
```

## No-consent / “First-party only” mode

The landing page still records first-party business behaviour:

- PAGE_VIEW
- VIEW_CONTENT
- ADD_TO_CART
- BEGIN_CHECKOUT
- SESSION_START
- SECTION_VIEW
- CTA_VIEW
- CTA_CLICK
- SCROLL_DEPTH
- WHATSAPP_CLICK
- MESSENGER_CLICK

Privacy reduction in this mode:

- visitor identity is sessionStorage-only;
- session identity is sessionStorage-only;
- no durable cross-session visitor key;
- no fbclid/gclid stored in first-party event attribution or retained inside the stored landing URL;
- no user-agent, hashed-IP or client-IP analytics context persisted;
- no form field values/PII are added to interaction analytics;
- Meta Pixel, GA4/GTM, Clarity and Meta CAPI remain disabled.

UTM source/medium/campaign, landing page and referrer remain available so acquisition and landing performance are still measurable.

## Consented optional analytics mode

When optional analytics is accepted:

- durable pseudonymous visitor identity becomes available;
- consented session identity is separate from the prior anonymous session;
- fbclid/gclid attribution is allowed;
- Meta Pixel may load;
- GA4/GTM may load;
- Clarity may load;
- Meta CAPI may send;
- existing provider consent checks remain intact.

Anonymous history is not silently merged into the durable consented identity.

## Order attribution

Orders always receive a first-party attribution context.

Without optional analytics, the order can still be joined to the current anonymous landing session. With optional analytics, the order uses the consented durable tracking identity.

## Database

No migration is required. Existing visitor/session/event tables already support the required records and the existing event payload records the analyticsAllowed state.

## Policy version

Part M increments the privacy policy version so a previously stored external-analytics preference is re-evaluated under the new split architecture.
