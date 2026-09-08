# Part P Batch 01 — Scheduled Paid Ads Sync Engine

## Goal

Turn the Part O provider-neutral paid ads sync foundation into a production-schedulable daily workflow with database-backed run history and duplicate-run protection.

## Schedule

The included Vercel Cron configuration calls:

`GET /api/internal/paid-ads/sync`

once per day at `00:05 UTC`.

The endpoint requires the server-only `CRON_SECRET` through an exact Bearer Authorization header.

The scheduled workflow is safe across provider-account timezones because each account computes its own local calendar date. The sync window always ends on the **previous provider-local date**, never on a partially completed current date.

## Account scheduling state

Part P Batch 01 adds:

- `paid_ad_accounts.sync_enabled`
- `paid_ad_accounts.sync_lookback_days`

Defaults:

- scheduled sync disabled
- lookback = 3 days

No existing account begins making external API calls merely because the migration is applied.

Admin controls for these scheduling fields are intentionally deferred to Part P Batch 02. Batch 01 builds the engine and audit substrate first.

## Run history

`paid_ad_sync_runs` records one scheduled attempt with:

- store
- account
- provider
- unique schedule key
- requested date window
- RUNNING / SUCCEEDED / FAILED status
- rows fetched
- rows written
- unmapped rows skipped
- bounded failure code/message
- start/completion timestamps

The unique schedule key prevents the same account from being scheduled twice for the same provider-local day.

## Provider truth boundary

The scheduler reuses the Part O Batch 03 sync service. Only provider delivery evidence is imported:

- spend
- impressions
- clicks

Provider conversions, purchases, revenue and ROAS are still excluded from first-party commerce truth.

## System actor

Scheduled delivery writes reuse the existing paid-delivery audit fields with the reserved internal actor snapshot:

- UUID `00000000-0000-4000-8000-000000000001`
- email `paid-ads-scheduler@system.internal`

This is an explicit internal system identity, not a real admin user.

## Failure behavior

One account failing does not stop later scheduled accounts.

A failed provider call is stored in run history. The provider error is bounded before persistence. Provider secrets are never written to the run table.

## Deployment boundary

Code/tests can verify the scheduler architecture and authorization contract without real Meta/Google credentials.

A real external provider receipt must not be claimed until real provider credentials are configured and a production or controlled live sync succeeds.
