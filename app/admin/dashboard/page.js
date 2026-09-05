import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import {
  DASHBOARD_RANGES,
  getAdminDashboard,
  parseDashboardRange,
} from '../../../src/lib/admin/dashboard-service';
import { DrizzleAdminDashboardRepository } from '../../../src/lib/db/admin-dashboard-repository';

const RANGE_LABELS = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
};

const STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
];

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

function formatDate(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}

function statusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
}

function percentage(value, total) {
  return total === 0 ? 0 : (value / total) * 100;
}

export default async function DashboardPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const query = await searchParams;
  const range = parseDashboardRange(query?.range);
  const dashboard = await getAdminDashboard(
    admin.storeId,
    range,
    new DrizzleAdminDashboardRepository(),
  );
  const currency = dashboard.store.currency;
  const funnelMaximum = Math.max(1, ...dashboard.funnel.map((stage) => stage.value));
  const sourceMaximum = Math.max(1, ...dashboard.sources.map((source) => source.orderCount));
  const channelTotal = dashboard.channels.reduce(
    (total, channel) => total + channel.orderCount,
    0,
  );
  const statusMap = new Map(
    dashboard.statuses.map((status) => [status.status, status]),
  );

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{dashboard.store.name}</p>
          <h1>Commerce dashboard</h1>
          <p className="admin-muted admin-header-copy">
            Live, store-scoped performance through{' '}
            {formatDate(dashboard.window.endAt, dashboard.store.timezone)}.
          </p>
        </div>
        <nav className="admin-range-picker" aria-label="Dashboard date range">
          {DASHBOARD_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin/dashboard?range=${option}`}
              aria-current={range === option ? 'page' : undefined}
            >
              {RANGE_LABELS[option]}
            </Link>
          ))}
        </nav>
      </header>

      <p className="admin-data-window">Showing {dashboard.window.label.toLowerCase()}</p>

      <section className="admin-metric-grid" aria-label="Commerce summary">
        <article className="admin-metric-card">
          <span>Visitors</span>
          <strong>{formatNumber(dashboard.metrics.visitors)}</strong>
          <small>Consented tracked visitors</small>
        </article>
        <article className="admin-metric-card">
          <span>Page views</span>
          <strong>{formatNumber(dashboard.metrics.pageViews)}</strong>
          <small>Landing page activity</small>
        </article>
        <article className="admin-metric-card">
          <span>Product views</span>
          <strong>{formatNumber(dashboard.metrics.productViews)}</strong>
          <small>View-content events</small>
        </article>
        <article className="admin-metric-card">
          <span>Orders</span>
          <strong>{formatNumber(dashboard.metrics.orders)}</strong>
          <small>All order statuses</small>
        </article>
        <article className="admin-metric-card admin-metric-card-accent">
          <span>Conversion rate</span>
          <strong>{dashboard.metrics.conversionRate.toFixed(1)}%</strong>
          <small>Orders per tracked visitor</small>
        </article>
        <article className="admin-metric-card admin-metric-card-accent">
          <span>Gross order value</span>
          <strong>{formatMoney(dashboard.metrics.grossOrderValueMinor, currency)}</strong>
          <small>Cancelled and returned excluded</small>
        </article>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel" aria-labelledby="funnel-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Journey</p>
              <h2 id="funnel-heading">Activity funnel</h2>
            </div>
            <span>First-party events</span>
          </div>
          <div className="admin-funnel">
            {dashboard.funnel.map((stage) => (
              <div className="admin-funnel-row" key={stage.key}>
                <div>
                  <span>{stage.label}</span>
                  <strong>{formatNumber(stage.value)}</strong>
                </div>
                <div className="admin-bar-track" aria-label={`${stage.label}: ${stage.value}`}>
                  <span style={{ width: `${percentage(stage.value, funnelMaximum)}%` }} />
                </div>
              </div>
            ))}
          </div>
          {dashboard.metrics.visitors === 0 ? (
            <p className="admin-note">Analytics begins only after a visitor explicitly accepts analytics cookies.</p>
          ) : null}
        </section>

        <section className="admin-panel" aria-labelledby="channel-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Attribution</p>
              <h2 id="channel-heading">Meta vs organic</h2>
            </div>
            <span>{formatNumber(channelTotal)} orders</span>
          </div>
          <div className="admin-channel-stack" aria-label="Order channel distribution">
            {dashboard.channels.map((channel) => (
              <span
                key={channel.channel}
                className={`admin-channel-${channel.channel.toLowerCase()}`}
                style={{ width: `${percentage(channel.orderCount, channelTotal)}%` }}
                title={`${channel.channel}: ${channel.orderCount}`}
              />
            ))}
          </div>
          <div className="admin-channel-list">
            {dashboard.channels.map((channel) => (
              <div key={channel.channel}>
                <span className={`admin-channel-dot admin-channel-${channel.channel.toLowerCase()}`} />
                <p><strong>{channel.channel}</strong><small>{formatMoney(channel.totalMinor, currency)}</small></p>
                <b>{formatNumber(channel.orderCount)}</b>
              </div>
            ))}
          </div>
          <p className="admin-note">Meta includes Facebook and Instagram sources. Direct and explicit organic traffic count as Organic.</p>
        </section>
      </div>

      <div className="admin-dashboard-grid admin-dashboard-grid-lower">
        <section className="admin-panel" aria-labelledby="status-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Operations</p>
              <h2 id="status-heading">Order status</h2>
            </div>
          </div>
          <div className="admin-status-grid">
            {STATUS_ORDER.map((status) => {
              const row = statusMap.get(status);
              return (
                <article key={status} className={`admin-status-card admin-status-${status.toLowerCase()}`}>
                  <span>{statusLabel(status)}</span>
                  <strong>{formatNumber(row?.orderCount ?? 0)}</strong>
                  <small>{formatMoney(row?.totalMinor ?? 0, currency)}</small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="source-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Acquisition</p>
              <h2 id="source-heading">Order sources</h2>
            </div>
          </div>
          {dashboard.sources.length ? (
            <div className="admin-source-list">
              {dashboard.sources.map((source) => (
                <div key={source.source} className="admin-source-row">
                  <div>
                    <span>{source.source}</span>
                    <strong>{formatNumber(source.orderCount)}</strong>
                  </div>
                  <div className="admin-bar-track">
                    <span style={{ width: `${percentage(source.orderCount, sourceMaximum)}%` }} />
                  </div>
                  <small>{formatMoney(source.totalMinor, currency)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No attributed orders in this period.</p>
          )}
        </section>
      </div>

      <section className="admin-panel admin-recent-panel" aria-labelledby="recent-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Latest activity</p>
            <h2 id="recent-heading">Recent orders</h2>
          </div>
          <Link className="admin-text-link" href="/admin/orders">Open orders</Link>
        </div>
        {dashboard.recentOrders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr key={order.publicId}>
                    <td><Link className="admin-order-link" href={`/admin/orders/${order.publicId}`}>{order.publicId}</Link></td>
                    <td>{order.customerName}</td>
                    <td className="admin-capitalize">{order.source}</td>
                    <td><span className={`admin-status-pill admin-status-${order.status.toLowerCase()}`}>{statusLabel(order.status)}</span></td>
                    <td>{formatMoney(order.totalMinor, order.currency)}</td>
                    <td>{formatDate(order.createdAt, dashboard.store.timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No orders in this period.</p>
        )}
      </section>
    </AdminShell>
  );
}
