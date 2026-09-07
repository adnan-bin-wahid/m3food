import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import {
  DefaultVariantForm,
  InventoryEditForm,
  ProductEditForm,
  VariantCreateForm,
  VariantEditForm,
} from '../../../../components/admin/CatalogForms';
import {
  AdminCatalogError,
  getAdminCatalogProduct,
} from '../../../../src/lib/admin/catalog-admin-service';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { DrizzleAdminCatalogRepository } from '../../../../src/lib/db/admin-catalog-repository';

export const dynamic = 'force-dynamic';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

function label(value) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ');
}

function formatDate(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}

function historyLabel(action) {
  return action.toLowerCase().replaceAll('_', ' ').replace(/^./, (value) => value.toUpperCase());
}

export default async function CatalogProductPage({ params }) {
  const admin = await requireCurrentAdmin();
  const { productId } = await params;
  let product;
  try {
    product = await getAdminCatalogProduct(
      admin,
      productId,
      new DrizzleAdminCatalogRepository(),
    );
  } catch (error) {
    if (error instanceof AdminCatalogError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  return (
    <AdminShell admin={admin}>
      <div className="admin-back-row">
        <Link className="admin-text-link" href="/admin/catalog">← Back to catalog</Link>
      </div>

      <header className="admin-page-header admin-catalog-detail-header">
        <div>
          <p className="admin-eyebrow">{product.store.slug} • product revision {product.revision}</p>
          <h1>{product.name}</h1>
          <p className="admin-muted admin-header-copy">{product.slug}</p>
        </div>
        <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
          {label(product.status)}
        </span>
      </header>

      <section className="admin-panel admin-catalog-edit-panel" aria-labelledby="product-settings-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Product</p>
            <h2 id="product-settings-heading">Identity and publishing</h2>
          </div>
          <span>Revision {product.revision}</span>
        </div>
        <ProductEditForm
          key={`product-${product.revision}`}
          product={product}
          editable={product.canManage}
        />
      </section>

      {product.canManage ? (
        <section className="admin-panel admin-catalog-edit-panel" aria-labelledby="new-variant-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Variant</p>
              <h2 id="new-variant-heading">Add variant</h2>
            </div>
            <span>SKU must be store-unique</span>
          </div>
          <VariantCreateForm productId={product.id} />
        </section>
      ) : null}

      <section className="admin-catalog-variant-stack" aria-label="Product variants">
        {product.variants.length ? product.variants.map((variant) => {
          const sellable = Math.max(0, variant.available - variant.reserved);
          return (
            <article className="admin-panel admin-variant-editor" key={variant.id}>
              <header className="admin-variant-editor-header">
                <div>
                  <div className="admin-catalog-title-line">
                    <h2>{variant.label || variant.sku}</h2>
                    <span className={`admin-variant-state ${variant.isActive ? 'admin-variant-active' : ''}`}>
                      {variant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p>{variant.sku} • variant revision {variant.revision}</p>
                </div>
                <DefaultVariantForm
                  key={`default-${variant.revision}-${variant.isDefault}`}
                  productId={product.id}
                  variant={variant}
                  editable={product.canManage}
                />
              </header>

              <div className="admin-variant-editor-grid">
                <div>
                  <h3>Pricing and state</h3>
                  <p className="admin-muted">
                    {formatMoney(variant.priceMinor, product.store.currency)} selling price
                    {variant.compareAtPriceMinor !== null ? ` • ${formatMoney(variant.compareAtPriceMinor, product.store.currency)} compare-at` : ''}
                  </p>
                  <VariantEditForm
                    key={`variant-${variant.revision}`}
                    productId={product.id}
                    variant={variant}
                    editable={product.canManage}
                  />
                </div>

                <div className="admin-inventory-editor">
                  <h3>Inventory</h3>
                  <p className="admin-muted">
                    {variant.trackStock
                      ? `${variant.available} available • ${variant.reserved} reserved • ${sellable} sellable`
                      : 'Stock tracking disabled • always purchasable'}
                  </p>
                  <InventoryEditForm
                    key={`inventory-${variant.inventoryRevision}-${variant.trackStock}`}
                    productId={product.id}
                    variant={variant}
                    editable={product.canManage}
                  />
                </div>
              </div>
            </article>
          );
        }) : (
          <section className="admin-panel admin-empty-state">
            <h2>No variants yet</h2>
            <p>Add a variant before publishing this product as Active.</p>
          </section>
        )}
      </section>

      <section className="admin-panel admin-catalog-history" aria-labelledby="catalog-history-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Audit trail</p>
            <h2 id="catalog-history-heading">Recent catalog changes</h2>
          </div>
          <span>Latest 30</span>
        </div>
        {product.history.length ? (
          <div className="admin-history-list">
            {product.history.map((entry) => (
              <article key={entry.id}>
                <div>
                  <strong>{historyLabel(entry.action)}</strong>
                  <span>{entry.changedByAdminEmail}</span>
                </div>
                <time>{formatDate(entry.createdAt, product.store.timezone)}</time>
                <details>
                  <summary>Change snapshot</summary>
                  <div className="admin-history-snapshot-grid">
                    <pre>{JSON.stringify(entry.beforeState, null, 2) || 'null'}</pre>
                    <pre>{JSON.stringify(entry.afterState, null, 2) || 'null'}</pre>
                  </div>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No catalog changes have been recorded yet.</p>
        )}
      </section>
    </AdminShell>
  );
}
