import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { MARKETING_RANGES, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { getVisitorIntelligenceOverview } from '../../../../src/lib/admin/visitor-intelligence-service';
import { DrizzleAdminVisitorIntelligenceRepository } from '../../../../src/lib/db/admin-visitor-intelligence-repository';

function money(minor, currency) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
}
function percent(value) { return `${value.toFixed(1)}%`; }

export const dynamic = 'force-dynamic';

export default async function MarketingInteractionsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);
  const result = await getVisitorIntelligenceOverview(admin.storeId, range, new DrizzleAdminVisitorIntelligenceRepository());
  if (!result) throw new Error('Visitor intelligence store unavailable.');

  const ctaViews = result.ctas.reduce((sum, row) => sum + row.uniqueViews, 0);
  const ctaClicks = result.ctas.reduce((sum, row) => sum + row.uniqueClicks, 0);
  const top = result.ctas[0] ?? null;

  return <AdminShell admin={admin}>
    <header className="admin-page-header">
      <div>
        <p className="admin-eyebrow">{result.store.name} · Intelligence</p>
        <h1>Visitor interactions</h1>
        <p className="admin-muted admin-header-copy">CTA visibility, clicks, scroll depth and section reach from the consented first-party visitor journey.</p>
      </div>
      <nav className="admin-range-picker">{MARKETING_RANGES.map((option) => <Link key={option} href={`/admin/marketing/interactions?range=${option}`} aria-current={range === option ? 'page' : undefined}>{option === 'all' ? 'All' : option}</Link>)}</nav>
    </header>
    <MarketingNav current="/admin/marketing/interactions" range={range} />

    <section className="admin-metrics-grid admin-intelligence-metrics">
      <article className="admin-metric-card"><span>Interaction events</span><strong>{result.interactionEvents}</strong><small>{result.window.label}</small></article>
      <article className="admin-metric-card"><span>CTA unique views</span><strong>{ctaViews}</strong><small>Session-level CTA impressions</small></article>
      <article className="admin-metric-card"><span>CTA unique clicks</span><strong>{ctaClicks}</strong><small>Session-level CTA click reach</small></article>
      <article className="admin-metric-card"><span>Top CTA CTR</span><strong>{top ? percent(top.ctr) : '0.0%'}</strong><small>{top?.elementLabel || top?.elementKey || 'No CTA data yet'}</small></article>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-heading"><div><p className="admin-eyebrow">CTA performance</p><h2>Views → clicks → orders</h2></div><span>{result.window.label}</span></div>
      {result.ctas.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CTA</th><th>Section</th><th>Unique views</th><th>Unique clicks</th><th>Clicks</th><th>CTR</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{result.ctas.map((row) => <tr key={row.elementKey}><td className="admin-stacked-cell"><strong>{row.elementLabel || row.elementKey}</strong><small>{row.elementKey}</small></td><td>{row.sectionKey || '—'}</td><td>{row.uniqueViews}</td><td>{row.uniqueClicks}</td><td>{row.clicks}</td><td><strong>{percent(row.ctr)}</strong></td><td>{row.orders}</td><td>{money(row.revenueMinor, result.store.currency)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No consented CTA interactions in this period yet.</p>}
    </section>

    <div className="admin-dashboard-grid admin-intelligence-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Sections</p><h2>Section reach</h2></div></div>
        {result.sections.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Section</th><th>Visitors</th><th>Sessions</th></tr></thead><tbody>{result.sections.map((row) => <tr key={row.sectionKey}><td><strong>{row.sectionKey}</strong></td><td>{row.uniqueVisitors}</td><td>{row.uniqueSessions}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No section-view data yet.</p>}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Scroll</p><h2>Scroll depth</h2></div></div>
        {result.scrollDepths.length ? <div className="admin-scroll-depth-list">{result.scrollDepths.map((row) => <div key={row.scrollDepth}><span>{row.scrollDepth}%</span><div><i style={{ width: `${Math.min(100, row.uniqueSessions ? (row.uniqueSessions / Math.max(...result.scrollDepths.map((item) => item.uniqueSessions), 1)) * 100 : 0)}%` }} /></div><strong>{row.uniqueSessions} sessions</strong></div>)}</div> : <p className="admin-empty">No scroll-depth data yet.</p>}
      </section>
    </div>

    <section className="admin-panel admin-clarity-panel">
      <div><p className="admin-eyebrow">Visual replay</p><h2>Microsoft Clarity</h2><p className="admin-muted">Clarity is {result.store.clarityProjectId ? 'configured' : 'not configured'}. When configured, Effy sends the anonymous visitor ID and session ID through Clarity Identify so the same journey can be found in recordings and heatmaps.</p></div>
      <div className="admin-clarity-actions"><span className={result.store.clarityProjectId ? 'admin-shipment-status' : 'admin-shipment-status is-failed'}>{result.store.clarityProjectId ? 'Configured' : 'Needs project ID'}</span><Link className="admin-button admin-button-secondary" href="/admin/settings">Clarity settings</Link></div>
    </section>
  </AdminShell>;
}
