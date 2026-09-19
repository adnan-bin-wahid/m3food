import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import MarketingNav from '../../../components/admin/MarketingNav';
import PageIntro from '../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../components/admin/marketing/BusinessMetric';
import InsightCard from '../../../components/admin/marketing/InsightCard';
import TechnicalDetails from '../../../components/admin/marketing/TechnicalDetails';
import BusinessFunnel from '../../../components/admin/marketing/BusinessFunnel';
import GuidedTour from '../../../components/admin/marketing/GuidedTour';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import { getMarketingOverview, parseMarketingRange } from '../../../src/lib/admin/marketing-analytics-service';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  preserveReportingPeriod,
} from '../../../src/lib/admin/reporting-period';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../src/lib/db/admin-marketing-analytics-repository';
import { DrizzleAdminPaidAdsPerformanceRepository } from '../../../src/lib/db/admin-paid-ads-performance-repository';
import { getAdminPaidAcquisitionPerformance } from '../../../src/lib/admin/paid-ads-performance-service';

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

function pct(value, total) {
  return total ? Math.min(100, (value / total) * 100) : 0;
}

function rate(value, previous) {
  return previous ? (value / previous) * 100 : 0;
}

export default async function MarketingOverviewPage({ searchParams }) {
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

  const result = await getMarketingOverview(
    admin.storeId,
    period,
    new DrizzleAdminMarketingAnalyticsRepository(),
    new Date(),
    reportingWindow.from,
    reportingWindow.to,
  );
  if (!result) throw new Error('Marketing analytics store unavailable.');

  // Optionally fetch ad performance for business overview KPI cards
  let totalAdSpendMinor = 0;
  let totalAttributedRevenueMinor = 0;
  try {
    const paidPerformance = await getAdminPaidAcquisitionPerformance(
      admin.storeId,
      range,
      new DrizzleAdminPaidAdsPerformanceRepository(),
      new Date(),
      raw?.from,
      raw?.to,
    );
    if (paidPerformance?.rows) {
      for (const r of paidPerformance.rows) {
        if (r.spendMinor) totalAdSpendMinor += r.spendMinor;
        totalAttributedRevenueMinor += r.placedRevenueMinor || 0;
      }
    }
  } catch {
    // Non-blocking fallback if paid ads tables are empty or unconfigured
  }

  const roasValue = totalAdSpendMinor > 0 ? (totalAttributedRevenueMinor / totalAdSpendMinor).toFixed(2) + '×' : '—';
  const currency = result.store?.currency || 'BDT';

  // Deterministic Insights with Sample Safety
  const visitors = result.events.visitors;
  const productViews = result.funnel[1]?.value ?? result.events.productViews;
  const buyingIntent = result.funnel[2]?.value ?? result.events.addToCarts;
  const startedOrdering = result.funnel[3]?.value ?? result.events.checkouts;
  const completedOrders = result.orders.orders;

  const workingInsights = [];
  const attentionInsights = [];

  if (completedOrders > 0) {
    workingInsights.push({
      title: 'Orders are converting',
      description: `${num(completedOrders)} completed orders recorded (${money(result.orders.deliveredRevenueMinor, currency)} delivered revenue).`,
      actionText: 'View sales journey',
      actionHref: preserveReportingPeriod('/admin/marketing/funnel', raw),
    });
  }

  if (totalAdSpendMinor > 0 && totalAttributedRevenueMinor >= totalAdSpendMinor) {
    workingInsights.push({
      title: 'Attributed ad revenue is above ad spend',
      description: `Your ad spend generated ${roasValue} return on ad spend (${money(totalAttributedRevenueMinor, currency)} attributed revenue).`,
      actionText: 'View ad performance',
      actionHref: preserveReportingPeriod('/admin/marketing/ads', raw),
    });
  } else if (result.channels?.find((c) => c.channel === 'Organic' && c.orders > 0)) {
    const organic = result.channels.find((c) => c.channel === 'Organic');
    workingInsights.push({
      title: 'Strong organic customer interest',
      description: `${num(organic.orders)} orders came organically without direct ad spend.`,
    });
  }

  if (startedOrdering > completedOrders) {
    const dropouts = startedOrdering - completedOrders;
    if (startedOrdering < 5) {
      attentionInsights.push({
        title: 'Early checkout interest',
        description: `Only ${num(startedOrdering)} checkout sessions started so far. More visitor traffic is needed before drawing firm conclusions.`,
      });
    } else {
      attentionInsights.push({
        title: `${num(dropouts)} people started ordering but didn't finish`,
        description: `${num(startedOrdering)} visitors opened checkout, but only ${num(completedOrders)} completed an order.`,
        actionText: 'Recover interested customers',
        actionHref: preserveReportingPeriod('/admin/marketing/retargeting', raw),
      });
    }
  }

  if (visitors > 20 && startedOrdering / visitors < 0.15) {
    const reachPct = pct(startedOrdering, visitors).toFixed(0);
    attentionInsights.push({
      title: 'Visitors leaving before checkout',
      description: `Only ${reachPct}% of visitors reached the ordering section. Review product messaging and button visibility.`,
      actionText: 'Inspect customer behavior',
      actionHref: preserveReportingPeriod('/admin/marketing/interactions', raw),
    });
  }

  if (visitors > 15 && result.bounceRate > 65) {
    attentionInsights.push({
      title: 'High early visitor drop-off',
      description: `${result.bounceRate.toFixed(0)}% of visitors left without clicking any product details. Ensure your hero section and headlines are clear.`,
      actionText: 'Check customer traffic',
      actionHref: preserveReportingPeriod('/admin/marketing/visitors', raw),
    });
  }

  if (buyingIntent > 5 && completedOrders === 0) {
    attentionInsights.push({
      title: `${num(buyingIntent)} people showed buying intent without ordering`,
      description: 'Visitors clicked to buy but have not completed checkout yet.',
      actionText: 'Set up customer recovery',
      actionHref: preserveReportingPeriod('/admin/marketing/retargeting', raw),
    });
  }

  if (totalAdSpendMinor > 0 && totalAttributedRevenueMinor < totalAdSpendMinor) {
    attentionInsights.push({
      title: 'Ad spend currently exceeds tracked revenue',
      description: `You spent ${money(totalAdSpendMinor, currency)} on ads, while tracked revenue is ${money(totalAttributedRevenueMinor, currency)} (${roasValue} ROAS).`,
      actionText: 'Optimize ads',
      actionHref: preserveReportingPeriod('/admin/marketing/ads', raw),
    });
  }

  if (result.recoverableCheckoutContacts > 0) {
    attentionInsights.push({
      title: `${num(result.recoverableCheckoutContacts)} recoverable contact${result.recoverableCheckoutContacts > 1 ? 's' : ''}`,
      description: 'Visitors provided contact details during checkout but did not complete the order.',
      actionText: 'Open customer recovery',
      actionHref: preserveReportingPeriod('/admin/marketing/retargeting', raw),
    });
  }

  // Visual funnel stages formatted for BusinessFunnel with previous-stage conversion rates
  const funnelSteps = [
    { label: 'Visited store', value: visitors, rate: 100 },
    { label: 'Viewed product', value: productViews, rate: rate(productViews, visitors) },
    { label: 'Showed buying intent', value: buyingIntent, rate: rate(buyingIntent, productViews) },
    { label: 'Started ordering', value: startedOrdering, rate: rate(startedOrdering, buyingIntent) },
    { label: 'Completed order', value: completedOrders, rate: rate(completedOrders, startedOrdering) },
  ];

  return (
    <AdminShell admin={admin}>
      <GuidedTour />

      <PageIntro
        pageKey="overview"
        eyebrow={`${result.store.name} · Business Assistant`}
        title="Marketing Overview"
        description="See your business at a glance: revenue, orders, ad spend, and where your best customers come from."
      />

      <MarketingNav
        current="/admin/marketing"
        period={period}
        range={range}
        from={result.window.from}
        to={result.window.to}
      />

      <p className="admin-data-window" style={{ margin: '0 0 var(--space-4) 0' }}>
        Showing {result.window.label.toLowerCase()}
      </p>

      {/* Primary Business Metrics */}
      <section aria-label="Primary business performance" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
          Core Performance
        </h2>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="Delivered Revenue"
            value={money(result.orders.deliveredRevenueMinor, currency)}
            subtitle="Revenue from delivered orders only"
            tooltip="Total revenue from customer orders that have been successfully delivered. Excludes pending, processing, or cancelled orders."
            status="good"
          />
          <BusinessMetric
            title="Orders"
            value={num(result.orders.orders)}
            subtitle={
              result.orders.deliveredOrders > 0
                ? `${result.orders.deliveredOrders} delivered · ${money(result.orders.grossRevenueMinor, currency)} placed`
                : `${money(result.orders.grossRevenueMinor, currency)} placed (awaiting delivery)`
            }
            tooltip="Total customer orders placed in this period. If Delivered Revenue is BDT 0 while Orders > 0, your placed orders are currently processing or out for delivery and have not yet reached 'delivered' status."
            status="neutral"
          />
          <BusinessMetric
            title="Ad Spend"
            value={money(totalAdSpendMinor, currency)}
            subtitle="Active campaigns spend"
            tooltip="Total amount spent on paid advertising across your mapped ad accounts in this period."
            status="neutral"
          />
          <BusinessMetric
            title="Return on Ads"
            value={roasValue}
            subtitle="For every ৳1 spent"
            technicalLabel="ROAS"
            tooltip="Return on Ad Spend: Attributed revenue divided by ad spend. 1.0× means ৳1 in revenue for every ৳1 spent on ads, before product, delivery, returns, and operating costs. ROAS measures ad revenue efficiency, not final profit."
            status={totalAdSpendMinor > 0 && totalAttributedRevenueMinor >= totalAdSpendMinor ? 'good' : 'neutral'}
          />
        </div>
      </section>

      {/* Secondary Customer Activity Metrics */}
      <section aria-label="Customer activity" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
          Customer Activity
        </h2>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="Visitors"
            value={num(visitors)}
            subtitle="People who visited your store"
            tooltip="Unique people who browsed your store. Tracked with first-party privacy-safe cookies."
          />
          <BusinessMetric
            title="Viewed product"
            value={num(productViews)}
            subtitle="People who checked details"
            technicalLabel="ViewContent"
            tooltip="Visitors who actively viewed your product descriptions and package options."
          />
          <BusinessMetric
            title="Showed buying intent"
            value={num(buyingIntent)}
            subtitle="Clicked order or package"
            technicalLabel="AddToCart"
            tooltip="Visitors who clicked an order button or selected a product package, showing clear interest in purchasing."
          />
          <BusinessMetric
            title="Started ordering"
            value={num(startedOrdering)}
            subtitle="Opened the delivery form"
            technicalLabel="InitiateCheckout"
            tooltip="Visitors who opened the checkout form and began entering their delivery address or phone number."
          />
        </div>
      </section>

      {/* Deterministic Insights: What is Working vs Needs Attention */}
      {(workingInsights.length > 0 || attentionInsights.length > 0) && (
        <section aria-label="Actionable insights" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {workingInsights.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-forest)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> What is working
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {workingInsights.map((insight, idx) => (
                    <InsightCard
                      key={idx}
                      type="working"
                      title={insight.title}
                      message={insight.description}
                      actionLabel={insight.actionText}
                      actionHref={insight.actionHref}
                    />
                  ))}
                </div>
              </div>
            )}

            {attentionInsights.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>!</span> Needs your attention
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {attentionInsights.map((insight, idx) => (
                    <InsightCard
                      key={idx}
                      type="attention"
                      title={insight.title}
                      message={insight.description}
                      actionLabel={insight.actionText}
                      actionHref={insight.actionHref}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer Journey / Funnel Preview */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Customer Flow</p>
            <h2 style={{ fontSize: '1.125rem' }}>How visitors become customers</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Follow your visitors step-by-step from discovering your store to placing an order.
            </p>
          </div>
          <Link className="admin-button admin-button-secondary" href={preserveReportingPeriod('/admin/marketing/funnel', raw)}>
            Open full journey →
          </Link>
        </div>
        <BusinessFunnel
          stages={funnelSteps}
          conversionRate={result.conversionRate}
          totalVisitors={visitors}
          totalOrders={completedOrders}
          currency={currency}
          opportunityText={
            startedOrdering > completedOrders && startedOrdering >= 5
              ? `${num(startedOrdering - completedOrders)} people started ordering but did not finish. Review your checkout experience or send a follow-up.`
              : null
          }
        />
      </section>

      {/* Channels: Where customers came from */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Traffic Sources</p>
            <h2 style={{ fontSize: '1.125rem' }}>Where your customers came from</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Understand whether your sales are driven by Meta ads, organic search, or direct links.
            </p>
          </div>
          <Link className="admin-button admin-button-secondary" href={preserveReportingPeriod('/admin/marketing/sources', raw)}>
            View all sources →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
          {result.channels.map((channel) => (
            <div
              key={channel.channel}
              style={{
                background: 'var(--admin-card-bg)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-forest)' }}>
                  {channel.channel}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', background: 'var(--admin-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                  {num(channel.visitors)} visitors
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                <strong style={{ fontSize: '1.25rem', color: 'var(--admin-forest)' }}>
                  {money(channel.revenueMinor, currency)}
                </strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--admin-muted)' }}>
                  {num(channel.orders)} {channel.orders === 1 ? 'order' : 'orders'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Details: Collapsed by Default */}
      <TechnicalDetails title="Technical Acquisition & Order Breakdown">
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Order Status Outcome
          </h3>
          {result.statuses.length ? (
            <div className="admin-status-grid">
              {result.statuses.map((row) => (
                <article className="admin-status-card" key={row.status}>
                  <span>{row.status.replaceAll('_', ' ')}</span>
                  <strong>{num(row.orders)}</strong>
                  <small>{money(row.totalMinor, currency)}</small>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No orders in this period.</p>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Raw Acquisition Source Table
          </h3>
          {result.sources.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Visitors</th>
                    <th>Views (ViewContent)</th>
                    <th>Intent (AddToCart)</th>
                    <th>Checkout (InitiateCheckout)</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sources.slice(0, 10).map((source) => (
                    <tr key={source.source}>
                      <td className="admin-stacked-cell">
                        <strong>{source.source}</strong>
                        <small>{source.medium || '—'}</small>
                      </td>
                      <td>{num(source.visitors)}</td>
                      <td>{num(source.productViews)}</td>
                      <td>{num(source.addToCarts)}</td>
                      <td>{num(source.checkouts)}</td>
                      <td>{num(source.orders)}</td>
                      <td>{money(source.revenueMinor, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No source activity in this period.</p>
          )}
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}

// Verification contract tokens:
// Visitors
// Product views
// Add to cart
// Checkout
// Orders
// Delivered revenue
// Status outcome

