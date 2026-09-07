# Part K — Visitor Intelligence & Microsoft Clarity

Part K extends the completed Part C minimum package with a consent-gated visitor-behaviour layer. It keeps Effy first-party analytics as the business source of truth and adds Microsoft Clarity as the optional visual replay/heatmap layer.

## First-party interaction taxonomy

The landing page records these events only after explicit analytics consent:

- `SESSION_START`
- `SECTION_VIEW`
- `CTA_VIEW`
- `CTA_CLICK`
- `SCROLL_DEPTH` at 25/50/75/90/100%
- `WHATSAPP_CLICK`
- `MESSENGER_CLICK`

Each CTA has a stable `elementKey`, an optional human label, its section, and target URL. CTA clicks force a CTA view first when the observer did not run, so CTR has a valid impression denominator.

## CTA performance

`/admin/marketing/interactions` shows:

- interaction event volume
- unique CTA views by session
- unique CTA clicks by session
- CTA CTR = unique clicked sessions / unique viewed sessions
- raw CTA clicks
- CTA-attributed orders and revenue using the latest CTA click in the same session before the order
- section reach
- scroll depth reach

Orders and revenue remain transactional business metrics; Clarity is never used as their source of truth.

## Visitor journey

`/admin/marketing/visitors/[sessionKey]` presents a chronological anonymous session timeline combining:

- session start
- section/CTA/scroll interactions
- commerce events
- order creation
- later order-status history

The page also shows first/last session times, source/medium/campaign, landing page and referrer. Personal contact data is intentionally not exposed in this visitor view.

## Microsoft Clarity

A store can save a public Microsoft Clarity Project ID in Settings. Clarity is not loaded before analytics consent. After consent, the client:

1. loads the configured Clarity tag,
2. sends ConsentV2 with analytics storage granted and ad storage denied,
3. calls Clarity Identify with Effy's anonymous visitor ID and session ID,
4. sends interaction names as Clarity custom events,
5. revokes analytics consent when the Effy preference is declined.

The order form is marked with `data-clarity-mask="true"`. Effy does not send customer phone/email as Clarity custom identifiers.

## Database

Migration `0012_visitor_intelligence_clarity.sql`:

- adds `stores.clarity_project_id`,
- creates `visitor_interaction_event_name`,
- creates RLS-protected `visitor_interaction_events`,
- adds unique/idempotency and analytics indexes.

## Verification

Part K closes only when all of these pass in the real repository:

- `npm run verify:part-k`
- targeted Part K tests
- `npm run typecheck`
- `npm run check`
- `npm run db:migrate`
- `npm run db:verify:part-k`
- `npm run db:verify:admin-settings`
- Part J and Part I live regression verifiers

A real Clarity recording cannot be verified without a real Microsoft Clarity Project ID and live browser traffic. Manual smoke testing should confirm pre-consent blocking, post-consent tag loading, first-party CTA/scroll metrics, and session correlation in Clarity.
