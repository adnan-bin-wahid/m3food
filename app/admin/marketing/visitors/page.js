import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../../components/admin/marketing/BusinessMetric';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import EmptyState from '../../../../components/admin/marketing/EmptyState';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getMarketingVisitors, parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  preserveReportingPeriod,
} from '../../../../src/lib/admin/reporting-period';
import { DrizzleAdminMarketingAnalyticsRepository } from '../../../../src/lib/db/admin-marketing-analytics-repository';

export const dynamic = 'force-dynamic';

function mask(value) {
  if (!value) return '—';
  return value.length > 14 ? `${value.slice(0, 7)}…${value.slice(-6)}` : value;
}

function date(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone || 'Asia/Dhaka',
  }).format(value instanceof Date ? value : new Date(value));
}

function money(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency || 'BDT',
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

function getStageInfo(row) {
  if (row.purchases > 0 || row.orders > 0) {
    return {
      stage: 'Completed order',
      action: 'Placed an order',
      badgeClass: 'admin-badge-success',
      outcome: row.revenueMinor > 0 ? money(row.revenueMinor, 'BDT') : 'Purchased',
    };
  }
  if (row.checkouts > 0) {
    return {
      stage: 'Started ordering',
      action: 'Opened delivery form',
      badgeClass: 'admin-badge-warning',
      outcome: 'Left without finishing',
    };
  }
  if (row.addToCarts > 0) {
    return {
      stage: 'Showed buying intent',
      action: 'Clicked order / selected package',
      badgeClass: 'admin-badge-info',
      outcome: 'Did not open checkout',
    };
  }
  if (row.productViews > 0) {
    return {
      stage: 'Viewed product',
      action: `Viewed product ${row.productViews} time${row.productViews > 1 ? 's' : ''}`,
      badgeClass: 'admin-badge-neutral',
      outcome: 'Browsed product',
    };
  }
  return {
    stage: 'Landed on store',
    action: 'Browsed store',
    badgeClass: 'admin-badge-neutral',
    outcome: 'Left quickly',
  };
}

export default async function MarketingVisitorsPage({ searchParams }) {
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
  const activeSegment = raw?.segment || 'all';

  const result = await getMarketingVisitors(
    admin.storeId,
    period,
    new DrizzleAdminMarketingAnalyticsRepository(),
    new Date(),
    reportingWindow.from,
    reportingWindow.to,
  );
  if (!result) throw new Error('Marketing analytics store unavailable.');

  const currency = result.store.currency || 'BDT';

  // Calculate visitor frequency for returning visitors
  const visitorCounts = new Map();
  for (const r of result.rows) {
    visitorCounts.set(r.visitorKey, (visitorCounts.get(r.visitorKey) || 0) + 1);
  }

  // Summary Metrics
  const totalVisitors = new Set(result.rows.map((r) => r.visitorKey)).size;
  const metaVisitors = result.rows.filter((r) => (r.source || '').toLowerCase().includes('meta')).length;
  const directVisitors = result.rows.filter((r) => (r.source || '').toLowerCase().includes('direct')).length;
  const returningVisitors = Array.from(visitorCounts.values()).filter((c) => c > 1).length;
  const highlyEngaged = result.rows.filter((r) => r.checkouts > 0 || r.addToCarts > 0 || r.productViews > 2).length;

  // Segment Filtering
  const filteredRows = result.rows.filter((row) => {
    if (activeSegment === 'interested_not_ordered') {
      return (row.addToCarts > 0 || row.productViews > 0) && row.orders === 0;
    }
    if (activeSegment === 'started_ordering_left') {
      return row.checkouts > 0 && row.orders === 0;
    }
    if (activeSegment === 'returned') {
      return (visitorCounts.get(row.visitorKey) || 0) > 1;
    }
    if (activeSegment === 'meta_ads') {
      return (row.source || '').toLowerCase().includes('meta');
    }
    if (activeSegment === 'reached_order_section') {
      return row.checkouts > 0;
    }
    if (activeSegment === 'purchased') {
      return row.orders > 0 || row.purchases > 0;
    }
    return true; // 'all'
  });

  const segments = [
    { key: 'all', label: 'All visitors', count: result.rows.length },
    { key: 'interested_not_ordered', label: "Interested but didn't order", count: result.rows.filter((r) => (r.addToCarts > 0 || r.productViews > 0) && r.orders === 0).length },
    { key: 'started_ordering_left', label: 'Started ordering but left', count: result.rows.filter((r) => r.checkouts > 0 && r.orders === 0).length },
    { key: 'returned', label: 'Returned more than once', count: returningVisitors },
    { key: 'meta_ads', label: 'Came from Meta ads', count: metaVisitors },
    { key: 'reached_order_section', label: 'Reached order section', count: result.rows.filter((r) => r.checkouts > 0).length },
    { key: 'purchased', label: 'Purchased', count: result.rows.filter((r) => r.orders > 0 || r.purchases > 0).length },
  ];

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="visitors"
        eyebrow={`${result.store.name} · Customers`}
        title="Customers & Traffic"
        description="See who visited your store, where they came from, what they did, and who is ready for follow-up."
      />

      <MarketingNav
        current="/admin/marketing/visitors"
        period={period}
        range={range}
        from={result.window.from}
        to={result.window.to}
      />

      <p className="admin-data-window" style={{ margin: '0 0 var(--space-4) 0' }}>
        Showing {result.window.label.toLowerCase()}
      </p>

      {/* Top Summary Metrics */}
      <section aria-label="Customer traffic summary" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="Total Visitors"
            value={totalVisitors}
            subtitle={`${result.rows.length} total sessions`}
            tooltip="Unique people who visited your store in this period."
          />
          <BusinessMetric
            title="Meta Visitors"
            value={metaVisitors}
            subtitle="Came from Meta ads"
            tooltip="Visitors who arrived via Facebook or Instagram ads with tracking parameters."
          />
          <BusinessMetric
            title="Direct Visitors"
            value={directVisitors}
            subtitle="Typed URL or bookmark"
            tooltip="Visitors who came directly without ad or campaign tags."
          />
          <BusinessMetric
            title="Returning Visitors"
            value={returningVisitors}
            subtitle="Visited multiple times"
            tooltip="People who returned to your store more than once, showing high brand interest."
          />
          <BusinessMetric
            title="Highly Engaged"
            value={highlyEngaged}
            subtitle="Viewed product or clicked order"
            tooltip="Visitors who viewed products multiple times, clicked order, or started checkout."
          />
        </div>
      </section>

      {/* Segment Filter Chips */}
      <section style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-muted)' }}>
            Filter by journey:
          </span>
          {segments.map((seg) => {
            const isActive = activeSegment === seg.key;
            const query = new URLSearchParams();
            query.set('period', period);
            if (period === 'custom') {
              if (raw?.from) query.set('from', raw.from);
              if (raw?.to) query.set('to', raw.to);
            }
            if (seg.key !== 'all') query.set('segment', seg.key);

            return (
              <Link
                key={seg.key}
                href={`/admin/marketing/visitors?${query.toString()}`}
                className={`admin-tab-chip ${isActive ? 'is-active' : ''}`}
                style={{
                  background: isActive ? 'var(--admin-forest, #1f6332)' : 'var(--admin-card-bg, #ffffff)',
                  color: isActive ? '#ffffff' : 'var(--admin-forest, #1f6332)',
                  border: `1px solid ${isActive ? 'var(--admin-forest, #1f6332)' : 'var(--admin-border, #d7e2d2)'}`,
                }}
              >
                <span>{seg.label}</span>
                <span
                  className="admin-tab-chip-count"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--admin-bg, #f4f7f2)',
                    color: isActive ? '#ffffff' : 'var(--admin-muted, #5e6c61)',
                  }}
                >
                  {seg.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Primary Simplified Business Visitor Table */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Customer Journeys</p>
            <h2 style={{ fontSize: '1.125rem' }}>
              {activeSegment === 'all' ? 'Recent visitor journeys' : segments.find((s) => s.key === activeSegment)?.label}
            </h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Click any customer to inspect their step-by-step browsing path and recording.
            </p>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
            Showing {filteredRows.length} session{filteredRows.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredRows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Source</th>
                  <th>What they did</th>
                  <th>Buying stage</th>
                  <th>Last seen</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const stageInfo = getStageInfo(row);
                  const isMeta = (row.source || '').toLowerCase().includes('meta');

                  return (
                    <tr key={row.sessionKey}>
                      <td className="admin-stacked-cell">
                        <Link
                          href={preserveReportingPeriod(`/admin/marketing/visitors/${encodeURIComponent(row.sessionKey)}`, raw)}
                          style={{ fontWeight: 600, color: 'var(--admin-forest)' }}
                        >
                          Visitor #{row.visitorKey ? row.visitorKey.slice(0, 6) : '—'}
                        </Link>
                        <small style={{ color: 'var(--admin-muted)' }}>
                          Session {mask(row.sessionKey)}
                        </small>
                      </td>
                      <td className="admin-stacked-cell">
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isMeta ? 'Meta Ads' : row.source || 'Direct'}
                        </strong>
                        <small style={{ color: 'var(--admin-muted)' }}>
                          {row.campaign || 'Direct / untagged'}
                        </small>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem' }}>{stageInfo.action}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              stageInfo.badgeClass === 'admin-badge-success'
                                ? '#dcfce7'
                                : stageInfo.badgeClass === 'admin-badge-warning'
                                ? '#fef3c7'
                                : stageInfo.badgeClass === 'admin-badge-info'
                                ? '#e0f2fe'
                                : 'var(--admin-bg)',
                            color:
                              stageInfo.badgeClass === 'admin-badge-success'
                                ? '#166534'
                                : stageInfo.badgeClass === 'admin-badge-warning'
                                ? '#92400e'
                                : stageInfo.badgeClass === 'admin-badge-info'
                                ? '#075985'
                                : 'var(--admin-muted)',
                          }}
                        >
                          {stageInfo.stage}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
                        {date(row.lastSeenAt, result.store.timezone)}
                      </td>
                      <td>
                        <strong
                          style={{
                            fontSize: '0.875rem',
                            color: row.orders > 0 ? '#166534' : 'var(--admin-muted)',
                          }}
                        >
                          {stageInfo.outcome}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No visitors found in this segment"
            description="Try selecting a different filter or expanding your date range to see more customer activity."
            actionText="View all visitors"
            actionHref={preserveReportingPeriod('/admin/marketing/visitors', raw)}
          />
        )}
      </section>

      {/* Technical Details: Raw Sessions Table */}
      <TechnicalDetails title="Raw Technical Session Data & Identifiers">
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)', marginBottom: 'var(--space-3)' }}>
          Engineering diagnostic view with raw visitor keys, session keys, and individual event counts.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Visitor Key</th>
                <th>Session Key</th>
                <th>Source</th>
                <th>Campaign</th>
                <th>Views</th>
                <th>ATC</th>
                <th>Checkout</th>
                <th>Purchase</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.sessionKey}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.visitorKey}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <Link href={preserveReportingPeriod(`/admin/marketing/visitors/${encodeURIComponent(row.sessionKey)}`, raw)}>
                      {row.sessionKey}
                    </Link>
                  </td>
                  <td>{row.source}</td>
                  <td>{row.campaign || '—'}</td>
                  <td>{row.productViews}</td>
                  <td>{row.addToCarts}</td>
                  <td>{row.checkouts}</td>
                  <td>{row.purchases}</td>
                  <td>{row.orders}</td>
                  <td>{money(row.revenueMinor, currency)}</td>
                  <td>{date(row.lastSeenAt, result.store.timezone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}
