# Part O Batch 03 — Provider Sync Foundation

## Goal

Add a provider-neutral, on-demand sync path for Meta Ads and Google Ads delivery metrics while keeping first-party commerce as the only conversion source of truth.

## Imported provider data

Only delivery evidence is imported:

- metric date
- spend
- impressions
- clicks

Provider conversions, purchases, revenue and ROAS are intentionally not imported as commerce truth.

## Meta

The Meta adapter uses the Graph Ads Insights endpoint at campaign level with daily time increments and limits the query to provider campaign IDs already mapped to the internal Campaign Registry.

Credentials stay server-only:

- `META_ADS_ACCESS_TOKEN`
- `META_ADS_API_VERSION`

The Meta CAPI credentials remain separate because sending conversion events and reading ad delivery are different permissions/workflows.

## Google Ads

The Google adapter:

1. exchanges a server-only OAuth refresh token for an access token,
2. runs a GAQL `searchStream` request for mapped campaign IDs,
3. reads `segments.date`, `metrics.cost_micros`, `metrics.impressions`, and `metrics.clicks`.

Credentials stay server-only:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_API_VERSION`
- optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

## Persistence semantics

The existing `paid_ad_daily_metrics` unique grain remains:

`store + mapping + metric_date`

API sync upserts that row and sets `ingestion_source = API`. Re-syncing the same date increments `revision`.

An API sync intentionally replaces a manual fallback row for the same provider mapping/date because provider delivery becomes authoritative once the provider API is connected.

## Safety boundaries

- OWNER / ADMIN only
- account must belong to the authenticated store
- account and mapping must be active
- mapping must still resolve to a canonical Campaign Registry row
- one sync request is capped at 31 calendar days
- unknown/unmapped provider campaigns are not auto-created or auto-mapped
- duplicate provider campaign/day rows fail closed
- provider secrets never enter client components or the database
- no scheduled/background sync in this batch
- no provider conversion data becomes first-party order truth

## Database

No new migration is introduced in Batch 03. It reuses the Part O Batch 01 delivery tables and the Part O Batch 02 acquisition report.
