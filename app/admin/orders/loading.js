export default function OrdersLoading() {
  return (
    <div className="admin-dashboard-state" aria-live="polite">
      <p className="admin-eyebrow">Niyamah Admin</p>
      <h1>Loading order records…</h1>
      <div className="admin-loading-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
      </div>
    </div>
  );
}
