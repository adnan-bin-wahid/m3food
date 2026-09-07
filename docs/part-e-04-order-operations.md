# Part E-04 — Admin Order Operations

This batch turns the protected Orders area into a live operational workflow.
All reads and writes are scoped to the store on the verified admin session.

## Admin experience

- Search by order ID, customer name, or phone.
- Filter by lifecycle status and browse bounded 20-row pages.
- Inspect immutable item snapshots, totals, customer and delivery data,
  payment, attribution, consent, and full status history.
- OWNER, ADMIN, and ORDER_MANAGER accounts can choose only valid forward
  transitions. ANALYST accounts remain read-only.
- Status forms report pending, success, conflict, and failure states without
  exposing internal database details.

## Transaction and inventory-safe guarantees

Each mutation locks the store-scoped order row and performs the inventory
effect, order update, and audit insert in one database transaction. A stale
screen or inventory mismatch fails closed and rolls back the whole mutation.

- CANCELLED releases reserved tracked inventory.
- SHIPPED reduces both available and reserved tracked inventory.
- RETURNED restores available tracked inventory.
- Untracked variants do not require an inventory mutation.

Every admin transition stores immutable admin ID and email snapshots in the
order timeline. The email remains visible even if the account changes later.

## Verification and visualization

`npm run check` covers the lifecycle, authorization, inventory-effect,
store-isolation, request-validation, TypeScript, and production-build paths.
`npm run db:verify:admin-orders` uses only the clearly marked Batch 05
synthetic order, moving it from PENDING to CONFIRMED once and safely reusing it
on later runs.

After applying the batch, sign in and open `/admin/orders`. Search for the
synthetic public ID printed by the verifier, open it, and inspect its CONFIRMED
timeline entry and admin email. In Supabase Table Editor, the same result is
visible in `orders` and `order_status_history`; tracked-stock effects are stored
in `inventory` when those transitions are used.
