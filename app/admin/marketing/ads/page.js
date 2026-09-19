import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import AdminDateRangePicker from '../../../../components/admin/AdminDateRangePicker';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../../components/admin/marketing/BusinessMetric';
import InsightCard from '../../../../components/admin/marketing/InsightCard';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import EmptyState from '../../../../components/admin/marketing/EmptyState';
import PaidAdAccountForm from '../../../../components/admin/PaidAdAccountForm';
import PaidAdMappingForm from '../../../../components/admin/PaidAdMappingForm';
import PaidAdMetricForm from '../../../../components/admin/PaidAdMetricForm';
import PaidAdSyncForm from '../../../../components/admin/PaidAdSyncForm';
import PaidAdScheduleForm from '../../../../components/admin/PaidAdScheduleForm';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  canManagePaidAds,
  getAdminPaidAdsWorkspace,
} from '../../../../src/lib/admin/paid-ads-service';
import {
  parseMarketingRange,
} from '../../../../src/lib/admin/marketing-analytics-service';
import { getAdminPaidAcquisitionPerformance } from '../../../../src/lib/admin/paid-ads-performance-service';
import { getAdminCampaignProfitability } from '../../../../src/lib/admin/campaign-profitability-service';
import { getAdminPaidAdsScheduleWorkspace } from '../../../../src/lib/admin/paid-ads-schedule-service';
import { DrizzleAdminPaidAdsRepository } from '../../../../src/lib/db/admin-paid-ads-repository';
import { DrizzleAdminPaidAdsPerformanceRepository } from '../../../../src/lib/db/admin-paid-ads-performance-repository';
import { DrizzleAdminCampaignProfitabilityRepository } from '../../../../src/lib/db/admin-campaign-profitability-repository';
import { DrizzleAdminPaidAdsScheduleRepository } from '../../../../src/lib/db/admin-paid-ads-schedule-repository';

export const dynamic = 'force-dynamic';

