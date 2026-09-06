# Part F — Admin Catalog Management

Part F converts the Part E admin panel into a complete store-scoped catalog operations surface.

## Delivered surface

- `/admin/catalog` catalog overview with product, variant, pricing, and sellable-stock summaries.
- Draft product creation.
- `/admin/catalog/[productId]` product management page.
- Product name, slug, description, and publishing status editing.
- Variant creation and editing for SKU, label, selling price, compare-at price, and active state.
- Explicit default-variant selection.
- Inventory tracking enable/disable and available-stock management.
- Recent catalog audit trail with immutable before/after snapshots and admin identity.

## Authorization

| Role | Read catalog | Manage products | Manage variants/prices | Manage inventory |
| --- | --- | --- | --- | --- |
| OWNER | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes |
| ORDER_MANAGER | Yes | No | No | No |
| ANALYST | Yes | No | No | No |

All repository reads and mutations are scoped by authenticated `storeId`.

## Data integrity rules

- Products are not hard-deleted. Use `ARCHIVED` to preserve order/history references.
- Variants are not hard-deleted. Use inactive state to preserve historical references.
- Product slugs remain unique per store.
- Variant SKUs remain unique per store.
- Compare-at price cannot be lower than selling price.
- An `ACTIVE` product must have an active default variant.
- A current default active variant cannot be deactivated until another active variant is made default.
- A default target must be active.
- Untracked inventory stores zero available units.
- Stock tracking cannot be disabled while units are reserved by open orders.
- Tracked available stock cannot be set below reserved stock.

## Concurrency model

Part F adds integer revision counters to `products`, `product_variants`, and `inventory`. Every admin mutation checks the revision it originally rendered and increments it atomically. A stale browser tab therefore fails closed instead of silently overwriting a newer change.

Checkout reservation and admin order fulfilment/release/restock operations also increment inventory revision. This prevents an admin inventory form from overwriting stock changes that occurred through the order lifecycle after the page loaded.

## Audit trail

`catalog_change_history` records product, variant, default-selection, and inventory mutations with:

- store, product, and variant scope;
- action name;
- immutable admin user ID/email snapshot;
- before state;
- after state;
- timestamp.

The table has RLS enabled and is read through the server-side store-scoped admin repository.

## Database migration

`drizzle/0008_catalog_admin_management.sql` adds revision columns and `catalog_change_history`. The migration is registered in the Drizzle journal and has a matching snapshot.

## Verification

Part F is included in the normal project regression chain through `npm run verify:part-f`, `npm run test:domain`, TypeScript checking, and the production Next.js build. After migration, `npm run db:verify:admin-catalog` confirms the live revision-aware catalog read model and audit table.

Part F is complete when the full project check and live catalog verification pass on the migrated database.
