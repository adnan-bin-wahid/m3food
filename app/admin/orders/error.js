'use client';

export default function OrdersError({ reset }) {
  return (
    <div className="admin-dashboard-state" role="alert">
      <p className="admin-eyebrow">Orders unavailable</p>
      <h1>Order records could not be loaded.</h1>
      <p className="admin-muted">Check the database connection and try again.</p>
      <button className="admin-button" type="button" onClick={reset}>Try again</button>
    </div>
  );
}
