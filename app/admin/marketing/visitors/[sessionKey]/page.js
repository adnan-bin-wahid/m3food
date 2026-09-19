import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../../components/admin/AdminShell';
import MarketingNav from '../../../../../components/admin/MarketingNav';
import ClarityQuickActions from '../../../../../components/admin/ClarityQuickActions';
import TechnicalDetails from '../../../../../components/admin/marketing/TechnicalDetails';
import { requireCurrentAdmin } from '../../../../../src/lib/auth/current-admin';
import { getVisitorSessionJourney } from '../../../../../src/lib/admin/visitor-intelligence-service';
import { DrizzleAdminVisitorIntelligenceRepository } from '../../../../../src/lib/db/admin-visitor-intelligence-repository';
import { EVENT_TRANSLATIONS } from '../../../../../src/lib/admin/marketing-copy';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  preserveReportingPeriod,
} from '../../../../../src/lib/admin/reporting-period';

function date(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: timezone || 'Asia/Dhaka',
  }).format(value instanceof Date ? value : new Date(value));
}

function money(minor, currency) {
  if (minor === null || !currency) return null;
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function mask(value) {
  if (!value) return '—';
  return value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

function getHumanEventTitle(event) {
  const standard = EVENT_TRANSLATIONS[event.kind];
  if (standard) return standard.businessLabel;

  if (event.kind === 'CTA_CLICK') {
    return `Clicked "${event.elementKey || event.label || 'Order button'}"`;
  }
  if (event.kind === 'SECTION_VIEW') {
    return `Viewed section "${event.sectionKey || event.label}"`;
  }
  if (event.kind === 'SCROLL_DEPTH') {
    return `Scrolled ${event.scrollDepth}% down the page`;
  }
  return event.label || event.kind;
}

export const dynamic = 'force-dynamic';

export default async function VisitorJourneyDetailPage({ params, searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await params;
  const query = await searchParams;
  const period = parseAdminReportingPeriod(query);
  const reportingWindow = resolveAdminReportingWindow(
    period,
    new Date(),
    query?.from,
    query?.to,
  );
  const sessionKey = decodeURIComponent(raw.sessionKey || '');
  const result = await getVisitorSessionJourney(
    admin.storeId,
    sessionKey,
    new DrizzleAdminVisitorIntelligenceRepository(),
  );
  if (!result) notFound();

  // Determine session outcome
  const hasPurchased = result.timeline.some((e) => e.kind === 'PURCHASE');
  const hasStartedCheckout = result.timeline.some((e) => e.kind === 'BEGIN_CHECKOUT');
  const hasIntent = result.timeline.some((e) => e.kind === 'ADD_TO_CART');

  let outcomeLabel = 'Left without completing order';
  let outcomeBadge = 'admin-badge-neutral';
  if (hasPurchased) {
    outcomeLabel = 'Completed order successfully';
    outcomeBadge = 'admin-badge-success';
  } else if (hasStartedCheckout) {
    outcomeLabel = 'Started ordering but left before finishing';
    outcomeBadge = 'admin-badge-warning';
  } else if (hasIntent) {
    outcomeLabel = 'Showed buying intent but did not open checkout';
    outcomeBadge = 'admin-badge-info';
  }

  return (
    <AdminShell admin={admin}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link className="admin-back-link" href={preserveReportingPeriod('/admin/marketing/visitors', query)}>
          ← Back to Customers & Traffic
        </Link>
      </div>

      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{result.store.name} · Customer Journey</p>
          <h1>Visitor #{result.visitorKey ? result.visitorKey.slice(0, 8) : 'Session'}</h1>
          <p className="admin-muted admin-header-copy">
            Step-by-step browsing path for this visitor session. Personal contact fields remain private.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: '#e0f2fe',
              color: '#0369a1',
            }}
          >
            {result.source || 'Direct'}
          </span>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: hasPurchased ? '#dcfce7' : hasStartedCheckout ? '#fef3c7' : 'var(--admin-bg)',
              color: hasPurchased ? '#166534' : hasStartedCheckout ? '#92400e' : 'var(--admin-muted)',
            }}
          >
            {outcomeLabel}
          </span>
        </div>
      </header>

      <MarketingNav
        current="/admin/marketing/visitors"
        period={period}
        range={period}
        from={reportingWindow.from}
        to={reportingWindow.to}
      />

      {/* High-level session summary */}
      <section className="admin-panel admin-journey-summary" style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        <div>
          <span>Traffic Source</span>
          <strong>{result.source || 'Direct'}</strong>
          <small>{result.campaign ? `Campaign: ${result.campaign}` : 'No campaign'}</small>
        </div>
        <div>
          <span>First Interaction</span>
          <strong>{date(result.startedAt, result.store.timezone)}</strong>
        </div>
        <div>
          <span>Last Activity</span>
          <strong>{date(result.lastSeenAt, result.store.timezone)}</strong>
        </div>
        <div>
          <span>Session Outcome</span>
          <strong style={{ color: hasPurchased ? '#166534' : 'inherit' }}>
            {hasPurchased ? 'Order Placed' : hasStartedCheckout ? 'Abandoned Checkout' : 'Browsed'}
          </strong>
        </div>
        <div className="admin-journey-summary-wide">
          <span>Landing Page</span>
          <strong>{result.landingPage || 'Home'}</strong>
          <small>Referrer: {result.referrer || 'Direct / None'}</small>
        </div>
      </section>

      {/* Human-Friendly Activity Timeline */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Browsing Path</p>
            <h2 style={{ fontSize: '1.125rem' }}>What this customer did</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Chronological sequence of pages visited, buttons clicked, and checkout actions.
            </p>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
            {result.timeline.length} actions recorded
          </span>
        </div>

        <div className="admin-journey-timeline">
          {result.timeline.map((event) => {
            const humanTitle = getHumanEventTitle(event);
            const isMilestone = ['PAGE_VIEW', 'VIEW_CONTENT', 'ADD_TO_CART', 'BEGIN_CHECKOUT', 'PURCHASE'].includes(event.kind);

            return (
              <article key={`${event.kind}:${event.id}`}>
                <div
                  className="admin-journey-dot"
                  style={{
                    background: event.kind === 'PURCHASE' ? '#166534' : event.kind === 'BEGIN_CHECKOUT' ? '#d97706' : undefined,
                  }}
                />
                <div className="admin-journey-event">
                  <div className="admin-journey-event-heading">
                    <strong style={{ fontSize: '0.9375rem', color: isMilestone ? 'var(--admin-forest)' : 'inherit' }}>
                      {humanTitle}
                    </strong>
                    <time style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                      {date(event.occurredAt, result.store.timezone)}
                    </time>
                  </div>

                  <div className="admin-journey-meta">
                    {/* Technical badge as secondary context */}
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: 'var(--admin-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                      {event.kind}
                    </span>
                    {event.sectionKey ? <span>section: {event.sectionKey}</span> : null}
                    {event.elementKey ? <span>cta: {event.elementKey}</span> : null}
                    {event.scrollDepth ? <span>depth: {event.scrollDepth}%</span> : null}
                    {money(event.valueMinor, event.currency) ? (
                      <span style={{ fontWeight: 600, color: '#166534' }}>{money(event.valueMinor, event.currency)}</span>
                    ) : null}
                  </div>

                  {event.targetUrl ? <small style={{ color: 'var(--admin-muted)' }}>Target: {event.targetUrl}</small> : null}
                  {event.pageUrl ? <small style={{ color: 'var(--admin-muted)' }}>Page: {event.pageUrl}</small> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Microsoft Clarity Recording Section */}
      <section className="admin-panel admin-clarity-panel" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <p className="admin-eyebrow">Clarity Session Correlation</p>
          <h2 style={{ fontSize: '1.125rem' }}>Watch the visitor recording</h2>
          <p className="admin-muted" style={{ fontSize: '0.875rem' }}>
            Niyamah sends this anonymous visitor/session pair to Microsoft Clarity. Click below to watch the actual session playback or review click heatmaps.
          </p>
        </div>
        <div className="admin-definition-grid" style={{ marginTop: 'var(--space-4)' }}>
          <div>
            <span>Visitor Key</span>
            <strong style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{result.visitorKey}</strong>
          </div>
          <div>
            <span>Session Key</span>
            <strong style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{result.sessionKey}</strong>
          </div>
          <div>
            <span>Clarity Status</span>
            <strong>{result.store.clarityProjectId ? `Active (${result.store.clarityProjectId})` : 'Not configured'}</strong>
          </div>
        </div>
        {result.store.clarityProjectId && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <ClarityQuickActions
              clarityProjectId={result.store.clarityProjectId}
              sessionKey={result.sessionKey}
              visitorKey={result.visitorKey}
            />
          </div>
        )}
      </section>

      {/* Collapsible Technical Details */}
      <TechnicalDetails title="Technical Session Identifiers & Raw Payload">
        <div className="admin-definition-grid">
          <div>
            <span>Full Session Key</span>
            <code style={{ fontSize: '0.75rem' }}>{result.sessionKey}</code>
          </div>
          <div>
            <span>Full Visitor Key</span>
            <code style={{ fontSize: '0.75rem' }}>{result.visitorKey}</code>
          </div>
          <div>
            <span>Store ID</span>
            <code style={{ fontSize: '0.75rem' }}>{admin.storeId}</code>
          </div>
          <div>
            <span>Event Count</span>
            <strong>{result.timeline.length}</strong>
          </div>
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}
