import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import ClaritySessionRowAction from '../../../../components/admin/ClaritySessionRowAction';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getDatabase } from '../../../../src/lib/db';
import { stores, visitorSessions, visitors } from '../../../../src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  preserveReportingPeriod,
} from '../../../../src/lib/admin/reporting-period';

function date(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone || 'Asia/Dhaka',
  }).format(value instanceof Date ? value : new Date(value));
}

function mask(value) {
  if (!value) return '—';
  return value.length > 22 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

export const dynamic = 'force-dynamic';

export default async function ClarityHubPage({ searchParams }) {
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
  const db = getDatabase();

  const [store] = await db
    .select({
      name: stores.name,
      slug: stores.slug,
      clarityProjectId: stores.clarityProjectId,
      timezone: stores.timezone,
    })
    .from(stores)
    .where(eq(stores.id, admin.storeId))
    .limit(1);

  const clarityId = store?.clarityProjectId || '';
  const hasClarity = Boolean(clarityId);

  // Fetch recent visitor sessions
  const recentSessions = await db
    .select({
      sessionId: visitorSessions.id,
      sessionKey: visitorSessions.sessionKey,
      visitorKey: visitors.visitorKey,
      utmSource: visitorSessions.utmSource,
      utmCampaign: visitorSessions.utmCampaign,
      fbclid: visitorSessions.fbclid,
      landingPage: visitorSessions.landingPage,
      startedAt: visitorSessions.startedAt,
    })
    .from(visitorSessions)
    .innerJoin(visitors, eq(visitors.id, visitorSessions.visitorId))
    .where(eq(visitorSessions.storeId, admin.storeId))
    .orderBy(desc(visitorSessions.startedAt))
    .limit(25);

  const recordingsUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/recordings` : '#';
  const heatmapsUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/heatmaps` : '#';
  const dashboardUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/dashboard` : '#';

  const quickFilters = [
    {
      title: 'Started ordering but left',
      tag: 'Checkout dropouts',
      desc: 'Watch where customers hesitated or left while typing delivery information.',
      visitorsUrl: preserveReportingPeriod('/admin/marketing/visitors?segment=started_ordering_left', raw),
      clarityInstruction: 'In Clarity: Filter by recordings where duration > 30s or use custom tag effy_session from visitors list.',
    },
    {
      title: 'Reached order section',
      tag: 'High intent',
      desc: 'Watch visitors who scrolled all the way to packages and pricing.',
      visitorsUrl: preserveReportingPeriod('/admin/marketing/visitors?segment=reached_order_section', raw),
      clarityInstruction: 'In Clarity: Filter by scroll depth > 75%.',
    },
    {
      title: 'Came from Meta ads',
      tag: 'Paid traffic',
      desc: 'See how Facebook & Instagram ad visitors interact with your landing page.',
      visitorsUrl: preserveReportingPeriod('/admin/marketing/visitors?segment=meta_ads', raw),
      clarityInstruction: 'In Clarity: Filter by Referrer contains facebook.com or instagram.com.',
    },
    {
      title: 'Completed orders',
      tag: 'Purchased',
      desc: 'Watch smooth, successful journeys of customers who placed orders.',
      visitorsUrl: preserveReportingPeriod('/admin/marketing/visitors?segment=purchased', raw),
      clarityInstruction: 'In Clarity: Filter by sessions reaching the confirmation page.',
    },
  ];

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="clarity"
        eyebrow={`${store?.name} · Recordings`}
        title="Recordings & Heatmaps"
        description="Watch real customer browsing video replays, click heatmaps, and scroll behavior powered by Microsoft Clarity."
      />

      <MarketingNav
        current="/admin/marketing/clarity"
        period={period}
        range={range}
        from={reportingWindow.from}
        to={reportingWindow.to}
      />

      {/* Clarity Connection Banner */}
      <section
        className="admin-panel"
        style={{
          marginTop: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--admin-forest)' }}>
            Microsoft Clarity Integration
          </h2>
          <p className="admin-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            {hasClarity
              ? `Connected to project ${clarityId}. Visitor and session IDs are automatically tagged.`
              : 'Clarity project ID is not set. Add it in store settings to enable video replays.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: hasClarity ? '#e6f7ec' : '#fde8e8',
              color: hasClarity ? '#147d3b' : '#c5221f',
              border: `1px solid ${hasClarity ? '#a3e6ba' : '#f8b4b4'}`,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasClarity ? '#147d3b' : '#c5221f' }} />
            {hasClarity ? 'Active & Recording' : 'Not Configured'}
          </span>
          <Link className="admin-button admin-button-secondary" href={preserveReportingPeriod('/admin/settings', raw)}>
            Settings
          </Link>
        </div>
      </section>

      {/* Primary Tool Cards: Recordings, Heatmaps, Frustration */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Card 1: Recordings */}
        <article className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎥</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--admin-forest)' }}>
              Session Recordings
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted)', lineHeight: '1.5', margin: '0 0 16px' }}>
              Watch video replays of real customer visits. See where they hesitate, where they pause to read, and exactly where they abandon.
            </p>
          </div>
          <a
            href={recordingsUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-button"
            style={{
              background: '#0078d4',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Open Live Replays</span>
            <span>↗</span>
          </a>
        </article>

        {/* Card 2: Heatmaps */}
        <article className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔥</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--admin-forest)' }}>
              Click & Scroll Heatmaps
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted)', lineHeight: '1.5', margin: '0 0 16px' }}>
              Visual heatmaps showing where visitors tap, which package cards get the most attention, and how far down the page people scroll.
            </p>
          </div>
          <a
            href={heatmapsUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-button"
            style={{
              background: '#d83b01',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Open Visual Heatmaps</span>
            <span>↗</span>
          </a>
        </article>

        {/* Card 3: Frustration Insights */}
        <article className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--admin-forest)' }}>
              Frustration Insights
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted)', lineHeight: '1.5', margin: '0 0 16px' }}>
              Detects friction points automatically: dead clicks on unclickable images, rage clicks from slow loading, and excessive scrolling.
            </p>
          </div>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-button"
            style={{
              background: '#107c41',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Open Clarity Insights</span>
            <span>↗</span>
          </a>
        </article>
      </section>

      {/* Quick Behavior Filters */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Behavior Shortcuts</p>
            <h2 style={{ fontSize: '1.125rem' }}>Watch specific visitor behaviors</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Jump straight to the customer journeys you want to inspect.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
          {quickFilters.map((qf, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--admin-card-bg)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: '#fef3c7',
                    color: '#92400e',
                    marginBottom: '8px',
                  }}
                >
                  {qf.tag}
                </span>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 6px', color: 'var(--admin-forest)' }}>
                  {qf.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)', margin: '0 0 12px', lineHeight: '1.4' }}>
                  {qf.desc}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link
                  href={qf.visitorsUrl}
                  className="admin-button admin-button-secondary"
                  style={{ fontSize: '0.8125rem', textAlign: 'center' }}
                >
                  Filter in Customers tab →
                </Link>
                <small style={{ fontSize: '0.6875rem', color: 'var(--admin-muted)', fontStyle: 'italic' }}>
                  {qf.clarityInstruction}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Sessions Table with 1-Click Copy and Clarity Action */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Direct Session Replays</p>
            <h2 style={{ fontSize: '1.125rem' }}>Recent visitor sessions ({recentSessions.length})</h2>
            <p className="admin-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Click the replay button on any session to open its exact recording or copy the session ID.
            </p>
          </div>
          <a
            href={recordingsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.8125rem', color: 'var(--admin-forest)', fontWeight: 600, textDecoration: 'none' }}
          >
            View all in Clarity ↗
          </a>
        </div>

        {recentSessions.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Source</th>
                  <th>Campaign</th>
                  <th>Started At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => {
                  const source = s.fbclid ? 'meta' : s.utmSource || 'direct';
                  return (
                    <tr key={s.sessionKey}>
                      <td className="admin-stacked-cell">
                        <Link
                          href={preserveReportingPeriod(`/admin/marketing/visitors/${encodeURIComponent(s.sessionKey)}`, raw)}
                          style={{ fontWeight: 600, color: 'var(--admin-forest)' }}
                        >
                          {mask(s.sessionKey)}
                        </Link>
                        <small style={{ color: 'var(--admin-muted)' }}>{mask(s.visitorKey)}</small>
                      </td>
                      <td>
                        <span className="admin-count-badge">{source}</span>
                      </td>
                      <td>{s.utmCampaign || '—'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
                        {date(s.startedAt, store?.timezone || 'Asia/Dhaka')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ClaritySessionRowAction sessionKey={s.sessionKey} clarityId={clarityId} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No visitor sessions recorded yet in this store.</p>
        )}
      </section>

      {/* Technical Details: Custom Tags & Implementation */}
      <TechnicalDetails title="How Clarity Custom Tag Linking Works (Technical Details)">
        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--admin-muted)', marginBottom: 'var(--space-3)' }}>
          Niyamah automatically attaches two custom tags to every Microsoft Clarity session:
        </p>
        <div className="admin-definition-grid" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <span>Custom Tag 1</span>
            <code>effy_session</code> (maps to <code>sessionKey</code>)
          </div>
          <div>
            <span>Custom Tag 2</span>
            <code>effy_visitor</code> (maps to <code>visitorKey</code>)
          </div>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)' }}>
          To find a recording manually: In Microsoft Clarity, go to <strong>Filters → Custom tags → effy_session</strong>, and paste the session ID.
        </p>
      </TechnicalDetails>
    </AdminShell>
  );
}
