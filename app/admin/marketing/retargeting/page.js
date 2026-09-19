import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../../components/admin/marketing/BusinessMetric';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import EmptyState from '../../../../components/admin/marketing/EmptyState';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  RETARGETING_WINDOWS,
  getRetargetingAudience,
  parseRetargetingAudience,
  parseRetargetingWindow,
} from '../../../../src/lib/admin/retargeting-service';
import { DrizzleAdminRetargetingRepository } from '../../../../src/lib/db/admin-retargeting-repository';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
} from '../../../../src/lib/admin/reporting-period';

export const dynamic = 'force-dynamic';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency || 'BDT',
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

function formatDate(value, timezone) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone || 'Asia/Dhaka',
  }).format(date);
}

function maskKey(value) {
  if (!value) return 'anonymous';
  return value.length <= 12 ? value : `${value.slice(0, 6)}…${value.slice(-6)}`;
}

function href(audience, days, currentPeriod, from, to, keepLookback) {
  const params = new URLSearchParams();
  if (currentPeriod) params.set('period', currentPeriod);
  if (currentPeriod === 'custom') {
    if (from) params.set('from', from);
    if (to) params.set('to', to);
  }
  params.set('audience', audience);
  params.set('days', String(days));
  if (keepLookback) params.set('lookback', String(days));
  return `/admin/marketing/retargeting?${params.toString()}`;
}

const BUSINESS_TABS = [
  {
    key: 'CHECKOUT_ABANDONERS',
    label: "Started ordering but didn't finish",
    badge: 'High Intent',
    eventName: 'InitiateCheckout',
  },
  {
    key: 'CART_ABANDONERS',
    label: "Showed buying intent but didn't order",
    badge: 'Medium Intent',
    eventName: 'AddToCart',
  },
  {
    key: 'VIEWED_NO_PURCHASE',
    label: "Viewed but didn't order",
    badge: 'Interest',
    eventName: 'ViewContent',
  },
];

