import Link from 'next/link';
export default function CustomerNotFound() { return <div className="admin-empty-state"><h2>Customer not found</h2><p>This customer does not exist in the current store.</p><Link className="admin-secondary-button" href="/admin/customers">Back to customers</Link></div>; }