function money(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency || 'BDT',
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

function number(value) {
  return new Intl.NumberFormat('en-BD').format(value || 0);
}

function spendLabel(row) {
  if (row.spendMinor !== null && row.spendCurrency) {
    return money(Math.round(row.spendMinor), row.spendCurrency);
  }
  if (!row.spendByCurrency.length) return '—';
  return row.spendByCurrency
    .map((item) => money(item.spendMinor, item.currency))
    .join(' + ');
}

function costLabel(value, currency) {
  return value !== null && currency
    ? money(Math.round(value), currency)
    : '—';
}

function roasLabel(value, row) {
  if (value !== null) return `${value.toFixed(2)}×`;
  if (row.spendByCurrency.length > 1) return 'Mixed currencies';
  if (row.spendCurrency && row.spendCurrency !== row.storeCurrency) {
    return `Needs FX (${row.spendCurrency} → ${row.storeCurrency})`;
  }
  return '—';
}

function profitabilityBlockedLabel(row) {
  if (!row.settlementCoverageComplete) return 'Unsettled payments';
  if (!row.costCoverageComplete) return 'Incomplete costs';
  if (row.spendByCurrency.length > 1) return 'Mixed currencies';
  if (row.spendCurrency && row.spendCurrency !== row.storeCurrency) {
    return `Needs FX (${row.spendCurrency} → ${row.storeCurrency})`;
  }
  return '—';
}

function commerceContributionLabel(value, row) {
  if (value !== null) return money(Math.round(value), row.storeCurrency);
  if (!row.settlementCoverageComplete) return 'Unsettled payments';
  if (!row.costCoverageComplete) return 'Incomplete costs';
  return '—';
}

function profitabilityMoneyLabel(value, row) {
  return value !== null
    ? money(Math.round(value), row.storeCurrency)
    : profitabilityBlockedLabel(row);
}

function profitabilityMarginLabel(value, row) {
  return value !== null
    ? `${value.toFixed(2)}%`
    : profitabilityBlockedLabel(row);
}

function profitEfficiencyLabel(value, row) {
  if (value !== null) return `${value.toFixed(2)}×`;
  if (
    row.costCoverageComplete &&
    row.spendComparable &&
    row.spendMinor === 0
  ) {
    return 'No spend';
  }
  return profitabilityBlockedLabel(row);
}

export default async function MarketingAdsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range, raw?.from, raw?.to);
  const isIntegrationsTab = raw?.tab === 'integrations';

  const [workspace, performance, profitability, scheduleWorkspace] = await Promise.all([
    getAdminPaidAdsWorkspace(
      admin,
      new DrizzleAdminPaidAdsRepository(),
    ),
    getAdminPaidAcquisitionPerformance(
      admin.storeId,
      range,
      new DrizzleAdminPaidAdsPerformanceRepository(),
      new Date(),
      raw?.from,
      raw?.to,
    ),
    getAdminCampaignProfitability(
      admin.storeId,
      range,
      new DrizzleAdminCampaignProfitabilityRepository(),
      new Date(),
      raw?.from,
      raw?.to,
    ),
    getAdminPaidAdsScheduleWorkspace(
      admin,
      new DrizzleAdminPaidAdsScheduleRepository(),
    ),
  ]);

  if (!workspace || !performance || !profitability || !scheduleWorkspace) {
    throw new Error('Paid ads store unavailable.');
  }

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

  // Calculate high-level totals
  const totalSpendMinor = performance.rows.reduce(
    (sum, r) => sum + (r.spendMinor || 0),
    0,
  );
  const totalImpressions =
    performance.rows.reduce((sum, r) => sum + (r.impressions || 0), 0) ||
    workspace.metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalClicks =
    performance.rows.reduce((sum, r) => sum + (r.clicks || 0), 0) ||
    workspace.metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const totalPlacedOrders = performance.rows.reduce(
    (sum, r) => sum + (r.placedOrders || 0),
    0,
  );
  const totalPlacedRevenueMinor = performance.rows.reduce(
    (sum, r) => sum + (r.placedRevenueMinor || 0),
    0,
  );
  const storeCurrency = performance.rows[0]?.storeCurrency || 'BDT';
  const spendCurrency = performance.rows[0]?.spendCurrency || 'BDT';
  const avgCtrPercent = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpcMinor = totalClicks > 0 ? totalSpendMinor / totalClicks : 0;
  const overallPlacedRoas = totalSpendMinor > 0 ? totalPlacedRevenueMinor / totalSpendMinor : null;
  const fallbackSpendMinor = workspace.metrics.reduce(
    (sum, m) => sum + (m.spendMinor || 0),
    0,
  );
  const effectiveSpendMinor = totalSpendMinor > 0 ? totalSpendMinor : fallbackSpendMinor;

  const roasDisplay = overallPlacedRoas !== null ? `${overallPlacedRoas.toFixed(2)}×` : '—';
  const costPerOrder = totalPlacedOrders > 0 && effectiveSpendMinor > 0 ? money(Math.round(effectiveSpendMinor / totalPlacedOrders), spendCurrency) : '—';

  // Deterministic insights
  const adInsights = [];
  if (effectiveSpendMinor > 0 && totalPlacedRevenueMinor < effectiveSpendMinor) {
    adInsights.push({
      type: 'attention',
      title: 'Ad spend currently exceeds revenue',
      description: `For every ৳1 spent on ads, ৳${(totalPlacedRevenueMinor / effectiveSpendMinor).toFixed(2)} in attributed revenue has been recorded (${roasDisplay} ROAS). Review campaign targeting or creatives.`,
    });
  } else if (effectiveSpendMinor > 0 && totalPlacedRevenueMinor >= effectiveSpendMinor) {
    adInsights.push({
      type: 'working',
      title: `Ads are generating positive return (${roasDisplay})`,
      description: `For every ৳1 spent on ads, you earned ৳${(totalPlacedRevenueMinor / effectiveSpendMinor).toFixed(2)} in revenue.`,
    });
  }

  if (totalClicks > 50 && totalPlacedOrders === 0) {
    adInsights.push({
      type: 'attention',
      title: 'Clicks without orders',
      description: `${number(totalClicks)} people clicked your ads but zero placed an order. Check whether your landing page pricing and offer match the ad promise.`,
    });
  }

  // ==========================================
  // VIEW 1: INTEGRATIONS & SYNC (ADVANCED)
  // ==========================================
  if (isIntegrationsTab) {
    return (
      <AdminShell admin={admin}>
        <PageIntro
          pageKey="ads"
          eyebrow="Growth · Infrastructure"
          title="Integrations & Sync"
          description="Configure ad accounts, map provider campaigns, trigger manual syncs, and monitor background sync schedules."
        />

        <MarketingNav current="/admin/marketing/ads" range={range} />

        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: '8px' }}>
          <Link href={`/admin/marketing/ads?range=${range}`} className="admin-button admin-button-secondary">
            ← Back to Ad Performance
          </Link>
        </div>

        {/* Sync Controls */}
        <div className="admin-dashboard-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">Sync Provider Delivery</p>
                <h2>Meta Ads API Sync</h2>
              </div>
            </div>
            <PaidAdSyncForm accounts={accounts} editable={editable} />
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">Automation</p>
                <h2>Scheduled Background Sync</h2>
              </div>
            </div>
            {scheduleWorkspace.accounts.length ? (
              scheduleWorkspace.accounts.map((acc) => (
                <div key={acc.id} style={{ marginBottom: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-forest)' }}>
                    {acc.name} ({acc.provider})
                  </h4>
                  <PaidAdScheduleForm account={acc} editable={editable} />
                </div>
              ))
            ) : (
              <p className="admin-empty">No ad accounts available for scheduled sync.</p>
            )}
          </section>
        </div>

        {/* Registered Ad Accounts */}
        <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Accounts</p>
              <h2>Connected Ad Accounts</h2>
            </div>
            <span>{workspace.accounts.length} registered</span>
          </div>
          {workspace.accounts.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Account</th>
                    <th>External ID</th>
                    <th>Currency</th>
                    <th>Timezone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.accounts.map((account) => (
                    <tr key={account.id}>
                      <td><strong>{account.provider}</strong></td>
                      <td>{account.name}</td>
                      <td><code>{account.externalAccountId}</code></td>
                      <td>{account.currency}</td>
                      <td>{account.timezone}</td>
                      <td>
                        <span className={`admin-chip ${account.status === 'active' ? 'admin-chip-success' : 'admin-chip-neutral'}`}>
                          {account.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No ad accounts connected yet.</p>
          )}

          {editable && (
            <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--admin-border)', paddingTop: 'var(--space-4)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Register New Ad Account</h3>
              <PaidAdAccountForm editable={editable} />
            </div>
          )}
        </section>

        {/* Provider Mappings */}
        <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Mappings</p>
              <h2>Campaign Provider Mappings</h2>
            </div>
            <span>{workspace.mappings.length} mapped</span>
          </div>
          {workspace.mappings.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>External Campaign Name</th>
                    <th>External ID</th>
                    <th>Mapped Store Campaign</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.mappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td><strong>{mapping.provider}</strong></td>
                      <td>{mapping.externalCampaignName}</td>
                      <td><code>{mapping.externalCampaignId || '—'}</code></td>
                      <td><code>{mapping.campaignKey}</code></td>
                      <td>
                        <span className={`admin-chip ${mapping.status === 'active' ? 'admin-chip-success' : 'admin-chip-neutral'}`}>
                          {mapping.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No provider mappings created yet.</p>
          )}

          {editable && (
            <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--admin-border)', paddingTop: 'var(--space-4)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Create Campaign Mapping</h3>
              <PaidAdMappingForm accounts={accounts} campaigns={campaigns} editable={editable} />
            </div>
          )}
        </section>

        {/* Manual Metric Ingestion */}
        {editable && (
          <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">Manual Input</p>
                <h2>Manual Delivery Metric Ingestion</h2>
              </div>
            </div>
            <PaidAdMetricForm accounts={accounts} mappings={mappings} editable={editable} />
          </section>
        )}
      </AdminShell>
    );
  }

  // ==========================================
  // VIEW 2: BUSINESS-OWNER AD PERFORMANCE
  // ==========================================
  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="ads"
        eyebrow={`${performance.rows[0]?.campaignName ? 'Active Campaigns' : 'Paid Marketing'}`}
        title="Ad Performance"
        description="See how much you spent on ads, how many orders were generated, and your exact return on ad spend."
        controls={
          <AdminDateRangePicker
            baseUrl="/admin/marketing/ads"
            currentRange={range}
            from={performance.window.from || raw?.from}
            to={performance.window.to || raw?.to}
          />
        }
      />

      <MarketingNav
        current="/admin/marketing/ads"
        range={range}
        from={performance.window.from}
        to={performance.window.to}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
        <p className="admin-data-window" style={{ margin: 0 }}>
          Showing {performance.window.label.toLowerCase()}
        </p>
        <Link
          href={`/admin/marketing/ads?tab=integrations&range=${range}`}
          style={{ fontSize: '0.8125rem', color: 'var(--admin-forest)', fontWeight: 600, textDecoration: 'none' }}
        >
          ⚙️ Manage Accounts & Sync →
        </Link>
      </div>

      {/* Primary KPI Cards */}
      <section aria-label="Ad performance metrics" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="You Spent"
            value={effectiveSpendMinor > 0 ? money(Math.round(effectiveSpendMinor), spendCurrency) : '৳0'}
            subtitle="Total advertising spend"
            tooltip="Total money spent across your active Facebook & Instagram ad campaigns in this period."
            status="neutral"
          />
          <BusinessMetric
            title="Orders from Ads"
            value={number(totalPlacedOrders)}
            subtitle={`${costPerOrder} cost per order`}
            tooltip="Number of customer orders directly attributed to your paid ad campaigns."
            status={totalPlacedOrders > 0 ? 'good' : 'neutral'}
          />
          <BusinessMetric
            title="Revenue from Ads"
            value={money(totalPlacedRevenueMinor, storeCurrency)}
            subtitle="Attributed sales value"
            tooltip="Total gross revenue from orders placed by customers who arrived through your ads."
            status="good"
          />
          <BusinessMetric
            title="Return on Ads"
            value={roasDisplay}
            subtitle={effectiveSpendMinor > 0 ? `৳${(totalPlacedRevenueMinor / effectiveSpendMinor).toFixed(2)} earned per ৳1 spent` : 'ROAS'}
            technicalLabel="ROAS"
            tooltip="Return on Ad Spend: Revenue attributed to ads divided by ad spend. 1.0× means ৳1 in revenue for every ৳1 of ad spend, before product, delivery, returns, and operating costs. ROAS measures ad revenue efficiency, not final profit."
            status={overallPlacedRoas !== null && overallPlacedRoas >= 1 ? 'good' : 'neutral'}
          />
          <BusinessMetric
            title="Click-Through Rate"
            value={`${avgCtrPercent.toFixed(2)}%`}
            subtitle={`${number(totalClicks)} clicks / ${number(totalImpressions)} views`}
            technicalLabel="CTR"
            tooltip="Out of everyone who saw your ad on Facebook or Instagram, what percentage clicked it."
          />
          <BusinessMetric
            title="Cost Per Click"
            value={totalClicks > 0 && effectiveSpendMinor > 0 ? money(Math.round(avgCpcMinor || (effectiveSpendMinor / totalClicks)), spendCurrency) : '—'}
            subtitle="Average per link click"
            technicalLabel="CPC"
            tooltip="Average cost paid for each customer who clicked through to your store."
          />
        </div>
      </section>

      {/* Insights Engine */}
      {adInsights.length > 0 && (
        <section aria-label="Ad insights" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {adInsights.map((ins, idx) => (
              <InsightCard
                key={idx}
                type={ins.type}
                title={ins.title}
                message={ins.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Business-Owner Campaign Table */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Campaigns</p>
            <h2 style={{ fontSize: '1.125rem' }}>Campaign Performance</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Compare how each ad campaign is performing in spend, clicks, orders, and return.
            </p>
          </div>
        </div>

        {performance.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Spend</th>
                  <th>Clicks</th>
                  <th>Landing visits</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {performance.rows.map((row) => (
                  <tr key={row.campaignId}>
                    <td className="admin-stacked-cell">
                      <strong style={{ color: 'var(--admin-forest)' }}>{row.campaignName}</strong>
                      <small style={{ color: 'var(--admin-muted)' }}>{row.providers.join(' + ') || 'Meta'}</small>
                    </td>
                    <td>
                      <strong>{spendLabel(row)}</strong>
                    </td>
                    <td>
                      <span>{number(row.clicks)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginLeft: '4px' }}>({row.ctrPercent.toFixed(1)}% CTR)</span>
                    </td>
                    <td>{number(row.sessions)}</td>
                    <td>
                      <strong style={{ color: row.placedOrders > 0 ? '#166534' : 'inherit' }}>
                        {number(row.placedOrders)}
                      </strong>
                      {row.placedCpaMinor && (
                        <small style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--admin-muted)' }}>
                          {costLabel(row.placedCpaMinor, row.spendCurrency)} / order
                        </small>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: row.placedRevenueMinor > 0 ? '#166534' : 'inherit' }}>
                        {money(row.placedRevenueMinor, row.storeCurrency)}
                      </strong>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          background: row.placedRoas !== null && row.placedRoas >= 1.0 ? '#dcfce7' : 'var(--admin-bg)',
                          color: row.placedRoas !== null && row.placedRoas >= 1.0 ? '#166534' : 'inherit',
                        }}
                      >
                        {roasLabel(row.placedRoas, row)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No ad campaign performance data yet"
            description="Once your ad account is synced and customers visit through tracked campaigns, performance will appear here."
            actionText="Configure Ad Account & Mappings →"
            actionHref={`/admin/marketing/ads?tab=integrations&range=${range}`}
          />
        )}
      </section>

      {/* Technical Details: Profitability, COGS, Fulfillment */}
      <TechnicalDetails title="Technical Profitability, COGS & Settlement Accounting">
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)', marginBottom: 'var(--space-3)' }}>
          Detailed commerce accounting breaking down settled delivered orders, known item costs (COGS), fulfillment fees, and net contribution.
        </p>

        {profitability.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Spend</th>
                  <th>Delivered</th>
                  <th>Settled revenue</th>
                  <th>COGS</th>
                  <th>Fulfillment</th>
                  <th>Net contribution</th>
                  <th>Margin</th>
                  <th>Profit efficiency</th>
                </tr>
              </thead>
              <tbody>
                {profitability.rows.map((row) => (
                  <tr key={row.campaignId}>
                    <td>
                      <strong>{row.campaignName}</strong>
                      <br />
                      <small><code>{row.campaignKey}</code></small>
                    </td>
                    <td>{spendLabel(row)}</td>
                    <td>{number(row.deliveredOrders)}</td>
                    <td>{money(row.deliveredRevenueMinor, row.storeCurrency)}</td>
                    <td>{money(row.knownCogsMinor, row.storeCurrency)}</td>
                    <td>{money(row.knownFulfillmentCostMinor, row.storeCurrency)}</td>
                    <td><strong>{profitabilityMoneyLabel(row.netContributionAfterAdsMinor, row)}</strong></td>
                    <td>{profitabilityMarginLabel(row.contributionMarginPercent, row)}</td>
                    <td>{profitEfficiencyLabel(row.profitEfficiency, row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No campaign profitability rows recorded.</p>
        )}
      </TechnicalDetails>
    </AdminShell>
  );
}
