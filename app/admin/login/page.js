import { redirect } from 'next/navigation';
import AdminLoginForm from '../../../components/admin/AdminLoginForm';
import { getCurrentAdmin } from '../../../src/lib/auth/current-admin';

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin/dashboard');

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <p className="admin-eyebrow">Protected workspace</p>
        <h1>Admin Login</h1>
        <p className="admin-muted">Use the store owner credentials created during Part E-02 setup.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
