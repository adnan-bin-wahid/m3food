import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import AdminDateRangePicker from '../../../../components/admin/AdminDateRangePicker';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import EmptyState from '../../../../components/admin/marketing/EmptyState';
import CampaignCreateForm from '../../../../components/admin/CampaignCreateForm';
import CampaignStatusForm from '../../../../components/admin/CampaignStatusForm';
import UtmBuilder from '../../../../components/admin/UtmBuilder';
import { canManageCampaigns, getAdminCampaigns } from '../../../../src/lib/admin/campaign-admin-service';
import { getAdminCampaignPerformance } from '../../../../src/lib/admin/campaign-performance-service';
import { getCampaignAttributionDiagnostics } from '../../../../src/lib/admin/campaign-attribution-diagnostics-service';
import { parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { DrizzleAdminCampaignRepository } from '../../../../src/lib/db/admin-campaign-repository';
import { DrizzleAdminCampaignPerformanceRepository } from '../../../../src/lib/db/admin-campaign-performance-repository';
import { DrizzleAdminCampaignAttributionDiagnosticsRepository } from '../../../../src/lib/db/admin-campaign-attribution-diagnostics-repository';

export const dynamic = 'force-dynamic';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency || 'BDT',
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

function formatDate(value, timezone = 'Asia/Dhaka') {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value instanceof Date ? value : new Date(value));
}

function number(value) {
  return new Intl.NumberFormat('en-BD').format(value || 0);
}

