export default function CatalogLoading() {
  return (
    <div className="admin-dashboard-state">
      <p className="admin-eyebrow">Catalog</p>
      <h1>Loading catalog…</h1>
      <div className="admin-loading-grid" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}
