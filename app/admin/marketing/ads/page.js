import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
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
  MARKETING_RANGES,
  parseMarketingRange,
} from '../../../../src/lib/admin/marketing-analytics-service';
import { getAdminPaidAcquisitionPerformance } from '../../../../src/lib/admin/paid-ads-performance-service';
import { getAdminCampaignProfitability } from '../../../../src/lib/admin/campaign-profitability-service';
import { getAdminPaidAdsScheduleWorkspace } from '../../../../src/lib/admin/paid-ads-schedule-service';
import { DrizzleAdminPaidAdsRepository } from '../../../../src/lib/db/admin-paid-ads-repository';
import { DrizzleAdminPaidAdsPerformanceRepository } from '../../../../src/lib/db/admin-paid-ads-performance-repository';
import { DrizzleAdminCampaignProfitabilityRepository } from '../../../../src/lib/db/admin-campaign-profitability-repository';
import { DrizzleAdminPaidAdsScheduleRepository } from '../../../../src/lib/db/admin-paid-ads-schedule-repository';
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

function profitabilityBlockedLabel(row) {
  if (!row.costCoverageComplete) return 'Incomplete costs';
  if (row.spendByCurrency.length > 1) return 'Mixed currencies';
  if (row.spendCurrency && row.spendCurrency !== row.storeCurrency) {
    return `Needs FX (${row.spendCurrency} → ${row.storeCurrency})`;
  }
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
  const range = parseMarketingRange(raw?.range);

  const [workspace, performance, profitability, scheduleWorkspace] = await Promise.all([
    getAdminPaidAdsWorkspace(
      admin,
      new DrizzleAdminPaidAdsRepository(),
    ),
    getAdminPaidAcquisitionPerformance(
      admin.storeId,
      range,
      new DrizzleAdminPaidAdsPerformanceRepository(),
    ),
    getAdminCampaignProfitability(
      admin.storeId,
      range,
      new DrizzleAdminCampaignProfitabilityRepository(),
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
            <p className="admin-eyebrow">Campaign profitability</p>
            <h2>Delivered contribution → ad spend → net contribution</h2>
          </div>
          <span>{profitability.window.label}</span>
        </div>

        {profitability.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Provider</th>
                  <th>Spend</th>
                  <th>Delivered orders</th>
                  <th>Delivered revenue</th>
                  <th>Known COGS</th>
                  <th>Fulfillment cost</th>
                  <th>Contribution before ads</th>
                  <th>Net contribution after ads</th>
                  <th>Contribution margin</th>
                  <th>Profit efficiency</th>
                  <th>Cost coverage</th>
                </tr>
              </thead>
              <tbody>
                {profitability.rows.map((row) => (
                  <tr key={row.campaignId}>
                    <td>
                      <strong>{row.campaignName}</strong>
                      <br />
                      <small><code>{row.campaignKey}</code> · {row.mappingCount} mapping{row.mappingCount === 1 ? '' : 's'}</small>
                    </td>
                    <td>{row.providers.join(' + ')}</td>
                    <td>{spendLabel(row)}</td>
                    <td>{number(row.deliveredOrders)}</td>
                    <td>{money(row.deliveredRevenueMinor, row.storeCurrency)}</td>
                    <td>{money(row.knownCogsMinor, row.storeCurrency)}</td>
                    <td>{money(row.knownFulfillmentCostMinor, row.storeCurrency)}</td>
                    <td>
                      {row.contributionBeforeAdsMinor !== null
                        ? money(row.contributionBeforeAdsMinor, row.storeCurrency)
                        : 'Incomplete costs'}
                    </td>
                    <td>{profitabilityMoneyLabel(row.netContributionAfterAdsMinor, row)}</td>
                    <td>{profitabilityMarginLabel(row.contributionMarginPercent, row)}</td>
                    <td>{profitEfficiencyLabel(row.profitEfficiency, row)}</td>
                    <td>
                      {row.deliveredOrders === 0 ? (
                        <span>No delivered orders</span>
                      ) : (
                        <>
                          <strong>{row.fullyCostedOrders}/{row.deliveredOrders} fully costed</strong>
                          <br />
                          <small>{row.knownItemCostCount}/{row.totalItemCount} item COGS · {row.knownFulfillmentCostOrders}/{row.deliveredOrders} fulfillment</small>
                        </>
                      )}
                    </td>
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
          Profitability uses only current DELIVERED first-party orders with canonical last-touch attribution. Unknown item COGS or fulfillment cost never becomes zero. Contribution before ads stays visible when costs are complete; net contribution, margin, and profit efficiency are suppressed when spend currency cannot be compared to the store currency without FX.
        </p>
      </section>

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
          <div>
            <p className="admin-eyebrow">Automation</p>
            <h2>Scheduled sync controls</h2>
          </div>
          <span>Owner / Admin</span>
        </div>

        {scheduleWorkspace.accounts.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Provider</th>
                  <th>Timezone</th>
                  <th>Current schedule</th>
                  <th>Latest health</th>
                  <th>Control</th>
                </tr>
              </thead>
              <tbody>
                {scheduleWorkspace.accounts.map((account) => {
                  const latest = scheduleWorkspace.runs.find(
                    (run) => run.accountId === account.id,
                  );

                  return (
                    <tr key={account.id}>
                      <td>
                        <strong>{account.name}</strong>
                        <br />
                        <small><code>{account.externalAccountId}</code></small>
                      </td>
                      <td>{account.provider}</td>
                      <td>{account.timezone}</td>
                      <td>
                        {account.syncEnabled
                          ? `Enabled · ${account.syncLookbackDays} day lookback`
                          : 'Disabled'}
                      </td>
                      <td>
                        {latest ? (
                          <>
                            <strong>{latest.status}</strong>
                            <br />
                            <small>
                              {latest.startDate} → {latest.endDate}
                            </small>
                          </>
                        ) : (
                          'No scheduled run yet'
                        )}
                      </td>
                      <td>
                        <PaidAdScheduleForm
                          editable={editable}
                          account={account}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            No paid ad accounts are available for scheduling.
          </p>
        )}

        <p className="admin-note">
          Daily scheduled runs end on the previous provider-local date. Enabling a schedule does not prove that the production cron has executed; run history below is the operational evidence.
        </p>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Scheduler evidence</p>
            <h2>Sync health & run history</h2>
          </div>
          <span>Latest 100 scheduled attempts</span>
        </div>

        {scheduleWorkspace.runs.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Account</th>
                  <th>Provider</th>
                  <th>Window</th>
                  <th>Status</th>
                  <th>Fetched</th>
                  <th>Written</th>
                  <th>Skipped</th>
                  <th>Completed</th>
                  <th>Failure</th>
                </tr>
              </thead>
              <tbody>
                {scheduleWorkspace.runs.map((run) => (
                  <tr key={run.id}>
                    <td>{run.startedAt.toLocaleString('en-BD')}</td>
                    <td>{run.accountName}</td>
                    <td>{run.provider}</td>
                    <td>{run.startDate} → {run.endDate}</td>
                    <td><strong>{run.status}</strong></td>
                    <td>{number(run.rowsFetched)}</td>
                    <td>{number(run.rowsWritten)}</td>
                    <td>{number(run.skippedUnmapped)}</td>
                    <td>
                      {run.completedAt
                        ? run.completedAt.toLocaleString('en-BD')
                        : '—'}
                    </td>
                    <td>
                      {run.errorCode ? (
                        <>
                          <strong>{run.errorCode}</strong>
                          <br />
                          <small>{run.errorMessage || 'Provider sync failed.'}</small>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            No scheduled sync attempts have been recorded yet.
          </p>
        )}

        <p className="admin-note">
          Sync health reports provider-delivery import status only. Provider conversions and provider revenue remain excluded from first-party commerce truth.
        </p>
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
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Provider API sync</p>
            <h2>Sync provider delivery</h2>
          </div>
          <span>Owner / Admin · on demand</span>
        </div>
        <PaidAdSyncForm editable={editable} accounts={accounts} />
        <p className="admin-note">
          Server-only Meta/Google credentials are used only to import mapped campaign delivery: spend, impressions and clicks. Provider conversions/revenue are never promoted to first-party commerce truth. Scheduled sync is configured above; production execution is evidenced by scheduler run history.
        </p>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Manual ingestion</p><h2>Record daily delivery</h2></div><span>Manual fallback</span></div>
        <PaidAdMetricForm editable={editable} mappings={mappings} />
      </section>
    </AdminShell>
  );
}
