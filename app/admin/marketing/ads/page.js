import Link from 'next/link';
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
import {
  MARKETING_RANGES,
  parseMarketingRange,
} from '../../../../src/lib/admin/marketing-analytics-service';
import { getAdminPaidAcquisitionPerformance } from '../../../../src/lib/admin/paid-ads-performance-service';
import { DrizzleAdminPaidAdsRepository } from '../../../../src/lib/db/admin-paid-ads-repository';
import { DrizzleAdminPaidAdsPerformanceRepository } from '../../../../src/lib/db/admin-paid-ads-performance-repository';
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

export default async function MarketingAdsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);

  const [workspace, performance] = await Promise.all([
    getAdminPaidAdsWorkspace(
      admin,
      new DrizzleAdminPaidAdsRepository(),
    ),
    getAdminPaidAcquisitionPerformance(
      admin.storeId,
      range,
      new DrizzleAdminPaidAdsPerformanceRepository(),
    ),
  ]);

  if (!workspace || !performance) {
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

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Growth · Media delivery</p>
          <h1>Paid Ads Intelligence</h1>
          <p className="admin-muted admin-header-copy">
            Provider-neutral Meta and Google delivery joined to canonical first-party campaign attribution. First-party commerce remains the conversion source of truth.
          </p>
        </div>
        <nav className="admin-range-picker">
          {MARKETING_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin/marketing/ads?range=${option}`}
              aria-current={range === option ? 'page' : undefined}
            >
              {option === 'all' ? 'All' : option}
            </Link>
          ))}
        </nav>
      </header>

      <MarketingNav current="/admin/marketing/ads" range={range} />

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Paid acquisition performance</p>
            <h2>Spend → first-party orders → revenue</h2>
          </div>
          <span>{performance.window.label}</span>
        </div>

        {performance.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Provider</th>
                  <th>Spend</th>
                  <th>Clicks</th>
                  <th>Sessions</th>
                  <th>Placed</th>
                  <th>Confirmed</th>
                  <th>Delivered</th>
                  <th>Placed revenue</th>
                  <th>Delivered revenue</th>
                  <th>Placed CPA</th>
                  <th>Delivered CPA</th>
                  <th>Placed ROAS</th>
                  <th>Delivered ROAS</th>
                </tr>
              </thead>
              <tbody>
                {performance.rows.map((row) => (
                  <tr key={row.campaignId}>
                    <td>
                      <strong>{row.campaignName}</strong>
                      <br />
                      <small><code>{row.campaignKey}</code> · {row.mappingCount} mapping{row.mappingCount === 1 ? '' : 's'}</small>
                    </td>
                    <td>{row.providers.join(' + ')}</td>
                    <td>{spendLabel(row)}</td>
                    <td>
                      {number(row.clicks)}
                      <br />
                      <small>{row.ctrPercent.toFixed(2)}% CTR</small>
                    </td>
                    <td>
                      {number(row.sessions)}
                      <br />
                      <small>{row.sessionToOrderRate.toFixed(2)}% placed CVR</small>
                    </td>
                    <td>{number(row.placedOrders)}</td>
                    <td>{number(row.confirmedReachedOrders)}</td>
                    <td>{number(row.deliveredReachedOrders)}</td>
                    <td>{money(row.placedRevenueMinor, row.storeCurrency)}</td>
                    <td>{money(row.deliveredReachedRevenueMinor, row.storeCurrency)}</td>
                    <td>{costLabel(row.placedCpaMinor, row.spendCurrency)}</td>
                    <td>{costLabel(row.deliveredCpaMinor, row.spendCurrency)}</td>
                    <td>{roasLabel(row.placedRoas, row)}</td>
                    <td>{roasLabel(row.deliveredRoas, row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            No canonical paid campaign mappings are available yet.
          </p>
        )}

        <p className="admin-note">
          Outcomes are counted once per canonical campaign even when multiple provider mappings point to it. Placed revenue includes every placed order; confirmed/delivered metrics mean the order reached that lifecycle stage. ROAS is shown only when paid spend and store revenue use the same currency.
        </p>
      </section>

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
          Foundation rule: This batch never fabricates currency conversion or ROAS. Batch 02 only shows ROAS when spend currency exactly matches store revenue currency; otherwise the UI explicitly suppresses it.
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
