import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import CampaignCreateForm from '../../../../components/admin/CampaignCreateForm';
import CampaignStatusForm from '../../../../components/admin/CampaignStatusForm';
import UtmBuilder from '../../../../components/admin/UtmBuilder';
import { canManageCampaigns, getAdminCampaigns } from '../../../../src/lib/admin/campaign-admin-service';
import { getAdminCampaignPerformance } from '../../../../src/lib/admin/campaign-performance-service';
import { getCampaignAttributionDiagnostics } from '../../../../src/lib/admin/campaign-attribution-diagnostics-service';
import { MARKETING_RANGES, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { DrizzleAdminCampaignRepository } from '../../../../src/lib/db/admin-campaign-repository';
import { DrizzleAdminCampaignPerformanceRepository } from '../../../../src/lib/db/admin-campaign-performance-repository';
import { DrizzleAdminCampaignAttributionDiagnosticsRepository } from '../../../../src/lib/db/admin-campaign-attribution-diagnostics-repository';

export const dynamic = 'force-dynamic';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatDate(value, timezone = 'Asia/Dhaka') {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}

export default async function MarketingCampaignsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);
  const campaignRepository = new DrizzleAdminCampaignRepository();
  const diagnosticsRepository = new DrizzleAdminCampaignAttributionDiagnosticsRepository();
  const [campaigns, performanceResult, diagnostics] = await Promise.all([
    getAdminCampaigns(admin, campaignRepository),
    getAdminCampaignPerformance(
      admin.storeId,
      range,
      new DrizzleAdminCampaignPerformanceRepository(),
    ),
    getCampaignAttributionDiagnostics(
      admin.storeId,
      range,
      diagnosticsRepository,
    ),
  ]);
  const performance = performanceResult.rows;
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
            Register canonical UTM identities, inspect first-touch versus last-touch performance, and find raw campaign traffic that has not resolved to the registry.
          </p>
        </div>
        <nav className="admin-range-picker">
          {MARKETING_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin/marketing/campaigns?range=${option}`}
              aria-current={range === option ? 'page' : undefined}
            >
              {option === 'all' ? 'All' : option}
            </Link>
          ))}
        </nav>
      </header>

      <MarketingNav current="/admin/marketing/campaigns" range={range} />

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
                      <Link href={`/admin/marketing/campaigns/${campaign.id}?range=${range}`}>
                        <strong>{campaign.name}</strong>
                      </Link>
                      {campaign.landingUrl ? <small>{campaign.landingUrl}</small> : null}
                    </td>
                    <td>
                      <Link href={`/admin/marketing/campaigns/${campaign.id}?range=${range}`}>
                        <code>{campaign.campaignKey}</code>
                      </Link>
                    </td>
                    <td>{campaign.source}</td>
                    <td>{campaign.medium}</td>
                    <td>{campaign.content || '—'}</td>
                    <td>
                      <CampaignStatusForm
                        campaign={serializableCampaigns.find((item) => item.id === campaign.id)}
                        editable={editable}
                      />
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
            <p className="admin-eyebrow">Attribution performance</p>
            <h2>First touch vs last touch</h2>
          </div>
          <span>{performanceResult.window.label}</span>
        </div>

        {performance.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Sessions</th>
                  <th>Visitors</th>
                  <th>First-touch orders</th>
                  <th>Last-touch orders</th>
                  <th>Last-touch CVR</th>
                  <th>Placed revenue</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((row) => (
                  <tr key={row.campaignId}>
                    <td>
                      <Link href={`/admin/marketing/campaigns/${row.campaignId}?range=${range}`}>
                        <strong>{row.name}</strong>
                        <small><code>{row.campaignKey}</code></small>
                      </Link>
                    </td>
                    <td>{row.sessions}</td>
                    <td>{row.visitors}</td>
                    <td>{row.firstTouchOrders}</td>
                    <td>{row.lastTouchOrders}</td>
                    <td>{row.lastTouchConversionRate}%</td>
                    <td>{formatMoney(row.placedRevenueMinor, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No registered campaign performance in this period.</p>
        )}
        <p className="admin-note">
          Direct sessions remain real touches. Placed revenue uses last-touch campaign attribution and is not ad spend or ROAS.
        </p>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Registry gaps</p>
            <h2>Unregistered UTM traffic</h2>
          </div>
          <span>{diagnostics.window.label}</span>
        </div>

        {diagnostics.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Raw utm_campaign</th>
                  <th>Suggested key</th>
                  <th>Source</th>
                  <th>Medium</th>
                  <th>Sessions</th>
                  <th>Visitors</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.rows.map((row) => (
                  <tr key={`${row.rawCampaign}:${row.source || ''}:${row.medium || ''}`}>
                    <td><code>{row.rawCampaign}</code></td>
                    <td><code>{row.suggestedCampaignKey || '—'}</code></td>
                    <td>{row.source || '—'}</td>
                    <td>{row.medium || '—'}</td>
                    <td>{row.sessions}</td>
                    <td>{row.visitors}</td>
                    <td>{formatDate(row.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No unresolved UTM campaign traffic in this period.</p>
        )}
        <p className="admin-note">
          This is diagnostic only. The system never auto-creates a Campaign Registry record from an unknown UTM string.
        </p>
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
            <p className="admin-eyebrow">Measurement contract</p>
            <h2>Attribution boundary</h2>
          </div>
          <span>First-party source of truth</span>
        </div>
        <p className="admin-muted">
          Raw UTM evidence remains immutable. Known campaign keys additionally resolve to internal Campaign Registry IDs. First-touch and last-touch order links are stored separately, and provider spend/ROAS will join later without rewriting the first-party attribution history.
        </p>
      </section>
    </AdminShell>
  );
}
