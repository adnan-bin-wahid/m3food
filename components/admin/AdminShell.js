import Link from 'next/link';
import AdminLogoutButton from './AdminLogoutButton';

export default function AdminShell({ admin, children }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/dashboard">M3Food Admin</Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/catalog">Catalog</Link>
          <Link href="/admin/customers">Customers</Link>
          <Link href="/admin/marketing/retargeting">Retargeting</Link>
          <Link href="/admin/settings">Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <p>{admin.displayName}<br />{admin.email}</p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
