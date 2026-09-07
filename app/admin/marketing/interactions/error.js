'use client';
export default function Error({ reset }) { return <div className="admin-panel"><h2>Visitor interactions unavailable</h2><button className="admin-button" onClick={() => reset()}>Try again</button></div>; }
