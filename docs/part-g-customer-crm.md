# Part G — Customer CRM and Consent-Aware Marketing Audience

Part G adds a protected customer operations layer on top of the order and catalog system.

## Admin surfaces

- `/admin/customers` provides store-scoped search by name, phone, or email; pagination; New, Repeat, and High-value segments; marketing-consent filters; and customer KPIs.
- `/admin/customers/[customerId]` provides contact details, lifetime order metrics, linked order history, acquisition-source counts, current tags, append-only internal notes, and CRM activity.
- The Customers navigation item is available in the shared admin shell.

High-value currently means at least BDT 5,000 (`500000` minor units) in delivered-order lifetime value. Delivered value, rather than placed value, is used so cancelled or returned demand does not inflate the segment.

## Consent model

Marketing permission is not editable by admins. The current Email, SMS, and WhatsApp state is derived from the most recently captured `order_consents` snapshot for that customer, ordered by `captured_at`. A later decline therefore supersedes an older allow for audience selection.

OWNER and ADMIN accounts may export Email, SMS, or WhatsApp CSV audiences. ORDER_MANAGER and ANALYST accounts cannot export PII audiences. Export rows are included only when the latest captured consent explicitly allows the requested channel and the required contact value exists. CSV responses are private/no-store and protect cells against spreadsheet formula injection.

## CRM operations

OWNER, ADMIN, and ORDER_MANAGER may add tags and append internal notes. ANALYST remains read-only.

- Tags are whitespace-normalized, lower-cased, bounded to 40 characters, and unique per customer/store.
- Notes are append-only and bounded to 1,000 characters.
- `customer_activity_history` records tag additions, tag removals, and note additions with immutable admin identity and timestamp.
- Customer/order records are never deleted by the CRM UI.

## Database

Migration `0009_customer_crm.sql` adds:

- `customer_notes`
- `customer_tags`
- `customer_activity_history`

All three tables are store/customer scoped, foreign-key constrained, indexed, and have PostgreSQL RLS enabled.

## Verification

`npm run check` includes `verify:part-g`, all domain tests, TypeScript, and the production Next.js build. After migration, `npm run db:verify:admin-customers` creates a temporary customer, exercises tags/notes/activity, verifies cross-store isolation and no implicit marketing consent, then deletes the temporary record.

Part G is complete only after the full project check and live customer CRM verification pass.
