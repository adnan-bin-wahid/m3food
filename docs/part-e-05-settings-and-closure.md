# Part E-05: Store settings and closure

The protected settings page now persists the store name, IANA reporting
timezone, and optional Meta Pixel ID in Supabase. OWNER and ADMIN may write;
ORDER_MANAGER and ANALYST remain read-only. Every write is scoped to the
authenticated store and checks `settings_revision`, so an older browser tab
cannot silently overwrite newer settings.

The public catalog exposes the configured Pixel ID to the storefront. The
Meta script is not requested until the visitor accepts analytics. PageView,
ViewContent, AddToCart, InitiateCheckout, and Purchase map to Meta events;
browser deduplication is used, and Purchase carries the public order ID as its
event ID. Declining consent revokes Pixel consent and clears tracking keys.

Migration `0007` adds `meta_pixel_id` and `settings_revision` to `stores`.
The live verifier exercises a real store-scoped save, stale-write rejection,
cross-store isolation, and restoration of the original visible values.

Part E closure covers real admin authentication, dashboard analytics, order
operations, and store settings. The project-level `npm run check` executes all
Part C and Part E static checks, 78 domain tests, TypeScript, and a production
Next.js build.
