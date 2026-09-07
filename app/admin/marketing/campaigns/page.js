import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import CampaignCreateForm from '../../../../components/admin/CampaignCreateForm';
import CampaignStatusForm from '../../../../components/admin/CampaignStatusForm';
import UtmBuilder from '../../../../components/admin/UtmBuilder';
import { canManageCampaigns, getAdminCampaigns } from '../../../../src/lib/admin/campaign-admin-service';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { DrizzleAdminCampaignRepository } from '../../../../src/lib/db/admin-campaign-repository';

export const dynamic = 'force-dynamic';

export default async function MarketingCampaignsPage() {
  const admin = await requireCurrentAdmin();
  const campaigns = await getAdminCampaigns(admin, new DrizzleAdminCampaignRepository());
  const editable = canManageCampaigns(admin.role);

  const serializableCampaigns = campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    campaignKey: campaign.campaignKey,
    source: campaign.source,
    medium: campaign.medium,
    content: campaign.content,
    term: campaign.term,
    landingUrl: campaign.landingUrl,
    status: campaign.status,
    revision: campaign.revision,
  }));

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Growth · Acquisition control</p>
          <h1>Campaign Manager</h1>
          <p className="admin-muted admin-header-copy">
            Register stable UTM campaign identities before traffic launches. These keys become the canonical bridge between first-party sessions, orders and later ad-provider mapping.
          </p>
        </div>
      </header>

      <MarketingNav current="/admin/marketing/campaigns" />

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Registry</p>
            <h2>Campaigns</h2>
          </div>
          <span>{campaigns.length} registered</span>
        </div>

        {campaigns.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>utm_campaign</th>
                  <th>Source</th>
                  <th>Medium</th>
                  <th>Content</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <strong>{campaign.name}</strong>
                      {campaign.landingUrl ? <small>{campaign.landingUrl}</small> : null}
                    </td>
                    <td><code>{campaign.campaignKey}</code></td>
                    <td>{campaign.source}</td>
                    <td>{campaign.medium}</td>
                    <td>{campaign.content || '—'}</td>
                    <td>
                      <CampaignStatusForm campaign={serializableCampaigns.find((item) => item.id === campaign.id)} editable={editable} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No campaigns registered yet.</p>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Create</p>
            <h2>Register campaign</h2>
          </div>
          <span>Owner / Admin</span>
        </div>
        <CampaignCreateForm editable={editable} />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Link builder</p>
            <h2>UTM Builder</h2>
          </div>
          <span>Canonical campaign key</span>
        </div>
        <UtmBuilder campaigns={serializableCampaigns} />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Attribution semantics</p>
            <h2>What comes next</h2>
          </div>
          <span>Part N Batch 02</span>
        </div>
        <p className="admin-muted">
          Batch 01 creates the canonical registry and deterministic first/last-touch resolver. Batch 02 will wire those semantics into order attribution and campaign performance reporting so one campaign can be measured from session → order → revenue.
        </p>
      </section>
    </AdminShell>
  );
}
