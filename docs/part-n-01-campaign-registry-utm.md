# Part N Batch 01 — Campaign Registry + UTM Builder

## Goal

Create the canonical campaign layer before paid-ad provider sync.

This batch adds:

- store-scoped Campaign Registry;
- stable normalized `utm_campaign` key;
- source / medium / content / term defaults;
- optional landing URL and notes;
- lifecycle: Draft → Active / Paused / Archived;
- Owner/Admin mutation boundary;
- optimistic revision on status writes;
- admin Campaign Manager;
- UTM Builder;
- deterministic first-touch / last-touch resolver as a tested domain primitive.

## Why the registry comes first

Raw UTM strings are useful but not enough for operating paid acquisition. A canonical campaign record lets later batches map:

```text
Meta campaign / Google campaign
        ↓
Effy campaign
        ↓
visitor sessions
        ↓
orders
        ↓
revenue / delivery / profit
```

The canonical `campaignKey` is the exact normalized value expected in `utm_campaign`.

## Batch boundary

Batch 01 does **not** yet rewrite historical sessions or order attribution rows.

Part N Batch 02 will:

- resolve registered campaign IDs from session UTM data;
- persist first-touch and last-touch campaign attribution on orders;
- expose campaign performance reporting;
- keep unknown/unregistered UTM campaigns visible without silently inventing registry records.

## Security

- Campaign tables use RLS.
- OWNER / ADMIN may create or change status.
- ANALYST / ORDER_MANAGER receive read-only campaign visibility.
- Public tracking endpoints cannot create or mutate Campaign Registry rows.
