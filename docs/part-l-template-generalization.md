# Part L — Template Generalization

## Goal

Turn the existing M3Food repository into a reusable **single-client growth-commerce template** without discarding the proven M3Food storefront or rewriting the existing backend.

The repository remains the same. M3Food becomes the reference/demo implementation.

## What Part L changes

- The public landing page no longer hardcodes `m3food` as its runtime store identity.
- `NEXT_PUBLIC_STORE_SLUG` selects the public storefront.
- `DEFAULT_STORE_SLUG` remains the server/bootstrap store identity.
- A single-client deployment requires those values to match.
- Generic `db:bootstrap` and `db:verify:store` scripts are available for any store config.
- `verify:client-config` checks env/config identity before database work.
- `config/stores/client-template.json` provides a fail-closed neutral starting config.
- Shared runtime code is statically checked for reintroduced M3Food store-identity hardcoding.
- Store slug validation is aligned with the database's 120-character limit.
- A frontend integration/tracking contract documents what a future UI engineer must preserve.

## What Part L intentionally does not change

- M3Food visual design, copy, media and demo sections.
- Existing database schema/data.
- Existing admin, order, CRM, marketing, retargeting, fulfillment, Meta/Google/Clarity integrations.
- Existing M3Food bootstrap aliases.
- Consent/tracking semantics. Those are handled in Part M.

## New-client pattern

```text
Existing repository / future fork
        ↓
client-specific .env
        ↓
client-specific store config
        ↓
new Supabase database
        ↓
bootstrap + verify
        ↓
client frontend following tracking contract
        ↓
integration IDs / provider credentials
        ↓
full check
        ↓
deploy
```

## Safety properties

The neutral client template uses:

- store `INACTIVE`
- placeholder product `DRAFT`

so copying the template cannot accidentally expose a purchasable placeholder catalog before configuration.
