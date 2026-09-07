# Part C - Batch 04: Secure Commerce API

This batch exposes the reusable catalog and transactional order core through
versioned Next.js Route Handlers. The current landing form is not connected yet.

## Endpoints

- `GET /api/v1/stores/:storeSlug/catalog` returns only active public catalog
  data and safe variant identifiers/prices.
- `POST /api/v1/orders` validates and creates a landing order. It requires an
  `Idempotency-Key` header and returns only the public order ID, status, amount,
  currency, creation time, and whether this request created the record.

## Request protection

- JSON-only requests with a hard 16 KiB body limit.
- Zod validation before persistence.
- Ten order attempts per store/client key in a ten-minute window.
- Persistent PostgreSQL rate limits work across serverless instances.
- Rate-limit windows use PostgreSQL server timestamps, avoiding runtime locale
  parsing and application-clock differences.
- Client identifiers are HMAC-SHA256 hashed with `RATE_LIMIT_SALT`; raw IP
  values are not stored in the rate-limit table.
- Unexpected failures return a request ID without database/internal details.
- All 14 public tables have RLS enabled; the trusted server connection remains
  the only data path until explicit browser policies are designed.

## Runtime verification

`npm run db:verify:api` uses the runtime transaction-pooler connection to read
the active catalog and perform a temporary rate-limit write. Its verification
record is deleted immediately afterward.

## Deployment note

`x-vercel-forwarded-for`/`x-forwarded-for` must come from a trusted deployment
proxy. A self-hosted deployment must overwrite untrusted forwarding headers.

## Intentionally deferred

- Connecting the current landing form and client attribution collector.
- Thank-you/order confirmation UI.
- Admin authentication and order-management endpoints.
- Deployment, monitoring, courier, Meta CAPI, and GA4 integrations.
