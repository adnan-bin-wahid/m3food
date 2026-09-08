# Part P Batch 02 — Admin Scheduling Controls + Sync Health

## Goal

Expose the Part P Batch 01 scheduler state and run history to authenticated admins without changing the provider truth boundary or creating another migration.

## Scheduling controls

OWNER and ADMIN can configure each active paid ad account with:

- scheduled sync enabled / disabled
- lookback window from 1 through 31 days
- optimistic account revision protection

Inactive accounts fail closed and cannot be newly scheduled through the admin control.

The scheduler still ends each run on the previous provider-account local date, so partially completed provider days are not imported.

## Sync health

The Paid Ads admin page shows:

- whether scheduling is enabled for each account
- configured lookback days
- account timezone
- latest run status
- recent scheduled run history
- requested date window
- rows fetched / written / skipped
- bounded failure code/message
- start/completion timestamps

Run history is operational evidence only. It does not make provider conversions or provider revenue authoritative.

## No new migration

Part P Batch 02 reuses:

- `paid_ad_accounts.sync_enabled`
- `paid_ad_accounts.sync_lookback_days`
- `paid_ad_sync_runs`

from migration 0016.

No 0017 migration is introduced by this batch.

## Production boundary

A configured schedule is not evidence that Vercel Cron has actually executed in production. Production cron execution remains unverified until a deployed cron invocation creates observable run history.

Real Meta/Google provider receipt also remains unverified until real provider credentials are configured and a provider sync succeeds.
