'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }

  return (
    <button className="admin-button" type="button" onClick={logout} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
