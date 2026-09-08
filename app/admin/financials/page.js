import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import {
  MARKETING_RANGES,
  parseMarketingRange,
} from '../../../src/lib/admin/marketing-analytics-service';
import { getAdminFinancialIntelligence } from '../../../src/lib/admin/financial-intelligence-service';
import { DrizzleAdminStoreFinancialSummaryRepository } from '../../../src/lib/db/admin-store-financial-summary-repository';
import { DrizzleAdminChannelFinancialSummaryRepository } from '../../../src/lib/db/admin-channel-financial-summary-repository';

const RANGE_LABELS = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
};

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-BD').format(value);
}

function formatPercent(value) {
  return value === null ? '\u2014' : `${value.toFixed(2)}%`;
}

function formatFinancialMoney(value, currency) {
  return value === null ? 'Incomplete' : formatMoney(value, currency);
}

function formatSpend(summary, storeCurrency) {
  if (summary.spendComparable) {
    return formatMoney(summary.spendMinor ?? 0, storeCurrency);
  }

  if (!summary.spendByCurrency.length) return 'Not comparable';

  return summary.spendByCurrency
    .map((row) => formatMoney(row.spendMinor, row.currency))
    .join(' + ');
}

function channelLabel(channel) {
  if (channel === 'META') return 'Meta';
  if (channel === 'GOOGLE') return 'Google';
  if (channel === 'ORGANIC') return 'Organic';
  return 'Other';
}

function channelLink(channel) {
  return channel === 'META' || channel === 'GOOGLE'
    ? '/admin/marketing/ads'
    : '/admin/marketing/sources';
}

