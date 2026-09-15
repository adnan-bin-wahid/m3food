import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import AdminDateRangePicker from '../../../../components/admin/AdminDateRangePicker';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getMarketingVisitors, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';

function mask(value) { return value.length > 14 ? `${value.slice(0, 7)}…${value.slice(-6)}` : value; }
function date(value, timezone) { return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(value instanceof Date ? value : new Date(value)); }
function money(minor, currency) { return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100); }

export default async function MarketingVisitorsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range, raw?.from, raw?.to);
  const result = await getMarketingVisitors(
    admin.storeId,
    range,
    new DrizzleAdminMarketingAnalyticsRepository(),
    new Date(),
    raw?.from,
    raw?.to,
  );
  if (!result) throw new Error('Marketing analytics store unavailable.');
  return <AdminShell admin={admin}>
    <header className="admin-page-header">
      <div>
        <p className="admin-eyebrow">{result.store.name} · Growth</p>
        <h1>Visitor journeys</h1>
        <p className="admin-muted admin-header-copy">Anonymous first-party sessions with source, funnel activity and resulting orders. Personal identity is not exposed here.</p>
      </div>
      <AdminDateRangePicker
        baseUrl="/admin/marketing/visitors"
        currentRange={range}
        from={result.window.from || raw?.from}
        to={result.window.to || raw?.to}
      />
    </header>
    <MarketingNav
      current="/admin/marketing/visitors"
      range={range}
      from={result.window.from}
      to={result.window.to}
    />
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Latest 100</p><h2>Tracked sessions</h2></div><span>{result.window.label}</span></div>
      {result.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Visitor / session</th><th>Source</th><th>Views</th><th>ATC</th><th>Checkout</th><th>Purchase</th><th>Orders</th><th>Revenue</th><th>Last seen</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.sessionKey}><td className="admin-stacked-cell"><strong>{mask(row.visitorKey)}</strong><small><Link href={`/admin/marketing/visitors/${encodeURIComponent(row.sessionKey)}`}>{mask(row.sessionKey)}</Link></small></td><td className="admin-stacked-cell"><strong>{row.source}</strong><small>{row.campaign || 'no campaign'}</small></td><td>{row.productViews}</td><td>{row.addToCarts}</td><td>{row.checkouts}</td><td>{row.purchases}</td><td>{row.orders}</td><td>{money(row.revenueMinor, result.store.currency)}</td><td>{date(row.lastSeenAt, result.store.timezone)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No consented visitor sessions in this period.</p>}
    </section>
  </AdminShell>;
}