export default async function MarketingCampaignsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range, raw?.from, raw?.to);
  const campaignRepository = new DrizzleAdminCampaignRepository();
  const diagnosticsRepository = new DrizzleAdminCampaignAttributionDiagnosticsRepository();

  const [campaigns, performanceResult, diagnostics] = await Promise.all([
    getAdminCampaigns(admin, campaignRepository),
    getAdminCampaignPerformance(
      admin.storeId,
      range,
      new DrizzleAdminCampaignPerformanceRepository(),
      new Date(),
      raw?.from,
      raw?.to,
    ),
    getCampaignAttributionDiagnostics(
      admin.storeId,
      range,
      diagnosticsRepository,
    ),
  ]);

  const performance = performanceResult?.rows || [];
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
      <PageIntro
        pageKey="campaigns"
        eyebrow="Growth · Tracking Links"
        title="Campaign Tracking"
        description="Create tracking links for your ads and measure which campaigns bring paying customers."
        controls={
          <AdminDateRangePicker
            baseUrl="/admin/marketing/campaigns"
            currentRange={range}
            from={performanceResult?.window?.from || raw?.from}
            to={performanceResult?.window?.to || raw?.to}
          />
        }
      />

      <MarketingNav
        current="/admin/marketing/campaigns"
        range={range}
        from={performanceResult?.window?.from}
        to={performanceResult?.window?.to}
      />

      <p className="admin-data-window" style={{ margin: '0 0 var(--space-4) 0' }}>
        Showing {performanceResult?.window?.label.toLowerCase()}
      </p>

      {/* Section 1: Create Campaign Tracking Link Wizard */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Link Creator</p>
            <h2 style={{ fontSize: '1.125rem' }}>Create campaign tracking link</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Fill in 5 quick details. We automatically format the tracking tags for Meta and Google.
            </p>
          </div>
        </div>
        <CampaignCreateForm editable={editable} />
      </section>

      {/* Section 2: Active Registered Campaigns */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Your Campaigns</p>
            <h2 style={{ fontSize: '1.125rem' }}>Registered Campaigns ({campaigns.length})</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              These campaigns are officially tracked by your store.
            </p>
          </div>
        </div>

        {campaigns.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Channel</th>
                  <th>Ad / Creative</th>
                  <th>Target Audience</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Link
                        href={`/admin/marketing/campaigns/${campaign.id}?range=${range}`}
                        style={{ fontWeight: 600, color: 'var(--admin-forest)' }}
                      >
                        {campaign.name}
                      </Link>
                      {campaign.landingUrl ? (
                        <small style={{ display: 'block', color: 'var(--admin-muted)', marginTop: '2px' }}>
                          {campaign.landingUrl}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      <strong>{campaign.source}</strong>
                      <small style={{ display: 'block', color: 'var(--admin-muted)' }}>{campaign.medium}</small>
                    </td>
                    <td>{campaign.content || 'Default'}</td>
                    <td>{campaign.term || 'All'}</td>
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
          <EmptyState
            title="No campaigns created yet"
            description="Use the wizard above to create your first ad campaign tracking link."
          />
        )}
      </section>

      {/* Section 3: Attribution Performance */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Campaign Results</p>
            <h2 style={{ fontSize: '1.125rem' }}>Where customers came from & where they ordered</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Compare original discovery source (first touch) with the final link used before purchase (last touch).
            </p>
          </div>
        </div>

        {performance.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Visitors</th>
                  <th>First-touch orders</th>
                  <th>Last-touch orders</th>
                  <th>Conversion rate</th>
                  <th>Placed revenue</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((row) => (
                  <tr key={row.campaignId}>
                    <td className="admin-stacked-cell">
                      <Link
                        href={`/admin/marketing/campaigns/${row.campaignId}?range=${range}`}
                        style={{ fontWeight: 600, color: 'var(--admin-forest)' }}
                      >
                        {row.name}
                      </Link>
                      <small style={{ color: 'var(--admin-muted)' }}>{row.campaignKey}</small>
                    </td>
                    <td>{number(row.visitors)}</td>
                    <td>{number(row.firstTouchOrders)}</td>
                    <td>
                      <strong style={{ color: row.lastTouchOrders > 0 ? '#166534' : 'inherit' }}>
                        {number(row.lastTouchOrders)}
                      </strong>
                    </td>
                    <td>{row.lastTouchConversionRate}%</td>
                    <td>
                      <strong style={{ color: row.placedRevenueMinor > 0 ? '#166534' : 'inherit' }}>
                        {formatMoney(row.placedRevenueMinor, row.currency)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No registered campaign performance recorded in this period.</p>
        )}
      </section>

      {/* Section 4: Unrecognized Tracking Links (Renamed from Registry Gaps) */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Attention Required</p>
            <h2 style={{ fontSize: '1.125rem' }}>Unrecognized tracking links</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              These visits used tracking names that are not registered in your store yet. Register them above to connect ad spend and sales.
            </p>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
            {diagnostics.rows.length} unrecognized link{diagnostics.rows.length === 1 ? '' : 's'}
          </span>
        </div>

        {diagnostics.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tracking link name</th>
                  <th>Suggested registration</th>
                  <th>Source</th>
                  <th>Visitors</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.rows.map((row) => (
                  <tr key={`${row.rawCampaign}:${row.source || ''}:${row.medium || ''}`}>
                    <td>
                      <code>{row.rawCampaign}</code>
                    </td>
                    <td>
                      <strong>{row.suggestedCampaignKey || '—'}</strong>
                    </td>
                    <td>{row.source || 'Direct'}</td>
                    <td>{number(row.visitors)}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
                      {formatDate(row.lastSeenAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">✓ All incoming tracking links match registered campaigns.</p>
        )}
      </section>

      {/* Section 5: Link Builder Tool */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Link Copy</p>
            <h2 style={{ fontSize: '1.125rem' }}>Copy tagged landing page URL</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Select a campaign to generate a ready-to-paste tracking link for your ad.
            </p>
          </div>
        </div>
        <UtmBuilder campaigns={serializableCampaigns} />
      </section>

      {/* Section 6: Technical Details */}
      <TechnicalDetails title="Technical UTM Architecture & Measurement Contract">
        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--admin-muted)', marginBottom: 'var(--space-3)' }}>
          Raw UTM evidence remains immutable. Known campaign keys additionally resolve to internal Campaign Registry IDs. First-touch and last-touch order links are stored separately, and provider spend/ROAS join without rewriting the first-party attribution history.
        </p>
        <div className="admin-definition-grid">
          <div>
            <span>Canonical Campaign Key</span>
            <code>utm_campaign</code>
          </div>
          <div>
            <span>Platform Source</span>
            <code>utm_source</code>
          </div>
          <div>
            <span>Marketing Medium</span>
            <code>utm_medium</code>
          </div>
          <div>
            <span>Ad Creative</span>
            <code>utm_content</code>
          </div>
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}
