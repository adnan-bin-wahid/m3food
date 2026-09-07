import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { MARKETING_RANGES, getMarketingSources, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';
function money(minor, currency) { return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100); }
export default async function MarketingSourcesPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);
  const result = await getMarketingSources(admin.storeId, range, new DrizzleAdminMarketingAnalyticsRepository());
  if (!result) throw new Error('Marketing analytics store unavailable.');
  return <AdminShell admin={admin}>
    <header className="admin-page-header"><div><p className="admin-eyebrow">{result.store.name} · Growth</p><h1>Acquisition sources</h1><p className="admin-muted admin-header-copy">UTM and click-ID source performance connected to first-party sessions and orders.</p></div><nav className="admin-range-picker">{MARKETING_RANGES.map((option) => <Link key={option} href={`/admin/marketing/sources?range=${option}`} aria-current={range === option ? 'page' : undefined}>{option === 'all' ? 'All' : option}</Link>)}</nav></header>
    <MarketingNav current="/admin/marketing/sources" range={range} />
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Attribution</p><h2>Source performance</h2></div><span>{result.window.label}</span></div>{result.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Source</th><th>Medium</th><th>Visitors</th><th>Sessions</th><th>Product views</th><th>ATC</th><th>Checkout</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.source}><td><strong>{row.source}</strong></td><td>{row.medium || '—'}</td><td>{row.visitors}</td><td>{row.sessions}</td><td>{row.productViews}</td><td>{row.addToCarts}</td><td>{row.checkouts}</td><td>{row.orders}</td><td>{money(row.revenueMinor, result.store.currency)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No source activity in this period.</p>}</section>
  </AdminShell>;
}
