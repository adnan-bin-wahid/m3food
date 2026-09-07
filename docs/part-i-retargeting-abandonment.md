# Part I — Retargeting & Abandonment Engine

Part I aligns the landing-commerce build with the Part C minimum client package: a merchant must be able to identify high-intent visitors who did not purchase and use the same event rules for Meta retargeting.

## Fixed audiences

- **Cart abandoners** — latest `ADD_TO_CART` in the selected lookback, with no later `PURCHASE` for that visitor.
- **Checkout abandoners** — latest `BEGIN_CHECKOUT`, with no later `PURCHASE`.
- **Viewed, no purchase** — latest `VIEW_CONTENT`, with no later `PURCHASE`.

Each audience supports **7, 14, and 30 day** lookbacks. A visitor/session must be inactive for at least 30 minutes before it is treated as abandoned. This avoids counting a visitor who is still actively shopping.

## Purchase exclusion

Purchase exclusion is enforced server-side in the first-party audience query. A qualifying visitor is removed whenever a later `PURCHASE` exists. This is the minimum guard needed to avoid continuing an abandonment campaign after conversion.

## Admin UI

`/admin/marketing/retargeting` provides:

- audience tabs and lookback windows;
- unique eligible visitor count;
- latest qualifying potential value;
- acquisition-source summary;
- anonymous visitor/session preview;
- exact Meta Website Custom Audience rule guidance;
- current Meta Pixel configuration status.

The UI deliberately does not expose personal identity for anonymous visitors.

## Meta boundary

Part I makes retargeting **audience-ready** using the same browser events already delivered by Part H. It does not create or mutate a Meta Ads Custom Audience through the Marketing API. For the minimum landing-client package, the merchant can create the corresponding Website Custom Audience in Meta Ads Manager using the displayed rule and the configured Pixel. Direct Ads API audience creation/synchronization belongs to the later full marketing connector layer.

## Verification

- static Part I verifier;
- domain tests for bounded audience/window parsing and summary calculations;
- live DB verifier for store isolation, inactivity cutoff, and purchase exclusion;
- full project regression, typecheck, and production build before commit.
