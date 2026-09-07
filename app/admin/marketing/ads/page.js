import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PaidAdAccountForm from '../../../../components/admin/PaidAdAccountForm';
import PaidAdMappingForm from '../../../../components/admin/PaidAdMappingForm';
import PaidAdMetricForm from '../../../../components/admin/PaidAdMetricForm';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  canManagePaidAds,
  getAdminPaidAdsWorkspace,
} from '../../../../src/lib/admin/paid-ads-service';
import { DrizzleAdminPaidAdsRepository } from '../../../../src/lib/db/admin-paid-ads-repository';
import { calculatePaidAdDelivery } from '../../../../src/lib/marketing/paid-ads';

export const dynamic = 'force-dynamic';

function money(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

function number(value) {
  return new Intl.NumberFormat('en-BD').format(value);
}

export default async function MarketingAdsPage() {
  const admin = await requireCurrentAdmin();
  const workspace = await getAdminPaidAdsWorkspace(
    admin,
    new DrizzleAdminPaidAdsRepository(),
  );
  if (!workspace) throw new Error('Paid ads store unavailable.');

  const editable = canManagePaidAds(admin.role);
  const accounts = workspace.accounts.map((account) => ({
    id: account.id,
    provider: account.provider,
    name: account.name,
    currency: account.currency,
  }));
  const campaigns = workspace.campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    campaignKey: campaign.campaignKey,
    status: campaign.status,
  }));
  const mappings = workspace.mappings.map((mapping) => ({
    id: mapping.id,
    provider: mapping.provider,
    externalCampaignName: mapping.externalCampaignName,
    campaignKey: mapping.campaignKey,
  }));

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Growth · Media delivery</p>
          <h1>Paid Ads Intelligence</h1>
          <p className="admin-muted admin-header-copy">
            Provider-neutral Meta and Google account registry, canonical campaign mapping and daily delivery metrics. First-party commerce remains the conversion source of truth.
          </p>
        </div>
      </header>

      <MarketingNav current="/admin/marketing/ads" />

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">Accounts</p><h2>Ad accounts</h2></div>
          <span>{workspace.accounts.length} registered</span>
        </div>
        {workspace.accounts.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Provider</th><th>Account</th><th>External ID</th><th>Currency</th><th>Timezone</th><th>Status</th></tr></thead>
              <tbody>
                {workspace.accounts.map((account) => (
                  <tr key={account.id}>
                    <td><strong>{account.provider}</strong></td>
                    <td>{account.name}</td>
                    <td><code>{account.externalAccountId}</code></td>
                    <td>{account.currency}</td>
                    <td>{account.timezone}</td>
                    <td>{account.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-empty">No paid ad accounts registered yet.</p>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">Canonical bridge</p><h2>Provider campaign mappings</h2></div>
          <span>{workspace.mappings.length} mapped</span>
        </div>
        {workspace.mappings.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Provider</th><th>Provider campaign</th><th>External ID</th><th>Campaign Registry</th><th>Account</th></tr></thead>
              <tbody>
                {workspace.mappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>{mapping.provider}</td>
                    <td><strong>{mapping.externalCampaignName}</strong></td>
                    <td><code>{mapping.externalCampaignId}</code></td>
                    <td>{mapping.marketingCampaignName ? <><strong>{mapping.marketingCampaignName}</strong><small><code>{mapping.campaignKey}</code></small></> : 'Unmapped'}</td>
                    <td>{mapping.accountName} · {mapping.accountCurrency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-empty">No provider campaigns mapped yet.</p>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">Delivery evidence</p><h2>Recent daily metrics</h2></div>
          <span>Latest 100 rows</span>
        </div>
        {workspace.metrics.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Campaign</th><th>Spend</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>CPC</th><th>Source</th></tr></thead>
              <tbody>
                {workspace.metrics.map((metric) => {
                  const delivery = calculatePaidAdDelivery(metric);
                  return (
                    <tr key={metric.id}>
                      <td>{metric.metricDate}</td>
                      <td><strong>{metric.externalCampaignName}</strong><small>{metric.provider} → {metric.campaignKey || 'Unmapped'}</small></td>
                      <td>{money(delivery.spendMinor, metric.currency)}</td>
                      <td>{number(delivery.impressions)}</td>
                      <td>{number(delivery.clicks)}</td>
                      <td>{delivery.ctrPercent.toFixed(2)}%</td>
                      <td>{money(Math.round(delivery.cpcMinor), metric.currency)}</td>
                      <td>{metric.ingestionSource}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-empty">No paid delivery metrics recorded yet.</p>}
        <p className="admin-note">
          Spend stays in each provider account currency. This batch never fabricates currency conversion or ROAS. First-party order/revenue joins come next.
        </p>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Setup</p><h2>Register ad account</h2></div><span>Owner / Admin</span></div>
        <PaidAdAccountForm editable={editable} />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Mapping</p><h2>Map provider campaign</h2></div><span>Campaign Registry required</span></div>
        <PaidAdMappingForm editable={editable} accounts={accounts} campaigns={campaigns} />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Manual ingestion</p><h2>Record daily delivery</h2></div><span>API sync follows</span></div>
        <PaidAdMetricForm editable={editable} mappings={mappings} />
      </section>
    </AdminShell>
  );
}
