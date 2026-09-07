# Part J Manual UI Polish

This patch closes three issues found during the Part J browser smoke test.

## 1. Funnel semantics

The funnel now measures unique tracked visitors reaching each sequential stage rather than mixing visitor counts, raw event counts, and raw order counts.

Stages:

- Visitors
- Product viewers
- Cart visitors
- Checkout visitors
- Purchasers

A stage is counted only when the tracked visitor has reached the prerequisite earlier stages. The displayed conversion rate is therefore purchaser visitors divided by tracked visitors. Total order count and raw purchase-event count remain visible separately.

## 2. Order status outcome layout

Marketing Overview status outcomes now use the existing `admin-status-card` layout, separating status, order count, and amount visually.

## 3. Visitor/source stacked labels

Visitor/session, source/campaign, and source/medium cells now render their primary and secondary values on separate lines.

## Verification

- Static Part J manual-polish verifier
- Marketing analytics service tests
- TypeScript check
- Full project regression/build
- Existing Part J live DB verification, which exercises the marketing overview repository
