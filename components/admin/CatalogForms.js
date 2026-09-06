'use client';

import { useActionState, useState } from 'react';
import {
  createProductAction,
  createVariantAction,
  setDefaultVariantAction,
  updateInventoryAction,
  updateProductAction,
  updateVariantAction,
} from '../../app/admin/catalog/actions';

const initialState = { ok: false, message: '' };

function Feedback({ state }) {
  if (!state.message) return null;
  return (
    <p
      className={state.ok ? 'admin-success' : 'admin-error'}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

function major(minor) {
  return (minor / 100).toFixed(2);
}

export function ProductCreateForm() {
  const [state, action, pending] = useActionState(createProductAction, initialState);
  return (
    <form action={action} className="admin-catalog-form admin-catalog-create-form">
      <fieldset disabled={pending}>
        <label>
          Product name
          <input name="name" required maxLength={255} />
        </label>
        <label>
          Slug
          <input
            name="slug"
            required
            maxLength={160}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="product-name"
            spellCheck={false}
          />
        </label>
        <label className="admin-catalog-wide-field">
          Description <span className="admin-optional">Optional</span>
          <textarea name="description" maxLength={5000} rows={3} />
        </label>
        <button className="admin-button" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create draft product'}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function ProductEditForm({ product, editable }) {
  const [state, action, pending] = useActionState(updateProductAction, initialState);
  return (
    <form action={action} className="admin-catalog-form">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="expectedRevision" value={product.revision} />
      <fieldset disabled={!editable || pending}>
        <label>
          Product name
          <input name="name" defaultValue={product.name} required maxLength={255} />
        </label>
        <label>
          Slug
          <input
            name="slug"
            defaultValue={product.slug}
            required
            maxLength={160}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            spellCheck={false}
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={product.status}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <small>Active products require an active default variant.</small>
        </label>
        <label className="admin-catalog-wide-field">
          Description <span className="admin-optional">Optional</span>
          <textarea
            name="description"
            defaultValue={product.description ?? ''}
            maxLength={5000}
            rows={5}
          />
        </label>
        {editable ? (
          <button className="admin-button" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save product'}
          </button>
        ) : null}
      </fieldset>
      {!editable ? <p className="admin-note">Your role has read-only catalog access.</p> : null}
      <Feedback state={state} />
    </form>
  );
}

export function VariantCreateForm({ productId }) {
  const [state, action, pending] = useActionState(createVariantAction, initialState);
  const [trackStock, setTrackStock] = useState(false);
  return (
    <form action={action} className="admin-catalog-form admin-variant-create-form">
      <input type="hidden" name="productId" value={productId} />
      <fieldset disabled={pending}>
        <label>
          SKU
          <input name="sku" required maxLength={100} spellCheck={false} />
        </label>
        <label>
          Label <span className="admin-optional">Optional</span>
          <input name="label" maxLength={160} placeholder="1 pack" />
        </label>
        <label>
          Selling price
          <input name="price" required inputMode="decimal" pattern="[0-9]+(?:\.[0-9]{1,2})?" placeholder="1250.00" />
        </label>
        <label>
          Compare-at price <span className="admin-optional">Optional</span>
          <input name="compareAtPrice" inputMode="decimal" pattern="[0-9]+(?:\.[0-9]{1,2})?" placeholder="1890.00" />
        </label>
        <label className="admin-check-field">
          <input name="isActive" type="checkbox" defaultChecked />
          Active variant
        </label>
        <label className="admin-check-field">
          <input
            name="trackStock"
            type="checkbox"
            checked={trackStock}
            onChange={(event) => setTrackStock(event.target.checked)}
          />
          Track stock
        </label>
        {trackStock ? (
          <label>
            Initial available stock
            <input name="available" type="number" min="0" step="1" defaultValue="0" required />
          </label>
        ) : (
          <input type="hidden" name="available" value="0" />
        )}
        <button className="admin-button" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Add variant'}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function VariantEditForm({ productId, variant, editable }) {
  const [state, action, pending] = useActionState(updateVariantAction, initialState);
  return (
    <form action={action} className="admin-catalog-form admin-variant-edit-form">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variant.id} />
      <input type="hidden" name="expectedRevision" value={variant.revision} />
      <fieldset disabled={!editable || pending}>
        <label>
          SKU
          <input name="sku" defaultValue={variant.sku} required maxLength={100} spellCheck={false} />
        </label>
        <label>
          Label <span className="admin-optional">Optional</span>
          <input name="label" defaultValue={variant.label ?? ''} maxLength={160} />
        </label>
        <label>
          Selling price
          <input
            name="price"
            defaultValue={major(variant.priceMinor)}
            required
            inputMode="decimal"
            pattern="[0-9]+(?:\.[0-9]{1,2})?"
          />
        </label>
        <label>
          Compare-at price <span className="admin-optional">Optional</span>
          <input
            name="compareAtPrice"
            defaultValue={variant.compareAtPriceMinor === null ? '' : major(variant.compareAtPriceMinor)}
            inputMode="decimal"
            pattern="[0-9]+(?:\.[0-9]{1,2})?"
          />
        </label>
        <label className="admin-check-field">
          <input name="isActive" type="checkbox" defaultChecked={variant.isActive} />
          Active variant
        </label>
        {editable ? (
          <button className="admin-button" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save variant'}
          </button>
        ) : null}
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function InventoryEditForm({ productId, variant, editable }) {
  const [state, action, pending] = useActionState(updateInventoryAction, initialState);
  const [trackStock, setTrackStock] = useState(variant.trackStock);
  const sellable = Math.max(0, variant.available - variant.reserved);
  return (
    <form action={action} className="admin-catalog-form admin-inventory-form">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variant.id} />
      <input type="hidden" name="expectedRevision" value={variant.inventoryRevision} />
      <fieldset disabled={!editable || pending}>
        <label className="admin-check-field">
          <input
            name="trackStock"
            type="checkbox"
            checked={trackStock}
            onChange={(event) => setTrackStock(event.target.checked)}
          />
          Track stock
        </label>
        {trackStock ? (
          <label>
            Available stock
            <input
              name="available"
              type="number"
              min={variant.reserved}
              step="1"
              defaultValue={variant.available}
              required
            />
            <small>{variant.reserved} reserved • {sellable} currently sellable</small>
          </label>
        ) : (
          <>
            <input type="hidden" name="available" value="0" />
            <p className="admin-note">Untracked variants are always purchasable and store zero available units.</p>
          </>
        )}
        {editable ? (
          <button className="admin-secondary-button" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save inventory'}
          </button>
        ) : null}
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function DefaultVariantForm({ productId, variant, editable }) {
  const [state, action, pending] = useActionState(setDefaultVariantAction, initialState);
  if (variant.isDefault) {
    return <span className="admin-default-badge">Default variant</span>;
  }
  return (
    <form action={action} className="admin-default-form">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variant.id} />
      <input type="hidden" name="expectedRevision" value={variant.revision} />
      <button
        className="admin-text-button"
        type="submit"
        disabled={!editable || pending || !variant.isActive}
      >
        {pending ? 'Updating…' : variant.isActive ? 'Make default' : 'Activate before default'}
      </button>
      <Feedback state={state} />
    </form>
  );
}