export default async function FinancialsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const query = await searchParams;
  const range = parseMarketingRange(query?.range);
  const now = new Date();

  const intelligence = await getAdminFinancialIntelligence(
    admin.storeId,
    range,
    new DrizzleAdminStoreFinancialSummaryRepository(),
    new DrizzleAdminChannelFinancialSummaryRepository(),
    now,
  );

  if (!intelligence) {
    throw new Error('Financial intelligence is unavailable for this store.');
  }

  const summary = intelligence.store;
  const currency = summary.storeCurrency;

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Business intelligence</p>
          <h1>Financial intelligence</h1>
          <p className="admin-muted admin-header-copy">
            First-party realized profitability with strict cost coverage and
            paid-spend currency safeguards.
          </p>
        </div>

        <nav className="admin-range-picker" aria-label="Financial date range">
          {MARKETING_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin/financials?range=${option}`}
              aria-current={range === option ? 'page' : undefined}
            >
              {RANGE_LABELS[option]}
            </Link>
          ))}
        </nav>
      </header>

      <p className="admin-data-window">
        Showing {intelligence.window.label.toLowerCase()}
      </p>

      {intelligence.warnings.map((warning) => (
        <section className="admin-panel" key={warning.code}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Decision safeguard</p>
              <h2>
                {warning.code === 'COST_COVERAGE_INCOMPLETE'
                  ? 'Cost coverage incomplete'
                  : 'Paid spend is not currency-comparable'}
              </h2>
            </div>
          </div>
          <p className="admin-note">{warning.message}</p>
        </section>
      ))}

      <section className="admin-metric-grid" aria-label="Financial summary">
        <article className="admin-metric-card admin-metric-card-accent">
          <span>Delivered revenue</span>
          <strong>{formatMoney(summary.deliveredRevenueMinor, currency)}</strong>
          <small>{formatNumber(summary.deliveredOrders)} current delivered orders</small>
        </article>

        <article className="admin-metric-card">
          <span>Known COGS</span>
          <strong>{formatMoney(summary.deliveredKnownCogsMinor, currency)}</strong>
          <small>Immutable order-item cost snapshots</small>
        </article>

        <article className="admin-metric-card">
          <span>Known fulfillment</span>
          <strong>
            {formatMoney(
              summary.deliveredKnownFulfillmentCostMinor +
                summary.reversedKnownFulfillmentLossMinor,
              currency,
            )}
          </strong>
          <small>Delivered cost + reversed operational loss</small>
        </article>

        <article className="admin-metric-card admin-metric-card-accent">
          <span>Commerce contribution</span>
          <strong>
            {formatFinancialMoney(
              summary.realizedCommerceContributionMinor,
              currency,
            )}
          </strong>
          <small>Before paid-ad spend</small>
        </article>

        <article className="admin-metric-card">
          <span>Paid-ad spend</span>
          <strong>{formatSpend(summary, currency)}</strong>
          <small>
            {summary.spendComparable
              ? 'Comparable to store currency'
              : 'No FX conversion invented'}
          </small>
        </article>

        <article className="admin-metric-card admin-metric-card-accent">
          <span>Net contribution</span>
          <strong>
            {formatFinancialMoney(
              summary.netContributionAfterAdsMinor,
              currency,
            )}
          </strong>
          <small>Realized contribution after comparable ad spend</small>
        </article>

        <article className="admin-metric-card">
          <span>Contribution margin</span>
          <strong>{formatPercent(summary.contributionMarginPercent)}</strong>
          <small>Net contribution / delivered revenue</small>
        </article>

        <article className="admin-metric-card">
          <span>Cost coverage</span>
          <strong>{summary.costCoveragePercent.toFixed(2)}%</strong>
          <small>
            {summary.recognizedCostOrderCount}/{summary.recognitionOrderCount}{' '}
            recognized orders cost-complete
          </small>
        </article>
      </section>

      <section className="admin-panel" aria-labelledby="channel-profit-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Acquisition economics</p>
            <h2 id="channel-profit-heading">Channel profitability</h2>
          </div>
          <span>
            {intelligence.channels.recognizedOrders} recognized orders
          </span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Delivered</th>
                <th>Reversed</th>
                <th>Revenue</th>
                <th>Cost coverage</th>
                <th>Commerce contribution</th>
                <th>Ad spend</th>
                <th>Net contribution</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.channels.rows.map((row) => (
                <tr key={row.channel}>
                  <td>
                    <Link
                      className="admin-order-link"
                      href={channelLink(row.channel)}
                    >
                      {channelLabel(row.channel)}
                    </Link>
                  </td>
                  <td>{formatNumber(row.deliveredOrders)}</td>
                  <td>{formatNumber(row.reversedOrders)}</td>
                  <td>{formatMoney(row.deliveredRevenueMinor, currency)}</td>
                  <td>
                    {row.costCoveragePercent.toFixed(2)}%
                    {row.costCoverageComplete ? '' : ' \u00b7 incomplete'}
                  </td>
                  <td>
                    {formatFinancialMoney(
                      row.realizedCommerceContributionMinor,
                      currency,
                    )}
                  </td>
                  <td>{formatSpend(row, currency)}</td>
                  <td>
                    {formatFinancialMoney(
                      row.netContributionAfterAdsMinor,
                      currency,
                    )}
                  </td>
                  <td>{formatPercent(row.contributionMarginPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="admin-note">
          Every recognized order is assigned to exactly one last-touch acquisition
          channel. Meta and Google deduct only their own comparable provider spend;
          Organic and Other use explicit zero paid spend.
        </p>
      </section>

      <div className="admin-dashboard-grid admin-dashboard-grid-lower">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Coverage</p>
              <h2>Recognition quality</h2>
            </div>
          </div>
          <p>
            <strong>{formatNumber(summary.deliveredOrders)}</strong> delivered {'\u00b7 '}
            <strong>{formatNumber(summary.cancelledOrders)}</strong> cancelled {'\u00b7 '}
            <strong>{formatNumber(summary.returnedOrders)}</strong> returned
          </p>
          <p className="admin-note">
            Unknown item COGS or fulfillment costs never become zero. Profitability
            remains incomplete until the required financial inputs are known.
          </p>
          <Link className="admin-text-link" href="/admin/orders">
            Review order costs
          </Link>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Paid acquisition</p>
              <h2>Spend comparability</h2>
            </div>
          </div>
          <p>
            <strong>
              {summary.spendComparable ? 'Comparable' : 'Suppressed'}
            </strong>{' '}
            after-ad calculation
          </p>
          <p className="admin-note">
            Provider delivery spend is used only when currency-comparable. Provider conversions and provider revenue never replace first-party commerce truth.
          </p>
          <Link className="admin-text-link" href="/admin/marketing/ads">
            Open paid ads
          </Link>
        </section>
      </div>
    </AdminShell>
  );
}
