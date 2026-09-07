# Part O Batch 01 — Paid Ads Foundation

## Scope

This batch introduces provider-neutral paid media foundations without pretending that a live Meta or Google API sync has happened.

### Data model

- `paid_ad_accounts`
  - store scoped
  - Meta / Google provider
  - provider account ID, display name, billing currency and timezone
- `paid_ad_campaign_mappings`
  - maps one provider campaign to one canonical Campaign Registry record
  - provider campaign identity remains preserved separately from UTM identity
- `paid_ad_daily_metrics`
  - one row per store + provider campaign mapping + metric date
  - spend, impressions and clicks
  - `MANUAL` vs future `API` ingestion source
  - optimistic revision

All tables are RLS-enabled. Spend and delivery counters are constrained to non-negative values.

## Admin behavior

`/admin/marketing/ads`

- all authenticated admin roles may read
- only OWNER / ADMIN may mutate
- register Meta / Google ad accounts
- map provider campaign IDs to canonical Campaign Registry records
- manually upsert daily provider delivery metrics
- inspect spend, impressions, clicks, CTR and CPC

## Attribution boundary

Provider delivery data and first-party commerce data are intentionally kept separate in Batch 01.

- no provider-reported purchase is treated as commerce truth
- no currency conversion is guessed
- no ROAS is shown when revenue and spend have not been safely joined
- no live Meta / Google API receipt is claimed

Batch 02 will join canonical campaign mappings to first-party sessions/orders/revenue and calculate paid acquisition performance without double-counting canonical outcomes.
