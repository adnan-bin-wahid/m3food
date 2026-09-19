import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import EmptyState from '../../../../components/admin/marketing/EmptyState';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getMarketingSources, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import { parseAdminReportingPeriod } from '../../../../src/lib/admin/reporting-period';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';

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

function getChannelName(source, medium) {
  const s = (source || '').toLowerCase();
  const m = (medium || '').toLowerCase();

  if (s.includes('meta') || (s.includes('facebook') && (m.includes('paid') || m.includes('cpc') || m.includes('ad')))) {
    return 'Meta Ads';
  }
  if (s.includes('facebook')) {
    return 'Facebook Page / Posts';
  }
  if (s.includes('google')) {
    return m.includes('cpc') ? 'Google Ads' : 'Google Organic';
  }
  if (s === 'direct') {
    return 'Direct';
  }
  return source || 'Other';
}

export default async function MarketingSourcesPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const period = parseAdminReportingPeriod(raw);
  const range = parseMarketingRange(raw?.period || raw?.range, raw?.from, raw?.to);

  const result = await getMarketingSources(
    admin.storeId,
    range,
    new DrizzleAdminMarketingAnalyticsRepository(),
    new Date(),
    raw?.from,
    raw?.to,
  );
  if (!result) throw new Error('Marketing analytics store unavailable.');

  const currency = result.store.currency || 'BDT';

  // Group into human-readable channels
  const channelGroups = new Map();
  for (const row of result.rows) {
    const channel = getChannelName(row.source, row.medium);
    const existing = channelGroups.get(channel) || {
      channel,
      visitors: 0,
      orders: 0,
      revenueMinor: 0,
      sources: [],
    };
    existing.visitors += row.visitors;
    existing.orders += row.orders;
    existing.revenueMinor += row.revenueMinor;
    existing.sources.push(row);
    channelGroups.set(channel, existing);
  }

  const groupedCards = Array.from(channelGroups.values()).sort(
    (a, b) => b.revenueMinor - a.revenueMinor || b.orders - a.orders || b.visitors - a.visitors,
  );

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="sources"
        eyebrow={`${result.store.name} · Attribution`}
        title="Where Customers Came From"
        description="See which channels bring you the most visitors, the most orders, and the highest revenue."
      />

      <MarketingNav
        current="/admin/marketing/sources"
        period={period}
        range={range}
        from={result.window.from}
        to={result.window.to}
      />

      <p className="admin-data-window" style={{ margin: '0 0 var(--space-4) 0' }}>
        Showing {result.window.label.toLowerCase()}
      </p>

      {/* Attribution Concepts Plain-Language Explainer */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)', background: '#fdfbf7', border: '1px solid #ebdcc5' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#684512', margin: '0 0 6px' }}>
          💡 Understanding where your sales come from
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.875rem', color: '#17251b' }}>First Touch</strong>
            <p style={{ fontSize: '0.8125rem', color: '#5e6c61', margin: '2px 0 0 0', lineHeight: '1.4' }}>
              Where the customer originally found you. This reveals which ads and platforms introduce new people to your brand.
            </p>
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.875rem', color: '#17251b' }}>Last Touch</strong>
            <p style={{ fontSize: '0.8125rem', color: '#5e6c61', margin: '2px 0 0 0', lineHeight: '1.4' }}>
              The final source they used right before placing the order. This is what triggered their decision to buy.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Channel Performance Cards */}
      <section aria-label="Channels overview" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--admin-forest)', marginBottom: 'var(--space-4)' }}>
          Traffic & Revenue by Channel
        </h2>

        {groupedCards.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {groupedCards.map((card) => (
              <div
                key={card.channel}
                style={{
                  background: 'var(--admin-card-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '8px',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--admin-forest)' }}>
                      {card.channel}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--admin-bg)',
                        color: 'var(--admin-muted)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {num(card.visitors)} visitors
                    </span>
                  </div>

                  <div style={{ margin: '16px 0 8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Attributed Revenue
                    </span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', color: card.revenueMinor > 0 ? '#166534' : 'inherit' }}>
                      {money(card.revenueMinor, currency)}
                    </strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--admin-muted)' }}>
                    <strong>{num(card.orders)}</strong> {card.orders === 1 ? 'order' : 'orders'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                    {card.visitors > 0 ? `${((card.orders / card.visitors) * 100).toFixed(1)}% conversion` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No source activity recorded"
            description="When visitors arrive from Facebook, Instagram, Google, or direct links, their source breakdown will appear here."
          />
        )}
      </section>

      {/* Technical Details: Raw Source & Medium Table */}
      <TechnicalDetails title="Technical Source & Medium Breakdown">
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)', marginBottom: 'var(--space-3)' }}>
          Detailed technical breakdown by exact <code>utm_source</code> and <code>utm_medium</code> parameters.
        </p>

        {result.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Medium</th>
                  <th>Visitors</th>
                  <th>Sessions</th>
                  <th>Product views</th>
                  <th>Showed intent (ATC)</th>
                  <th>Started checkout</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={`${row.source}:${row.medium || ''}`}>
                    <td>
                      <strong>{row.source}</strong>
                    </td>
                    <td>{row.medium || '—'}</td>
                    <td>{num(row.visitors)}</td>
                    <td>{num(row.sessions)}</td>
                    <td>{num(row.productViews)}</td>
                    <td>{num(row.addToCarts)}</td>
                    <td>{num(row.checkouts)}</td>
                    <td>
                      <strong style={{ color: row.orders > 0 ? '#166534' : 'inherit' }}>
                        {num(row.orders)}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: row.revenueMinor > 0 ? '#166534' : 'inherit' }}>
                        {money(row.revenueMinor, currency)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No source rows recorded.</p>
        )}
      </TechnicalDetails>
    </AdminShell>
  );
}
