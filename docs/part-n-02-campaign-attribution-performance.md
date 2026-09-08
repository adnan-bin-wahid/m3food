# Part N Batch 02 — Campaign Resolution + First/Last Touch + Performance

## Goal

Connect the Campaign Registry to first-party visitor sessions and new order attribution.

## Session resolution

When a first-party commerce, interaction or order request creates a session:

1. raw UTM fields are preserved;
2. `utm_campaign` is normalized with the same Campaign Registry normalization;
3. if a campaign key exists for the same store, `visitor_sessions.campaign_id` is set;
4. an unknown UTM campaign remains raw-only and is never auto-created.

The migration also performs a conservative lowercase/trim exact backfill for existing sessions whose raw `utm_campaign` already matches a registered campaign key.

## Order attribution

For every newly created order, all known visitor sessions up to the order timestamp are evaluated chronologically.

Stored output:

- raw first-touch snapshot;
- raw last-touch snapshot;
- `first_touch_campaign_id` when the first touch maps to a registered campaign;
- `last_touch_campaign_id` when the last touch maps to a registered campaign.

Direct sessions remain real touches. This is true first-touch / last-touch, not last-non-direct.

Historical order rows created before Batch 02 are not silently rewritten as true multi-session attribution because the earlier stored snapshots may not contain enough evidence to reconstruct that history safely.

## Campaign performance

Campaign Manager now reports:

- sessions;
- unique visitors;
- first-touch orders;
- last-touch orders;
- last-touch CVR;
- placed revenue attributed by last touch.

`Placed revenue` is the order value at placement time. Delivered revenue / delivered ROAS remain later growth-economics/dashboard work.

## Data contract

Raw UTM evidence remains intact even when a canonical campaign ID resolves. Unknown campaign strings are not converted into fake registry records.
