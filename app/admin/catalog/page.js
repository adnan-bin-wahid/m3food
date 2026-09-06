import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import { ProductCreateForm } from '../../../components/admin/CatalogForms';
import { getAdminCatalog } from '../../../src/lib/admin/catalog-admin-service';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import { DrizzleAdminCatalogRepository } from '../../../src/lib/db/admin-catalog-repository';

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

function stockLabel(variant) {
  if (!variant.trackStock) return 'Not tracked';
  const sellable = Math.max(0, variant.available - variant.reserved);
  if (sellable === 0) return `${variant.available} available • ${variant.reserved} reserved • none sellable`;
  return `${variant.available} available • ${variant.reserved} reserved • ${sellable} sellable`;
}

export default async function CatalogPage() {
  const admin = await requireCurrentAdmin();
  const catalog = await getAdminCatalog(
    admin,
    new DrizzleAdminCatalogRepository(),
  );

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{catalog.store.slug}</p>
          <h1>Catalog</h1>
          <p className="admin-muted admin-header-copy">
            Manage products, variants, pricing, default selections, and live inventory with store-scoped permissions.
          </p>
        </div>
        <span className={`admin-access-badge ${catalog.canManage ? 'admin-access-write' : ''}`}>
          {catalog.canManage ? 'Management access' : 'Read only'}
        </span>
      </header>

      <section className="admin-catalog-metrics" aria-label="Catalog summary">
        <article className="admin-metric-card">
          <span>Products</span>
          <strong>{catalog.summary.productCount}</strong>
          <small>{catalog.summary.activeProductCount} active</small>
        </article>
        <article className="admin-metric-card">
          <span>Variants</span>
          <strong>{catalog.summary.variantCount}</strong>
          <small>{catalog.summary.activeVariantCount} active</small>
        </article>
        <article className="admin-metric-card">
          <span>Stock attention</span>
          <strong>{catalog.summary.lowStockVariantCount + catalog.summary.outOfStockVariantCount}</strong>
          <small>{catalog.summary.outOfStockVariantCount} out • {catalog.summary.lowStockVariantCount} low</small>
        </article>
      </section>

      {catalog.canManage ? (
        <section className="admin-panel admin-catalog-create-panel" aria-labelledby="create-product-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">New catalog item</p>
              <h2 id="create-product-heading">Create product</h2>
            </div>
            <span>Starts as draft</span>
          </div>
          <ProductCreateForm />
        </section>
      ) : null}

      <section className="admin-panel admin-catalog-panel" aria-label="Catalog products">
        {catalog.products.length ? catalog.products.map((product) => (
          <article className="admin-catalog-product" key={product.id}>
            <header>
              <div>
                <div className="admin-catalog-title-line">
                  <h2>
                    <Link className="admin-order-link" href={`/admin/catalog/${product.id}`}>
                      {product.name}
                    </Link>
                  </h2>
                  <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>{label(product.status)}</span>
                </div>
                <p>{product.slug}</p>
              </div>
              <div className="admin-catalog-card-actions">
                <strong>{product.variants.length} variant{product.variants.length === 1 ? '' : 's'}</strong>
                <Link className="admin-text-link" href={`/admin/catalog/${product.id}`}>
                  {catalog.canManage ? 'Manage' : 'View'}
                </Link>
              </div>
            </header>

            {product.variants.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table admin-catalog-table">
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => {
                      const sellable = variant.available - variant.reserved;
                      return (
                        <tr key={variant.id}>
                          <td>
                            <strong>{variant.label || 'Unnamed variant'}</strong>
                            {variant.isDefault ? <small>Default variant</small> : null}
                          </td>
                          <td>{variant.sku}</td>
                          <td>
                            <strong>{formatMoney(variant.priceMinor, catalog.store.currency)}</strong>
                            {variant.compareAtPriceMinor !== null ? <small>Compare {formatMoney(variant.compareAtPriceMinor, catalog.store.currency)}</small> : null}
                          </td>
                          <td>
                            <span className={variant.trackStock && sellable <= 5 ? 'admin-stock-warning' : ''}>{stockLabel(variant)}</span>
                          </td>
                          <td><span className={`admin-variant-state ${variant.isActive ? 'admin-variant-active' : ''}`}>{variant.isActive ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-muted">No variants are configured for this product.</p>
            )}
          </article>
        )) : (
          <div className="admin-empty-state">
            <h2>No products yet</h2>
            <p>Create the first draft product to start building the catalog.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
