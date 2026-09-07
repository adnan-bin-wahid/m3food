# Effy Growth Commerce Template

This repository now serves two purposes:

1. **M3Food reference storefront** — the current landing-page design/content remains as a working demo.
2. **Reusable single-client commerce + growth backend** — catalog, checkout, orders, CRM, first-party analytics, attribution, retargeting, integrations, fulfillment, and admin operations are designed to be reused for another landing-page client.

The M3Food frontend is not the template contract. A future client frontend may be completely different as long as it follows `docs/template-frontend-contract.md`.

## Run the current demo

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Runtime store identity

A deployment has one active storefront identity:

```env
NEXT_PUBLIC_STORE_SLUG=m3food
DEFAULT_STORE_SLUG=m3food
```

These must match. `NEXT_PUBLIC_STORE_SLUG` is used by the public landing page. `DEFAULT_STORE_SLUG` is the server/bootstrap identity.

Part L removes the landing page's hardcoded `m3food` routing identity. The M3Food content itself intentionally remains as the reference UI.

## Start a new client

1. Copy `.env.example` to `.env.local`.
2. Set both store slug variables to the new client's lowercase kebab-case slug.
3. Copy `config/stores/client-template.json` to `config/stores/<client-slug>.json`.
4. Replace the placeholder store/product/catalog values.
5. Verify config/runtime identity:

```powershell
npm run verify:client-config -- --config config/stores/<client-slug>.json
```

6. Bootstrap the client's database:

```powershell
npm run db:bootstrap -- --config config/stores/<client-slug>.json
```

7. Verify the seeded store:

```powershell
npm run db:verify:store -- --config config/stores/<client-slug>.json
```

8. Bootstrap the first admin, then configure Meta Pixel, GA4, GTM, Clarity and provider credentials using the existing admin/environment workflow.
9. Build the client's landing page against `docs/template-frontend-contract.md`.
10. Run the full verification gate before deployment:

```powershell
npm run check
```

## Template rules

- One client deployment = one repo/fork + one database + one Vercel project.
- Business logic resolves stores from data/config; do not add a new hardcoded store slug to shared runtime code.
- Client-specific copy, images and layout may stay in the frontend.
- Product/catalog truth comes from the backend API.
- Tracking identities must be stable even when the visual design changes.
- Secrets remain server-only.

See:
- `docs/part-l-template-generalization.md`
- `docs/template-frontend-contract.md`
