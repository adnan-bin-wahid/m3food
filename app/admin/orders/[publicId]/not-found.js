import Link from 'next/link';

export default function OrderNotFound() {
  return (
    <div className="admin-dashboard-state">
      <p className="admin-eyebrow">Order not found</p>
      <h1>This order is unavailable for your store.</h1>
      <p className="admin-muted">The order ID may be incorrect, or the record belongs to another store.</p>
      <Link className="admin-button" href="/admin/orders">Return to orders</Link>
    </div>
  );
}
