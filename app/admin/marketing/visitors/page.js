import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { MARKETING_RANGES, getMarketingVisitors, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';

function mask(value) { return value.length > 14 ? `${value.slice(0, 7)}…${value.slice(-6)}` : value; }
function date(value, timezone) { return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(value instanceof Date ? value : new Date(value)); }
function money(minor, currency) { return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100); }

export default async function MarketingVisitorsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);
  const result = await getMarketingVisitors(admin.storeId, range, new DrizzleAdminMarketingAnalyticsRepository());
  if (!result) throw new Error('Marketing analytics store unavailable.');
  return <AdminShell admin={admin}>
    <header className="admin-page-header"><div><p className="admin-eyebrow">{result.store.name} · Growth</p><h1>Visitor journeys</h1><p className="admin-muted admin-header-copy">Anonymous first-party sessions with source, funnel activity and resulting orders. Personal identity is not exposed here.</p></div><nav className="admin-range-picker">{MARKETING_RANGES.map((option) => <Link key={option} href={`/admin/marketing/visitors?range=${option}`} aria-current={range === option ? 'page' : undefined}>{option === 'all' ? 'All' : option}</Link>)}</nav></header>
    <MarketingNav current="/admin/marketing/visitors" range={range} />
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Latest 100</p><h2>Tracked sessions</h2></div><span>{result.window.label}</span></div>
      {result.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Visitor / session</th><th>Source</th><th>Views</th><th>ATC</th><th>Checkout</th><th>Purchase</th><th>Orders</th><th>Revenue</th><th>Last seen</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.sessionKey}><td className="admin-stacked-cell"><strong>{mask(row.visitorKey)}</strong><small>{mask(row.sessionKey)}</small></td><td className="admin-stacked-cell"><strong>{row.source}</strong><small>{row.campaign || 'no campaign'}</small></td><td>{row.productViews}</td><td>{row.addToCarts}</td><td>{row.checkouts}</td><td>{row.purchases}</td><td>{row.orders}</td><td>{money(row.revenueMinor, result.store.currency)}</td><td>{date(row.lastSeenAt, result.store.timezone)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No consented visitor sessions in this period.</p>}
    </section>
  </AdminShell>;
}
