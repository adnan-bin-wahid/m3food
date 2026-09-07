'use client';

export default function DashboardError({ reset }) {
  return (
    <div className="admin-dashboard-state" role="alert">
      <p className="admin-eyebrow">Dashboard unavailable</p>
      <h1>Live metrics could not be loaded.</h1>
      <p className="admin-muted">Check the database connection and try the request again.</p>
      <button className="admin-button" type="button" onClick={reset}>Try again</button>
    </div>
  );
}
