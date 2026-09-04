import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';

export default async function DashboardPage() {
  const admin = await requireCurrentAdmin();
  return (
    <AdminShell admin={admin}>
      <p className="admin-eyebrow">{admin.storeSlug}</p>
      <h1>Dashboard</h1>
      <section className="admin-placeholder-card">
        <h2>Authentication active</h2>
        <p className="admin-muted">This route now requires a valid database-backed session. Live commerce metrics arrive in Part E-03.</p>
      </section>
    </AdminShell>
  );
}
