'use client';

export default function SettingsError({ reset }) {
  return (
    <div className="admin-dashboard-state" role="alert">
      <p className="admin-eyebrow">Settings unavailable</p>
      <h1>Store settings could not be loaded.</h1>
      <p className="admin-muted">No changes were made. Try the protected read again.</p>
      <button className="admin-button" type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
