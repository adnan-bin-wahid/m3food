import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';

export default async function SettingsPage() {
  const admin = await requireCurrentAdmin();
  return (
    <AdminShell admin={admin}>
      <p className="admin-eyebrow">{admin.storeSlug}</p>
      <h1>Settings</h1>
      <section className="admin-placeholder-card">
        <p className="admin-muted">Protected store settings persistence is scheduled for Part E-05.</p>
      </section>
    </AdminShell>
  );
}
