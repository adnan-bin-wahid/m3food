import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';

export default async function OrdersPage() {
  const admin = await requireCurrentAdmin();
  return (
    <AdminShell admin={admin}>
      <p className="admin-eyebrow">{admin.storeSlug}</p>
      <h1>Orders</h1>
      <section className="admin-placeholder-card">
        <p className="admin-muted">Protected order management is scheduled for Part E-04.</p>
      </section>
    </AdminShell>
  );
}
