'use client';
export default function Error({ reset }) {
  return (
    <div className="admin-state-card">
      <h1>Marketing page could not load</h1>
      <p>This marketing view encountered an error.</p>
      <button className="admin-button" onClick={() => reset()}>Try again</button>
    </div>
  );
}
