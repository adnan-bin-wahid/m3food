import Link from 'next/link';

export default function CatalogProductNotFound() {
  return (
    <div className="admin-dashboard-state">
      <p className="admin-eyebrow">Catalog</p>
      <h1>Product not found.</h1>
      <Link className="admin-button" href="/admin/catalog">Back to catalog</Link>
    </div>
  );
}
