import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import MarketingNav from '../../../components/admin/MarketingNav';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import { MARKETING_RANGES, getMarketingOverview, parseMarketingRange } from '../../../src/lib/admin/marketing-analytics-service';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../src/lib/db/admin-marketing-analytics-repository';

const RANGE_LABELS = { '7d': '7 days', '30d': '30 days', '90d': '90 days', all: 'All time' };
function money(minor, currency) { return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100); }
function num(value) { return new Intl.NumberFormat('en-BD').format(value); }
function pct(value, total) { return total ? Math.min(100, (value / total) * 100) : 0; }

export default async function MarketingOverviewPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);
  const result = await getMarketingOverview(admin.storeId, range, new DrizzleAdminMarketingAnalyticsRepository());
  if (!result) throw new Error('Marketing analytics store unavailable.');
  const maxFunnel = Math.max(1, ...result.funnel.map((stage) => stage.value));

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">{result.store.name} · Growth</p><h1>Marketing overview</h1><p className="admin-muted admin-header-copy">First-party acquisition, funnel, order attribution and recovery readiness in one store-scoped view.</p></div>
        <nav className="admin-range-picker" aria-label="Marketing date range">
          {MARKETING_RANGES.map((option) => <Link key={option} href={`/admin/marketing?range=${option}`} aria-current={range === option ? 'page' : undefined}>{RANGE_LABELS[option]}</Link>)}
        </nav>
      </header>
      <MarketingNav current="/admin/marketing" range={range} />
      <p className="admin-data-window">Showing {result.window.label.toLowerCase()}</p>

      <section className="admin-metric-grid" aria-label="Marketing summary">
        <article className="admin-metric-card"><span>Visitors</span><strong>{num(result.events.visitors)}</strong><small>Consented first-party visitors</small></article>
        <article className="admin-metric-card"><span>Product views</span><strong>{num(result.events.productViews)}</strong><small>ViewContent events</small></article>
        <article className="admin-metric-card"><span>Add to cart</span><strong>{num(result.events.addToCarts)}</strong><small>AddToCart events</small></article>
        <article className="admin-metric-card"><span>Checkout</span><strong>{num(result.events.checkouts)}</strong><small>InitiateCheckout events</small></article>
        <article className="admin-metric-card admin-metric-card-accent"><span>Orders</span><strong>{num(result.orders.orders)}</strong><small>{result.conversionRate.toFixed(1)}% tracked visitor purchase conversion</small></article>
        <article className="admin-metric-card admin-metric-card-accent"><span>Delivered revenue</span><strong>{money(result.orders.deliveredRevenueMinor, result.store.currency)}</strong><small>{num(result.orders.deliveredOrders)} delivered orders</small></article>
        <article className="admin-metric-card"><span>Recoverable checkout</span><strong>{num(result.recoverableCheckoutContacts)}</strong><small>30m inactive, consented contact available</small></article>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Funnel</p><h2>Landing conversion journey</h2></div><Link className="admin-text-link" href={`/admin/marketing/funnel?range=${range}`}>Open funnel</Link></div>
          <div className="admin-funnel">
            {result.funnel.map((stage) => <div className="admin-funnel-row" key={stage.key}><div><span>{stage.label}</span><strong>{num(stage.value)}</strong></div><div className="admin-bar-track"><span style={{ width: `${pct(stage.value, maxFunnel)}%` }} /></div></div>)}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Channels</p><h2>Meta vs organic</h2></div><Link className="admin-text-link" href={`/admin/marketing/sources?range=${range}`}>Open sources</Link></div>
          <div className="admin-channel-list">
            {result.channels.map((channel) => <div key={channel.channel}><span className={`admin-channel-dot admin-channel-${channel.channel.toLowerCase()}`} /><p><strong>{channel.channel}</strong><small>{money(channel.revenueMinor, result.store.currency)}</small></p><b>{num(channel.orders)} orders</b></div>)}
          </div>
        </section>
      </div>

      <section className="admin-panel admin-marketing-status-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Orders</p><h2>Status outcome</h2></div></div>
        {result.statuses.length ? <div className="admin-status-grid">{result.statuses.map((row) => <article className="admin-status-card" key={row.status}><span>{row.status.replaceAll('_', ' ')}</span><strong>{num(row.orders)}</strong><small>{money(row.totalMinor, result.store.currency)}</small></article>)}</div> : <p className="admin-empty">No orders in this period.</p>}
      </section>

      <section className="admin-panel admin-marketing-source-preview">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Acquisition</p><h2>Top sources</h2></div></div>
        {result.sources.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Source</th><th>Visitors</th><th>Views</th><th>ATC</th><th>Checkout</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{result.sources.slice(0, 8).map((source) => <tr key={source.source}><td className="admin-stacked-cell"><strong>{source.source}</strong><small>{source.medium || '—'}</small></td><td>{num(source.visitors)}</td><td>{num(source.productViews)}</td><td>{num(source.addToCarts)}</td><td>{num(source.checkouts)}</td><td>{num(source.orders)}</td><td>{money(source.revenueMinor, result.store.currency)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No source activity in this period.</p>}
      </section>
    </AdminShell>
  );
}
