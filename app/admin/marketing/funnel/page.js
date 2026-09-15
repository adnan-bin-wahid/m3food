import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import AdminDateRangePicker from '../../../../components/admin/AdminDateRangePicker';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getMarketingOverview, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';

function rate(value, previous) { return previous ? (value / previous) * 100 : 0; }
export default async function MarketingFunnelPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range, raw?.from, raw?.to);
  const result = await getMarketingOverview(
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
        <h1>Conversion funnel</h1>
        <p className="admin-muted admin-header-copy">Effy DB funnel of unique tracked visitors reaching each commerce stage, using the same normalized taxonomy wired to Meta and GA4.</p>
      </div>
      <AdminDateRangePicker
        baseUrl="/admin/marketing/funnel"
        currentRange={range}
        from={result.window.from || raw?.from}
        to={result.window.to || raw?.to}
      />
    </header>
    <MarketingNav
      current="/admin/marketing/funnel"
      range={range}
      from={result.window.from}
      to={result.window.to}
    />
    <section className="admin-funnel-detail-grid">{result.funnel.map((stage, index) => { const previous = index === 0 ? stage.value : result.funnel[index - 1].value; return <article className="admin-panel admin-funnel-stage" key={stage.key}><span>Step {index + 1}</span><h2>{stage.label}</h2><strong>{stage.value}</strong><small>{index === 0 ? 'Tracked first-party audience' : `${rate(stage.value, previous).toFixed(1)}% from previous stage`}</small></article>; })}</section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Outcome</p><h2>Tracked visitor → purchaser conversion</h2></div></div><div className="admin-big-conversion"><strong>{result.conversionRate.toFixed(1)}%</strong><p>{result.funnel.at(-1)?.value ?? 0} purchasing visitors from {result.events.visitors} tracked visitors. Total orders: {result.orders.orders}. Purchase events: {result.events.purchases}.</p></div></section>
  </AdminShell>;
}
