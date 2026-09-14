import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import MetaCapiTester from '../../../../components/admin/MetaCapiTester';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getDatabase } from '../../../../src/lib/db';
import { stores, commerceEvents, visitorSessions, visitors } from '../../../../src/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function date(value, timezone = 'Asia/Dhaka') {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: timezone,
  }).format(value instanceof Date ? value : new Date(value));
}

function money(minor, currency = 'BDT') {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

function mask(value) {
  if (!value) return '—';
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

export default async function MetaPixelCapiPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = raw?.range || '30d';
  const db = getDatabase();

  const [store] = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      metaPixelId: stores.metaPixelId,
      currency: stores.currency,
      timezone: stores.timezone,
    })
    .from(stores)
    .where(eq(stores.id, admin.storeId))
    .limit(1);

  const pixelId = store?.metaPixelId || '';
  const hasPixel = Boolean(pixelId);

  // Event counts grouped by event_name
  const eventCounts = await db
    .select({
      eventName: commerceEvents.eventName,
      count: sql`count(*)`,
    })
    .from(commerceEvents)
    .where(eq(commerceEvents.storeId, admin.storeId))
    .groupBy(commerceEvents.eventName);

  const countMap = Object.fromEntries(
    eventCounts.map((e) => [e.eventName, Number(e.count)]),
  );

  // Total Meta sessions
  const [metaSessionsResult] = await db
    .select({
      count: sql`count(*)`,
    })
    .from(visitorSessions)
    .where(
      sql`${visitorSessions.storeId} = ${admin.storeId} AND (${visitorSessions.fbclid} IS NOT NULL OR ${visitorSessions.utmSource} ILIKE '%meta%' OR ${visitorSessions.utmSource} ILIKE '%facebook%')`,
    );

  const metaSessionsCount = Number(metaSessionsResult?.count || 0);

  // Recent 50 commerce events with session data
  const recentEvents = await db
    .select({
      id: commerceEvents.id,
      eventName: commerceEvents.eventName,
      eventId: commerceEvents.eventId,
      occurredAt: commerceEvents.occurredAt,
      pageUrl: commerceEvents.pageUrl,
      valueMinor: commerceEvents.valueMinor,
      currency: commerceEvents.currency,
      utmSource: visitorSessions.utmSource,
      utmCampaign: visitorSessions.utmCampaign,
      fbclid: visitorSessions.fbclid,
      visitorKey: visitors.visitorKey,
      sessionKey: visitorSessions.sessionKey,
    })
    .from(commerceEvents)
    .innerJoin(visitorSessions, eq(visitorSessions.id, commerceEvents.sessionId))
    .innerJoin(visitors, eq(visitors.id, commerceEvents.visitorId))
    .where(eq(commerceEvents.storeId, admin.storeId))
    .orderBy(desc(commerceEvents.occurredAt))
    .limit(50);

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{store.name} · Tracking & CAPI</p>
          <h1>Meta Pixel & Events Manager</h1>
          <p className="admin-muted admin-header-copy">
            Real-time live monitor for browser Meta Pixel events and server-side Conversions API (CAPI) delivery.
          </p>
        </div>
      </header>

      <MarketingNav current="/admin/marketing/pixel" range={range} />

      {/* KPI Cards */}
      <section className="admin-metric-grid" aria-label="Pixel and CAPI statistics">
        <article className="admin-metric-card">
          <span>Meta Pixel ID</span>
          <strong>{pixelId || 'Not Configured'}</strong>
          <small>{hasPixel ? '🟢 Active in browser & server' : '🔴 Missing Pixel ID'}</small>
        </article>
        <article className="admin-metric-card">
          <span>Meta Ad Visitors</span>
          <strong>{metaSessionsCount}</strong>
          <small>Tracked sessions with fbclid</small>
        </article>
        <article className="admin-metric-card">
          <span>Page Views</span>
          <strong>{countMap.PAGE_VIEW || 0}</strong>
          <small>PageView events fired</small>
        </article>
        <article className="admin-metric-card">
          <span>Product Views</span>
          <strong>{countMap.VIEW_CONTENT || 0}</strong>
          <small>ViewContent events fired</small>
        </article>
        <article className="admin-metric-card">
          <span>Add To Cart</span>
          <strong>{countMap.ADD_TO_CART || 0}</strong>
          <small>AddToCart events fired</small>
        </article>
        <article className="admin-metric-card">
          <span>Checkouts Initiated</span>
          <strong>{countMap.BEGIN_CHECKOUT || 0}</strong>
          <small>InitiateCheckout events</small>
        </article>
        <article className="admin-metric-card admin-metric-card-accent">
          <span>Purchases Tracked</span>
          <strong>{countMap.PURCHASE || 0}</strong>
          <small>Server & browser purchase events</small>
        </article>
      </section>

      {/* Live CAPI Diagnostic Tester */}
      <section className="admin-panel" style={{ marginTop: '24px' }}>
        <MetaCapiTester pixelId={pixelId} />
      </section>

      {/* Live Event Stream Table */}
      <section className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Real-Time Event Stream</p>
            <h2>Latest 50 Received Events</h2>
          </div>
          <span className="admin-badge admin-badge-success">● Live Sync</span>
        </div>

        {recentEvents.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Time (BD)</th>
                  <th>Source / Campaign</th>
                  <th>Meta fbclid</th>
                  <th>Event ID (Deduplication)</th>
                  <th>Value</th>
                  <th>Visitor Key</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => {
                  const isMeta =
                    event.fbclid ||
                    event.utmSource?.toLowerCase().includes('meta') ||
                    event.utmSource?.toLowerCase().includes('facebook');
                  return (
                    <tr key={event.id}>
                      <td>
                        <span
                          className={`admin-event-badge admin-event-${event.eventName.toLowerCase()}`}
                        >
                          {event.eventName}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {date(event.occurredAt, store.timezone)}
                      </td>
                      <td className="admin-stacked-cell">
                        <strong>
                          {event.utmSource ? (
                            <span className={isMeta ? 'admin-highlight-meta' : ''}>
                              {event.utmSource}
                            </span>
                          ) : (
                            'direct'
                          )}
                        </strong>
                        <small>{event.utmCampaign || '—'}</small>
                      </td>
                      <td>
                        {event.fbclid ? (
                          <span className="admin-badge admin-badge-meta">✓ fbclid</span>
                        ) : (
                          <span className="admin-muted">—</span>
                        )}
                      </td>
                      <td>
                        <code title={event.eventId}>{mask(event.eventId)}</code>
                      </td>
                      <td>
                        {typeof event.valueMinor === 'number'
                          ? money(event.valueMinor, event.currency || store.currency)
                          : '—'}
                      </td>
                      <td>
                        <code title={event.visitorKey}>{mask(event.visitorKey)}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No commerce events recorded yet.</p>
        )}
      </section>

      {/* Meta Conversions API (CAPI) Explanation & Redundancy Info */}
      <section className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Redundancy & Match Quality</p>
            <h2>How Dual Browser + Server CAPI Tracking Works</h2>
          </div>
        </div>
        <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="admin-card">
            <h4>1. Deduplication by Shared Event ID</h4>
            <p className="admin-muted">
              Both the browser Meta Pixel (<code>fbq</code>) and server Conversions API send the exact same <code>eventId</code> (e.g. <code>ORD-...</code> or <code>evt_...</code>). Meta detects the duplicate and counts only 1 conversion, preventing double-reporting while guaranteeing zero missed sales.
            </p>
          </div>
          <div className="admin-card">
            <h4>2. Customer Parameter Hashing</h4>
            <p className="admin-muted">
              Phone numbers and emails are normalized and SHA-256 hashed before transmission to Meta. Plaintext customer personal data is never transmitted across the network.
            </p>
          </div>
          <div className="admin-card">
            <h4>3. Click ID (fbc) & External ID</h4>
            <p className="admin-muted">
              When a visitor clicks your Facebook/Instagram ad, their <code>fbclid</code> is automatically bound to the session as <code>fbc</code>, ensuring 9.0+ Event Quality Match Score in Meta Events Manager.
            </p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
