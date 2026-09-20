import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../../components/admin/marketing/BusinessMetric';
import InsightCard from '../../../../components/admin/marketing/InsightCard';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import EmptyState from '../../../../components/admin/marketing/EmptyState';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { parseAdminReportingPeriod, resolveAdminReportingWindow } from '../../../../src/lib/admin/reporting-period';
import { getVisitorIntelligenceOverview } from '../../../../src/lib/admin/visitor-intelligence-service';
import { DrizzleAdminVisitorIntelligenceRepository } from '../../../../src/lib/db/admin-visitor-intelligence-repository';

export const dynamic = 'force-dynamic';

function money(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency || 'BDT',
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

function num(value) {
  return new Intl.NumberFormat('en-BD').format(value || 0);
}

function percent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

export default async function MarketingInteractionsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const period = parseAdminReportingPeriod(raw);
  const reportingWindow = resolveAdminReportingWindow(
    period,
    new Date(),
    raw?.from,
    raw?.to,
  );
  const range = period;

  const result = await getVisitorIntelligenceOverview(
    admin.storeId,
    period,
    new DrizzleAdminVisitorIntelligenceRepository(),
    new Date(),
    reportingWindow.from,
    reportingWindow.to,
  );
  if (!result) throw new Error('Visitor intelligence store unavailable.');

  const currency = result.store.currency || 'BDT';

  // Extract Summary Metrics
  const ctaViews = result.ctas.reduce((sum, row) => sum + (row.uniqueViews || 0), 0);
  const ctaClicks = result.ctas.reduce((sum, row) => sum + (row.uniqueClicks || 0), 0);
  const ctaOrders = result.ctas.reduce((sum, row) => sum + (row.orders || 0), 0);
  const overallCtr = ctaViews > 0 ? (ctaClicks / ctaViews) * 100 : 0;

  // Scroll & Section Metrics
  const scroll25 = result.scrollDepths?.find((s) => s.scrollDepth === 25)?.uniqueSessions || 0;
  const scroll50 = result.scrollDepths?.find((s) => s.scrollDepth === 50)?.uniqueSessions || 0;
  const scroll75 = result.scrollDepths?.find((s) => s.scrollDepth === 75)?.uniqueSessions || 0;
  const scroll100 = result.scrollDepths?.find((s) => s.scrollDepth === 100)?.uniqueSessions || 0;

  const orderSection = result.sections?.find((s) =>
    s.sectionKey?.toLowerCase().includes('order') ||
    s.sectionKey?.toLowerCase().includes('package') ||
    s.sectionKey?.toLowerCase().includes('checkout')
  );
  const orderSectionSessions = orderSection?.uniqueSessions || 0;

  // Practical Business Insights
  const insights = [];
  const topCta = result.ctas.sort((a, b) => (b.orders || 0) - (a.orders || 0))[0];

  if (scroll25 > 0 && scroll75 > 0) {
    const dropoff = ((scroll25 - scroll75) / scroll25) * 100;
    if (dropoff > 50) {
      insights.push({
        type: 'warning',
        title: 'Many visitors leave before reading your full page',
        description: `Over ${percent(dropoff)} of visitors leave before reaching 75% of your page. Consider moving your best photos and order button higher up.`,
      });
    } else {
      insights.push({
        type: 'working',
        title: 'Visitors are actively reading down your page',
        description: `${percent(100 - dropoff)} of visitors who start reading reach the lower sections of your page.`,
      });
    }
  }

  if (topCta && topCta.uniqueViews > 0) {
    insights.push({
      type: 'working',
      title: `Top performing button: "${topCta.elementLabel || topCta.elementKey}"`,
      description: `${num(topCta.uniqueViews)} people saw this button, and ${num(topCta.uniqueClicks)} clicked it (${percent(topCta.ctr)} click rate). It resulted in ${num(topCta.orders)} completed orders.`,
    });
  }

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="interactions"
        eyebrow={`${result.store.name} · Behavior`}
        title="Customer Behavior"
        description="See what visitors are doing on your store: which buttons they see, what they click, and how far they scroll."
      />

      <MarketingNav
        current="/admin/marketing/interactions"
        period={period}
        range={range}
        from={result.window.from}
        to={result.window.to}
      />

      <p className="admin-data-window" style={{ margin: '0 0 var(--space-4) 0' }}>
        Showing {result.window.label.toLowerCase()}
      </p>

      {/* Primary KPI Grid */}
      <section aria-label="Button & Scroll Metrics" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="Saw an Order Button"
            value={num(ctaViews)}
            subtitle="People who had a button on screen"
            tooltip="Number of visitor sessions where an order button or package selection was visibly displayed."
          />
          <BusinessMetric
            title="Clicked an Order Button"
            value={num(ctaClicks)}
            subtitle={`${ctaViews ? percent((ctaClicks / ctaViews) * 100) : '0.0%'} overall click rate`}
            tooltip="Number of visitor sessions where the customer actively clicked an order button."
            status={ctaClicks > 0 ? 'good' : 'neutral'}
          />
          <BusinessMetric
            title="Reached 25% Page Depth"
            value={num(scroll25)}
            subtitle="Started reading your offer"
            tooltip="Number of visitor sessions that scrolled at least one-quarter of the way down your page."
          />
          <BusinessMetric
            title="Reached Order Section"
            value={num(orderSectionSessions)}
            subtitle="Viewed packages & checkout"
            tooltip="Number of visitor sessions that made it all the way to your order packages or checkout form."
          />
        </div>
      </section>

      {/* Actionable Insights */}
      {insights.length > 0 && (
        <section aria-label="Behavior insights" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {insights.map((ins, idx) => (
              <InsightCard
                key={idx}
                type={ins.type}
                title={ins.title}
                message={ins.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Button & Link Performance (Plain Language) */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Button Performance</p>
            <h2 style={{ fontSize: '1.125rem' }}>How your order buttons are performing</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              See how many people saw each button, how many clicked it, and which buttons generated sales.
            </p>
          </div>
        </div>

        {result.ctas.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Button / Link</th>
                  <th>Location on page</th>
                  <th>People who saw it</th>
                  <th>People who clicked</th>
                  <th>Click rate</th>
                  <th>Orders generated</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {result.ctas.map((row) => (
                  <tr key={row.elementKey}>
                    <td className="admin-stacked-cell">
                      <strong style={{ color: 'var(--admin-forest)' }}>
                        {row.elementLabel || row.elementKey}
                      </strong>
                      <small style={{ color: 'var(--admin-muted)' }}>{row.elementKey}</small>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
                        {row.sectionKey || 'Main page'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.875rem' }}>{num(row.uniqueViews)}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginLeft: '4px' }}>people</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.875rem' }}>{num(row.uniqueClicks)}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginLeft: '4px' }}>clicked</span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          background: row.ctr >= 15 ? '#dcfce7' : 'var(--admin-bg)',
                          color: row.ctr >= 15 ? '#166534' : 'inherit',
                        }}
                      >
                        {percent(row.ctr)}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: row.orders > 0 ? '#166534' : 'inherit' }}>
                        {num(row.orders)}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: row.revenueMinor > 0 ? '#166534' : 'inherit' }}>
                        {money(row.revenueMinor, result.store.currency)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No button interactions recorded yet"
            description="When visitors see or click buttons on your store, detailed engagement metrics will appear here."
          />
        )}
      </section>

      {/* Page Scroll Depth & Section Reach */}
      <div className="admin-dashboard-grid admin-intelligence-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Scroll Behavior</p>
              <h2 style={{ fontSize: '1.125rem' }}>How far visitors scroll</h2>
              <p className="admin-muted" style={{ fontSize: '0.8125rem', margin: '2px 0 0 0' }}>
                Percentage of the page reached before leaving.
              </p>
            </div>
          </div>
          {result.scrollDepths.length ? (
            <div className="admin-scroll-depth-list">
              {result.scrollDepths.map((row) => {
                const maxSessions = Math.max(...result.scrollDepths.map((item) => item.uniqueSessions), 1);
                const widthPct = Math.min(100, (row.uniqueSessions / maxSessions) * 100);
                return (
                  <div key={row.scrollDepth}>
                    <span style={{ fontWeight: 600, minWidth: '42px' }}>{row.scrollDepth}%</span>
                    <div style={{ flex: 1 }}>
                      <i style={{ width: `${widthPct}%` }} />
                    </div>
                    <strong style={{ fontSize: '0.875rem' }}>{num(row.uniqueSessions)} sessions</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="admin-empty">No scroll-depth data recorded in this period.</p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Store Sections</p>
              <h2 style={{ fontSize: '1.125rem' }}>Sections viewed</h2>
              <p className="admin-muted" style={{ fontSize: '0.8125rem', margin: '2px 0 0 0' }}>
                Which parts of your page were actually looked at.
              </p>
            </div>
          </div>
          {result.sections.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Visitors</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sections.map((row) => (
                    <tr key={row.sectionKey}>
                      <td>
                        <strong>{row.sectionKey}</strong>
                      </td>
                      <td>{num(row.uniqueVisitors)}</td>
                      <td>{num(row.uniqueSessions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No section-view data recorded yet.</p>
          )}
        </section>
      </div>

      {/* Technical Details */}
      <TechnicalDetails title="Technical Interaction Diagnostics">
        <div className="admin-definition-grid">
          <div>
            <span>Total Interaction Events</span>
            <strong>{num(result.interactionEvents)}</strong>
          </div>
          <div>
            <span>Window</span>
            <strong>{result.window.label}</strong>
          </div>
          <div>
            <span>Clarity Integration</span>
            <strong>{result.store.clarityProjectId ? `Active (${result.store.clarityProjectId})` : 'Inactive'}</strong>
          </div>
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}
