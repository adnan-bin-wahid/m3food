import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '../../src/lib/auth/current-admin';

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  redirect(admin ? '/admin/dashboard' : '/admin/login');
}
