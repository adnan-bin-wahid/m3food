export default function DashboardLoading() {
  return (
    <div className="admin-dashboard-state" aria-live="polite">
      <p className="admin-eyebrow">M3Food</p>
      <h1>Loading live dashboard…</h1>
      <div className="admin-loading-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
      </div>
    </div>
  );
}
