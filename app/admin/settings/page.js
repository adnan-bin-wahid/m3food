import AdminShell from '../../../components/admin/AdminShell';
import StoreSettingsForm from '../../../components/admin/StoreSettingsForm';
import {
  canEditStoreSettings,
  getStoreSettings,
} from '../../../src/lib/admin/settings-service';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import { DrizzleAdminSettingsRepository } from '../../../src/lib/db/admin-settings-repository';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireCurrentAdmin();
  const settings = await getStoreSettings(
    admin,
    new DrizzleAdminSettingsRepository(),
  );

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{settings.slug}</p>
          <h1>Store settings</h1>
          <p className="admin-muted admin-header-copy">
            Manage store identity plus consent-gated Meta Pixel, Meta CAPI, GA4, Google Tag Manager, and Microsoft Clarity delivery.
          </p>
        </div>
        <span className="admin-count-badge">{settings.currency}</span>
      </header>

      <section className="admin-panel admin-settings-panel" aria-labelledby="general-settings">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Configuration</p>
            <h2 id="general-settings">General and analytics</h2>
          </div>
          <span>Revision {settings.revision}</span>
        </div>
        <StoreSettingsForm
          key={settings.revision}
          settings={settings}
          editable={canEditStoreSettings(admin.role)}
        />
      </section>
    </AdminShell>
  );
}
