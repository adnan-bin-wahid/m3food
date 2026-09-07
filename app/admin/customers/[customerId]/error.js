'use client';
export default function CustomerDetailError({ reset }) { return <div className="admin-error-state"><h2>Customer profile could not load</h2><button className="admin-button" onClick={() => reset()}>Try again</button></div>; }
