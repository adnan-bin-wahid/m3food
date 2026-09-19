import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import AdminDateRangePicker from '../../../../components/admin/AdminDateRangePicker';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import BusinessFunnel from '../../../../components/admin/marketing/BusinessFunnel';
import InsightCard from '../../../../components/admin/marketing/InsightCard';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getMarketingOverview, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';

export const dynamic = 'force-dynamic';

function num(value) {
  return new Intl.NumberFormat('en-BD').format(value || 0);
}

function pct(value, total) {
  return total ? Math.min(100, (value / total) * 100) : 0;
}

function rate(value, previous) {
  return previous ? (value / previous) * 100 : 0;
}

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

  const currency = result.store?.currency || 'BDT';
  const visitors = result.events.visitors;
  const viewedProduct = result.funnel[1]?.value ?? result.events.productViews;
  const buyingIntent = result.funnel[2]?.value ?? result.events.addToCarts;
  const startedOrdering = result.funnel[3]?.value ?? result.events.checkouts;
  const completedOrders = result.funnel[4]?.value ?? result.orders.orders;

  const steps = [
    { label: 'Visited store', value: visitors, rate: 100 },
    { label: 'Viewed the product', value: viewedProduct, rate: rate(viewedProduct, visitors) },
    { label: 'Showed buying intent', value: buyingIntent, rate: rate(buyingIntent, viewedProduct) },
    { label: 'Started ordering', value: startedOrdering, rate: rate(startedOrdering, buyingIntent) },
    { label: 'Completed order', value: completedOrders, rate: rate(completedOrders, startedOrdering) },
  ];

  const checkoutDropouts = startedOrdering > completedOrders ? startedOrdering - completedOrders : 0;
  const intentDropouts = buyingIntent > startedOrdering ? buyingIntent - startedOrdering : 0;

  let opportunityText = null;
  if (checkoutDropouts >= 3) {
    opportunityText = `${num(checkoutDropouts)} people started ordering but did not finish.`;
  } else if (intentDropouts >= 5) {
    opportunityText = `${num(intentDropouts)} people showed buying intent but never opened checkout.`;
  }

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="funnel"
        eyebrow={`${result.store.name} · Sales Journey`}
        title="Sales Journey"
        description="See how visitors move from discovering your product to completing an order, and pinpoint where customers hesitate."
        controls={
          <AdminDateRangePicker
            baseUrl="/admin/marketing/funnel"
            currentRange={range}
            from={result.window.from || raw?.from}
            to={result.window.to || raw?.to}
          />
        }
      />

      <MarketingNav
        current="/admin/marketing/funnel"
        range={range}
        from={result.window.from}
        to={result.window.to}
      />

      <p className="admin-data-window" style={{ margin: '0 0 var(--space-4) 0' }}>
        Showing {result.window.label.toLowerCase()}
      </p>

      {/* Primary Visual Funnel Component */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Visual Journey</p>
            <h2 style={{ fontSize: '1.125rem' }}>Step-by-step visitor progression</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Each step shows how many people moved forward and the percentage continuing to the next stage.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Conversion
            </span>
            <strong style={{ display: 'block', fontSize: '1.5rem', color: 'var(--admin-forest)' }}>
              {result.conversionRate.toFixed(1)}%
            </strong>
          </div>
        </div>

        <BusinessFunnel
          stages={steps}
          conversionRate={result.conversionRate}
          totalVisitors={visitors}
          totalOrders={completedOrders}
          currency={currency}
        />
      </section>

      {/* Biggest Opportunity / Areas to Investigate */}
      {opportunityText && (
        <section style={{ marginBottom: 'var(--space-6)' }}>
          <InsightCard
            type="opportunity"
            title={`Biggest Opportunity: ${opportunityText}`}
            message={
              checkoutDropouts >= 5
                ? 'These visitors were ready to buy and filled in part of your order form. Consider checking whether delivery fees or payment options are causing friction, or follow up with them in Customer Recovery.'
                : 'A noticeable group of visitors clicked your order buttons but did not reach the checkout form. Verify that the button action is smooth and fast across all mobile devices.'
            }
            actionLabel="Recover these customers →"
            actionHref={`/admin/marketing/retargeting?range=${range}`}
          />
        </section>
      )}

      {/* Detailed Human Step Cards */}
      <section aria-label="Detailed funnel steps" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
          Stage Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Step 1 */}
          <article className="admin-panel" style={{ padding: 'var(--space-4)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-forest)', textTransform: 'uppercase' }}>
              Step 1
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 8px' }}>Visited Store</h4>
            <strong style={{ fontSize: '1.5rem', color: 'var(--admin-forest)' }}>{num(visitors)}</strong>
            <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
              Total people who opened your store
            </small>
          </article>

          {/* Step 2 */}
          <article className="admin-panel" style={{ padding: 'var(--space-4)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-forest)', textTransform: 'uppercase' }}>
              Step 2
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 8px' }}>Viewed Product</h4>
            <strong style={{ fontSize: '1.5rem', color: 'var(--admin-forest)' }}>{num(viewedProduct)}</strong>
            <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
              {rate(viewedProduct, visitors).toFixed(1)}% continued from visit
            </small>
            <div style={{ fontSize: '0.6875rem', color: 'var(--admin-muted)', marginTop: '6px' }}>
              Technical: ViewContent
            </div>
          </article>

          {/* Step 3 */}
          <article className="admin-panel" style={{ padding: 'var(--space-4)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-forest)', textTransform: 'uppercase' }}>
              Step 3
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 8px' }}>Showed Buying Intent</h4>
            <strong style={{ fontSize: '1.5rem', color: 'var(--admin-forest)' }}>{num(buyingIntent)}</strong>
            <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
              {rate(buyingIntent, viewedProduct).toFixed(1)}% of viewers showed intent
            </small>
            <div style={{ fontSize: '0.6875rem', color: 'var(--admin-muted)', marginTop: '6px' }}>
              Technical: AddToCart
            </div>
          </article>

          {/* Step 4 */}
          <article className="admin-panel" style={{ padding: 'var(--space-4)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-forest)', textTransform: 'uppercase' }}>
              Step 4
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 8px' }}>Started Ordering</h4>
            <strong style={{ fontSize: '1.5rem', color: 'var(--admin-forest)' }}>{num(startedOrdering)}</strong>
            <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
              {rate(startedOrdering, buyingIntent).toFixed(1)}% opened delivery form
            </small>
            <div style={{ fontSize: '0.6875rem', color: 'var(--admin-muted)', marginTop: '6px' }}>
              Technical: InitiateCheckout
            </div>
          </article>

          {/* Step 5 */}
          <article className="admin-panel" style={{ padding: 'var(--space-4)', background: '#f8faf9', border: '1px solid #c7d2ca' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              Step 5
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 8px', color: '#166534' }}>Completed Order</h4>
            <strong style={{ fontSize: '1.5rem', color: '#166534' }}>{num(completedOrders)}</strong>
            <small style={{ display: 'block', fontSize: '0.75rem', color: '#166534', marginTop: '4px' }}>
              {rate(completedOrders, startedOrdering).toFixed(1)}% finished order
            </small>
            <div style={{ fontSize: '0.6875rem', color: 'var(--admin-muted)', marginTop: '6px' }}>
              Technical: Purchase
            </div>
          </article>
        </div>
      </section>

      {/* Technical Funnel Diagnostics: Collapsed */}
      <TechnicalDetails title="Technical Funnel Normalization & Diagnostics">
        <div className="admin-definition-grid">
          <div>
            <span>Raw Page Views</span>
            <strong>{num(result.events.pageViews)}</strong>
          </div>
          <div>
            <span>Raw ViewContent Events</span>
            <strong>{num(result.events.productViews)}</strong>
          </div>
          <div>
            <span>Raw AddToCart Events</span>
            <strong>{num(result.events.addToCarts)}</strong>
          </div>
          <div>
            <span>Raw InitiateCheckout Events</span>
            <strong>{num(result.events.checkouts)}</strong>
          </div>
          <div>
            <span>Raw Purchase Events</span>
            <strong>{num(result.events.purchases)}</strong>
          </div>
          <div>
            <span>Delivered Orders</span>
            <strong>{num(result.orders.deliveredOrders)}</strong>
          </div>
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}
