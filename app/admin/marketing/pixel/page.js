import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../../components/admin/marketing/BusinessMetric';
import TechnicalDetails from '../../../../components/admin/marketing/TechnicalDetails';
import MetaCapiTester from '../../../../components/admin/MetaCapiTester';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getDatabase } from '../../../../src/lib/db';
import { stores, commerceEvents, visitorSessions, visitors } from '../../../../src/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { getMarketingEnvironment } from '../../../../src/lib/config/server-env';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  preserveReportingPeriod,
} from '../../../../src/lib/admin/reporting-period';
import { parseMarketingRange } from '../../../../src/lib/admin/marketing-analytics-service';

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
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

function mask(value) {
  if (!value) return '—';
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

export default async function MetaPixelCapiPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const period = parseAdminReportingPeriod(raw);
  const range = parseMarketingRange(raw?.period || raw?.range, raw?.from, raw?.to);
  const reportingWindow = resolveAdminReportingWindow(period, new Date(), raw?.from, raw?.to);
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

  // Check CAPI configuration safely
  let capiConfigured = false;
  try {
    const mEnv = getMarketingEnvironment();
    capiConfigured = Boolean(mEnv.META_CAPI_ACCESS_TOKEN && mEnv.META_GRAPH_API_VERSION);
  } catch {
    capiConfigured = false;
  }

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

  // Direct query for latest purchase to avoid 50-event truncation contradiction
  const [latestPurchaseEvent] = await db
    .select({
      occurredAt: commerceEvents.occurredAt,
    })
    .from(commerceEvents)
    .where(
      and(
        eq(commerceEvents.storeId, admin.storeId),
        eq(commerceEvents.eventName, 'PURCHASE'),
      ),
    )
    .orderBy(desc(commerceEvents.occurredAt))
    .limit(1);

  const purchaseCount = countMap.PURCHASE || 0;
  const pageViewCount = countMap.PAGE_VIEW || 0;

  // Evidence-based status logic (Truthful and verifiable from existing data)
  const websiteStatus = pageViewCount > 0 ? 'good' : 'attention';
  const websiteValue = pageViewCount > 0 ? 'Working' : 'Needs setup';
  const websiteSubtitle = pageViewCount > 0 ? `${pageViewCount} page views recorded` : 'No first-party visits';

  const capiStatus = capiConfigured ? 'neutral' : 'neutral';
  const capiValue = capiConfigured ? 'Configured' : 'Not configured';
  const capiSubtitle = capiConfigured ? 'Ready to transmit server signals' : 'Add META_CAPI_ACCESS_TOKEN';

  const metaTrackingStatus = hasPixel ? 'neutral' : 'attention';
  const metaTrackingValue = hasPixel ? 'Configured' : 'Needs Pixel ID';
  const metaTrackingSubtitle = hasPixel ? `Pixel ID ${pixelId}` : 'Add in store settings';

  const metaTrafficStatus = metaSessionsCount > 0 ? 'good' : 'neutral';
  const metaTrafficValue = metaSessionsCount > 0 ? 'Active' : 'No ad visits';
  const metaTrafficSubtitle = metaSessionsCount > 0 ? `${metaSessionsCount} sessions from Meta ads` : 'Waiting for ad traffic';

  const purchaseStatus = purchaseCount > 0 ? 'good' : 'neutral';
  const purchaseValue = purchaseCount > 0 ? `${purchaseCount} recorded` : 'Ready';
  const purchaseSubtitle = purchaseCount > 0
    ? (latestPurchaseEvent ? `Last: ${date(latestPurchaseEvent.occurredAt, store.timezone)}` : 'Recorded')
    : 'Waiting for first order';

  // Recent 50 commerce events with session data for technical view
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
      <PageIntro
        pageKey="pixel"
        eyebrow={`${store.name} · System Health`}
        title="Tracking Health"
        description="Verify that your store tracking, Meta connection, and server backup are running smoothly to recover sales signals that browsers may miss."
      />

      <MarketingNav
        current="/admin/marketing/pixel"
        period={period}
        range={range}
        from={reportingWindow.from}
        to={reportingWindow.to}
      />

      {/* Core Health Status Cards (Business Mode) */}
      <section aria-label="Tracking health status" style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="admin-metric-grid">
          <BusinessMetric
            title="First-party Website Tracking"
            value={websiteValue}
            subtitle={websiteSubtitle}
            tooltip="Records when visitors view pages, click products, and start checkout on your store using first-party privacy-safe tracking."
            status={websiteStatus}
          />
          <BusinessMetric
            title="Server Backup Tracking"
            value={capiValue}
            subtitle={capiSubtitle}
            technicalLabel="Meta CAPI"
            tooltip="Sends a direct backup signal from our server to help recover sales signals that browsers may miss. Configured when CAPI access token is provided."
            status={capiStatus}
          />
          <BusinessMetric
            title="Meta Tracking"
            value={metaTrackingValue}
            subtitle={metaTrackingSubtitle}
            tooltip="Browser Pixel ID configured in your store settings to help Meta match visitors."
            status={metaTrackingStatus}
          />
          <BusinessMetric
            title="Meta Ad Traffic"
            value={metaTrafficValue}
            subtitle={metaTrafficSubtitle}
            tooltip="Shows visitors arriving with Meta ad parameters (fbclid or UTM source). Does not verify Facebook Pixel reception."
            status={metaTrafficStatus}
          />
          <BusinessMetric
            title="Purchases Tracked"
            value={purchaseValue}
            subtitle={purchaseSubtitle}
            tooltip={capiConfigured
              ? "Purchase recorded in first-party tracking. Server backup is configured to use matching event IDs when Meta receives browser and server events. Meta reception is verified separately in Meta Events Manager."
              : "Purchase recorded in first-party tracking. Meta reception is verified separately in Meta Events Manager."}
            status={purchaseStatus}
          />
        </div>
      </section>

      {/* Plain Language Explanations */}
      <section className="admin-panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">How It Works</p>
            <h2 style={{ fontSize: '1.125rem' }}>Your two-layer protection for reliable order tracking</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div
            style={{
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: '8px',
              padding: 'var(--space-4)',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌐</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--admin-forest)', margin: '0 0 6px' }}>
              Layer 1: Website Tracking
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted)', lineHeight: '1.5', margin: 0 }}>
              Runs directly inside the customer&apos;s browser. It immediately records when someone lands on your page, scrolls to product photos, clicks order, and begins checkout.
            </p>
          </div>

          <div
            style={{
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: '8px',
              padding: 'var(--space-4)',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--admin-forest)', margin: '0 0 6px' }}>
              Layer 2: Server Backup (CAPI)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted)', lineHeight: '1.5', margin: 0 }}>
              {capiConfigured
                ? "Server backup tracking is configured to send purchase signals directly to Meta. This helps recover sales signals that browsers may miss due to ad-blockers or privacy restrictions."
                : "Server backup tracking can send purchase signals directly to Meta once configured. This helps recover sales signals that browsers may miss due to ad-blockers or privacy restrictions."}
            </p>
          </div>

          <div
            style={{
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: '8px',
              padding: 'var(--space-4)',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--admin-forest)', margin: '0 0 6px' }}>
              Deduplication Protection
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted)', lineHeight: '1.5', margin: 0 }}>
              {capiConfigured
                ? "Both layers share the same unique Order ID. Shared event IDs allow Meta to deduplicate matching browser and server events."
                : "Shared event IDs allow Meta to deduplicate matching browser and server events once server backup tracking is configured."}
            </p>
          </div>
        </div>
      </section>

      {/* Developer Diagnostics & Live Event Stream: Collapsed by Default */}
      <TechnicalDetails title="Developer Diagnostics, CAPI Tester & Live Event Stream">
        {/* Live CAPI Diagnostic Tester */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <MetaCapiTester pixelId={pixelId} />
        </div>

        {/* Real-Time Event Stream Table */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="admin-panel-heading" style={{ padding: '0 0 var(--space-3) 0' }}>
            <div>
              <p className="admin-eyebrow">Real-Time Event Stream</p>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Latest 50 Received Events</h3>
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
                          <span className={`admin-event-badge admin-event-${event.eventName.toLowerCase()}`}>
                            {event.eventName}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
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
                          <code title={event.eventId} style={{ fontSize: '0.75rem' }}>{mask(event.eventId)}</code>
                        </td>
                        <td>
                          {typeof event.valueMinor === 'number'
                            ? money(event.valueMinor, event.currency || store.currency)
                            : '—'}
                        </td>
                        <td>
                          <code title={event.visitorKey} style={{ fontSize: '0.75rem' }}>{mask(event.visitorKey)}</code>
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
        </div>

        {/* Technical Architecture Info */}
        <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="admin-card">
            <h4>1. Deduplication by Shared Event ID</h4>
            <p className="admin-muted" style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
              Both the browser Meta Pixel (<code>fbq</code>) and server Conversions API send the exact same <code>eventId</code> (e.g. <code>ORD-...</code> or <code>evt_...</code>). Shared event IDs allow Meta to deduplicate matching browser and server events.
            </p>
          </div>
          <div className="admin-card">
            <h4>2. Customer Parameter Hashing</h4>
            <p className="admin-muted" style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
              Phone numbers and emails are normalized and SHA-256 hashed before transmission to Meta. Plaintext customer personal data is not transmitted across the network.
            </p>
          </div>
          <div className="admin-card">
            <h4>3. Click ID (fbc) & External ID</h4>
            <p className="admin-muted" style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
              When a visitor clicks your Facebook/Instagram ad, their <code>fbclid</code> can be stored as <code>fbc</code> to help Meta match ad-originated events.
            </p>
          </div>
        </div>
      </TechnicalDetails>
    </AdminShell>
  );
}
