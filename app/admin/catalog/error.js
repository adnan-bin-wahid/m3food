'use client';

export default function CatalogError({ reset }) {
  return (
    <div className="admin-dashboard-state">
      <p className="admin-eyebrow">Catalog unavailable</p>
      <h1>The catalog could not be loaded.</h1>
      <p className="admin-muted">No catalog data was changed. Retry the protected read.</p>
      <button className="admin-button" type="button" onClick={() => reset()}>Retry</button>
    </div>
  );
}
