export default function SettingsLoading() {
  return (
    <div className="admin-dashboard-state" aria-live="polite">
      <p className="admin-eyebrow">Loading</p>
      <h1>Preparing store settings…</h1>
      <div className="admin-loading-grid" aria-hidden="true">
        <span /><span /><span />
      </div>
    </div>
  );
}
