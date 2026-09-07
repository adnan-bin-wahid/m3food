'use client';

export default function CatalogProductError({ reset }) {
  return (
    <div className="admin-dashboard-state">
      <p className="admin-eyebrow">Catalog</p>
      <h1>Product could not be loaded.</h1>
      <button className="admin-button" type="button" onClick={() => reset()}>Try again</button>
    </div>
  );
}
