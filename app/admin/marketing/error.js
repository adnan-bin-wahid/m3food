'use client';
export default function RetargetingError({ reset }) {
  return <div className="admin-state-card"><h1>Retargeting could not load</h1><p>The audience view encountered an error.</p><button onClick={() => reset()}>Try again</button></div>;
}
