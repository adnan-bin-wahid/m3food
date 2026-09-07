'use client';
export default function CustomersError({ reset }) {
  return <div className="admin-error-state"><h2>Customers could not load</h2><p>The admin customer view encountered an error.</p><button className="admin-button" onClick={() => reset()}>Try again</button></div>;
}