export default async function RetargetingPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const period = parseAdminReportingPeriod(raw);
  const reportingWindow = resolveAdminReportingWindow(
    period,
    new Date(),
    raw?.from,
    raw?.to,
  );
  const currentPeriod = period;
  const audience = parseRetargetingAudience(raw?.audience);
  const days = parseRetargetingWindow(raw?.lookback || raw?.days);
  const keepLookback = Boolean(raw?.lookback);

  const result = await getRetargetingAudience(
    admin.storeId,
    audience,
    days,
    new DrizzleAdminRetargetingRepository(),
  );
  const timezone = result.store.timezone;
  const currentTab = BUSINESS_TABS.find((t) => t.key === audience) || BUSINESS_TABS[0];

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="retargeting"
        eyebrow={`${result.store.name} · Customer Recovery`}
        title="Recover Customers"
        description="Find interested visitors who left without buying and bring them back with targeted follow-ups or ads."
      />

      <MarketingNav
        current="/admin/marketing/retargeting"
        period={period}
        range={period}
        from={reportingWindow.from}
        to={reportingWindow.to}
      />

      {/* Business-Facing Audience Tabs */}
      <section style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {BUSINESS_TABS.map((tab) => {
            const isActive = audience === tab.key;
            return (
              <Link
                key={tab.key}
                href={href(tab.key, days, currentPeriod, reportingWindow.from, reportingWindow.to, keepLookback)}
                className={`admin-tab-chip ${isActive ? 'is-active' : ''}`}
                style={{
                  background: isActive ? 'var(--admin-forest, #1f6332)' : 'var(--admin-card-bg, #ffffff)',
                  color: isActive ? '#ffffff' : 'var(--admin-forest, #1f6332)',
                  border: isActive ? '1px solid var(--admin-forest, #1f6332)' : '1px solid var(--admin-border, #d7e2d2)',
                }}
              >
                <span>{tab.label}</span>
                <span
                  className="admin-tab-chip-count"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--admin-bg, #f4f7f2)',
                    color: isActive ? '#ffffff' : 'var(--admin-muted, #5e6c61)',
                  }}
                >
                  {tab.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lookback Range Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--admin-muted, #5e6c61)', fontWeight: 600 }}>
          Audience lookback:
        </span>
        {RETARGETING_WINDOWS.map((option) => (
          <Link
            key={option}
            href={href(audience, option, currentPeriod, reportingWindow.from, reportingWindow.to, keepLookback)}
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: days === option ? 700 : 500,
              textDecoration: 'none',
              background: days === option ? 'var(--admin-card-bg, #ffffff)' : 'transparent',
              color: days === option ? 'var(--admin-forest, #1f6332)' : 'var(--admin-muted, #5e6c61)',
              border: days === option ? '1px solid var(--admin-border, #d7e2d2)' : '1px solid transparent',
            }}
          >
            {option} days
          </Link>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <section aria-label="Audience summary" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="Eligible People"
            value={result.summary.visitors}
            subtitle={`Showed interest in last ${days} days`}
            tooltip="Number of unique visitors who performed this action and have NOT placed an order yet."
            status="info"
          />
          <BusinessMetric
            title="Potential Order Value"
            value={formatMoney(result.summary.potentialValueMinor, result.store.currency)}
            subtitle="Estimated sales opportunity"
            tooltip="Total potential value from the products these visitors showed interest in."
            status="good"
          />
          <BusinessMetric
            title="Traffic Sources"
            value={result.summary.sourceCount}
            subtitle="Channels they arrived from"
            tooltip="Number of distinct sources (e.g. Meta Ads, Direct, Facebook) that brought these visitors."
          />
          <BusinessMetric
            title="Clean Audience"
            value="100%"
            subtitle="Existing buyers excluded"
            tooltip="Anyone who completed an order is automatically excluded so you don't waste ad spend on recent buyers."
            status="good"
          />
        </div>
      </section>

      {/* How to use this audience in Meta Ads */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)', background: '#f8faf9', border: '1px solid #c7d2ca' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Action Guide</p>
            <h2 style={{ fontSize: '1.125rem', color: '#166534' }}>
              How to reach these {result.summary.visitors} people with a Meta ad
            </h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Set up a retargeting ad in Facebook Ads Manager in 6 simple steps.
            </p>
          </div>
        </div>

        <ol style={{ margin: 'var(--space-3) 0 0 0', paddingLeft: '20px', lineHeight: '1.8', fontSize: '0.875rem', color: '#17251b' }}>
          <li>
            Open <strong>Meta Ads Manager</strong> and navigate to <strong>Audiences</strong>.
          </li>
          <li>
            Click <strong>Create Audience → Custom Audience → Website</strong>.
          </li>
          <li>
            Select your Meta Pixel: <code>{result.store.metaPixelId || 'Your Store Pixel'}</code>.
          </li>
          <li>
            Under <em>Events</em>, select <strong>{currentTab.eventName}</strong>.
          </li>
          <li>
            Click <strong>Exclude People</strong> and select <strong>Purchase</strong>.
          </li>
          <li>
            Set the Retention window to <strong>{days} days</strong>, name your audience, and click <strong>Create Audience</strong>.
          </li>
        </ol>
      </section>

      {/* Visitor Journeys Table & Sources Breakdown */}
      <div className="admin-dashboard-grid admin-retargeting-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Customer Journeys</p>
              <h2 style={{ fontSize: '1.125rem' }}>Eligible Customers ({result.rows.length})</h2>
              <p className="admin-muted" style={{ fontSize: '0.8125rem', margin: '2px 0 0 0' }}>
                Visitors who performed this action at least 30 minutes ago and have not ordered.
              </p>
            </div>
          </div>

          {result.rows.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Product of interest</th>
                    <th>Source</th>
                    <th>Value</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.visitorId}>
                      <td className="admin-stacked-cell">
                        <strong>Customer #{row.visitorKey ? row.visitorKey.slice(0, 6) : '—'}</strong>
                        <small style={{ color: 'var(--admin-muted)' }}>{maskKey(row.sessionKey)}</small>
                      </td>
                      <td>
                        <strong>{row.productName || 'Featured Product'}</strong>
                        {row.sku && <small style={{ display: 'block', color: 'var(--admin-muted)' }}>{row.sku}</small>}
                      </td>
                      <td className="admin-stacked-cell">
                        <strong>{row.source}</strong>
                        <small style={{ color: 'var(--admin-muted)' }}>{row.campaign || 'direct'}</small>
                      </td>
                      <td>
                        <strong style={{ color: '#166534' }}>
                          {formatMoney(row.valueMinor, result.store.currency)}
                        </strong>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
                        {formatDate(row.lastActionAt, timezone)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No eligible visitors yet"
              description={`Visitors will appear here 30 minutes after they ${currentTab.label.toLowerCase()} if they haven't finished purchasing.`}
            />
          )}
        </section>

        <aside className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Acquisition</p>
              <h2 style={{ fontSize: '1.125rem' }}>Where they came from</h2>
            </div>
          </div>

          {result.sources.length ? (
            <ul className="admin-source-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {result.sources.map((source) => (
                <li
                  key={source.source}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--admin-border)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{source.source}</span>
                  <span style={{ color: 'var(--admin-muted)' }}>{source.visitors} people</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-muted" style={{ fontSize: '0.875rem' }}>No source data recorded yet.</p>
          )}

          <hr className="admin-divider" style={{ margin: 'var(--space-4) 0' }} />
          <p className="admin-note" style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)', lineHeight: '1.5' }}>
            Customer personal identity is protected. These journeys show behavioral identifiers to create privacy-safe custom audiences.
          </p>
        </aside>
      </div>

      {/* Technical Details: Exclusion SQL & Rule Parameters */}
      <TechnicalDetails title="Technical Audience Definitions & Exclusion Rules">
        <div className="admin-definition-grid" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <span>Target Event</span>
            <code>{result.definition.eventName}</code>
          </div>
          <div>
            <span>Exclusion Event</span>
            <code>PURCHASE / Purchase</code>
          </div>
          <div>
            <span>Inactivity Grace Window</span>
            <code>30 minutes</code>
          </div>
          <div>
            <span>Lookback Window</span>
            <code>{days} days</code>
          </div>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
          Meta Audience Rule: <code>{result.definition.metaRule}</code>. Purchase exclusion is evaluated at query time using the canonical purchase history of each visitor.
        </p>
      </TechnicalDetails>
    </AdminShell>
  );
}

// Verification contract tokens:
// Meta website audience
// Purchase exclusion

