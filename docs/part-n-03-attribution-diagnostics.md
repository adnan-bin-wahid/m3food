# Part N Batch 03 — Attribution Diagnostics + Campaign Drill-down

## Goal

Make Part N operational before paid-ad provider data is introduced.

## Added

- 7d / 30d / 90d / all-time campaign performance windows;
- campaign drill-down route at `/admin/marketing/campaigns/[campaignId]`;
- first-touch versus last-touch order evidence;
- lifecycle reach using immutable order status history;
- unresolved raw `utm_campaign` diagnostics with a canonical-key suggestion;
- explicit separation between placed revenue and future spend/ROAS metrics.

## Attribution semantics

- first touch = earliest recorded visitor session;
- last touch = latest recorded visitor session before the order;
- direct sessions remain real touches;
- raw UTM evidence remains intact;
- unknown campaign strings are diagnostic only and never auto-create registry records.

## Lifecycle semantics

`Reached confirmed` and `Reached delivered` use `order_status_history`, not only current order status. An order that later changes status still retains evidence that it reached the earlier lifecycle stage.

## Scope boundary

This batch does not add ad spend, impressions, clicks, CPA, CAC or ROAS. Those belong to Part O Paid Ads Intelligence.

## Database

No migration is introduced by Batch 03. It depends on Batch 02 migration `0014_*` being applied before live use.
