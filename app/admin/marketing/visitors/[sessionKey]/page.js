import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../../components/admin/AdminShell';
import MarketingNav from '../../../../../components/admin/MarketingNav';
import { requireCurrentAdmin } from '../../../../../src/lib/auth/current-admin';
import { getVisitorSessionJourney } from '../../../../../src/lib/admin/visitor-intelligence-service';
import { DrizzleAdminVisitorIntelligenceRepository } from '../../../../../src/lib/db/admin-visitor-intelligence-repository';

function date(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'medium', timeZone: timezone }).format(value instanceof Date ? value : new Date(value));
}
function money(minor, currency) {
  if (minor === null || !currency) return null;
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
}
function mask(value) { return value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value; }

export const dynamic = 'force-dynamic';

export default async function VisitorJourneyDetailPage({ params }) {
  const admin = await requireCurrentAdmin();
  const raw = await params;
  const sessionKey = decodeURIComponent(raw.sessionKey || '');
  const result = await getVisitorSessionJourney(admin.storeId, sessionKey, new DrizzleAdminVisitorIntelligenceRepository());
  if (!result) notFound();

  return <AdminShell admin={admin}>
    <Link className="admin-back-link" href="/admin/marketing/visitors">← Back to visitors</Link>
    <header className="admin-page-header"><div><p className="admin-eyebrow">{result.store.name} · Visitor journey</p><h1>{mask(result.visitorKey)}</h1><p className="admin-muted admin-header-copy">Chronological first-party journey for one anonymous session. Personal contact fields are not exposed.</p></div><span className="admin-count-badge">{result.source}</span></header>
    <MarketingNav current="/admin/marketing/visitors" />

    <section className="admin-panel admin-journey-summary">
      <div><span>Session</span><strong>{result.sessionKey}</strong></div>
      <div><span>Source</span><strong>{result.source}</strong><small>{result.medium || 'no medium'} · {result.campaign || 'no campaign'}</small></div>
      <div><span>Started</span><strong>{date(result.startedAt, result.store.timezone)}</strong></div>
      <div><span>Last seen</span><strong>{date(result.lastSeenAt, result.store.timezone)}</strong></div>
      <div className="admin-journey-summary-wide"><span>Landing page</span><strong>{result.landingPage || '—'}</strong><small>Referrer: {result.referrer || '—'}</small></div>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-heading"><div><p className="admin-eyebrow">Timeline</p><h2>Session activity</h2></div><span>{result.timeline.length} events</span></div>
      <div className="admin-journey-timeline">{result.timeline.map((event) => <article key={`${event.kind}:${event.id}`}><div className="admin-journey-dot" /><div className="admin-journey-event"><div className="admin-journey-event-heading"><strong>{event.label}</strong><time>{date(event.occurredAt, result.store.timezone)}</time></div><div className="admin-journey-meta"><span>{event.kind}</span>{event.sectionKey ? <span>section: {event.sectionKey}</span> : null}{event.elementKey ? <span>cta: {event.elementKey}</span> : null}{event.scrollDepth ? <span>depth: {event.scrollDepth}%</span> : null}{money(event.valueMinor, event.currency) ? <span>{money(event.valueMinor, event.currency)}</span> : null}</div>{event.targetUrl ? <small>Target: {event.targetUrl}</small> : null}{event.pageUrl ? <small>Page: {event.pageUrl}</small> : null}</div></article>)}</div>
    </section>

    <section className="admin-panel admin-clarity-panel"><div><p className="admin-eyebrow">Clarity correlation</p><h2>Find the visual recording</h2><p className="admin-muted">Effy sends this anonymous visitor/session pair to Microsoft Clarity Identify only after analytics consent. Use these identifiers as Clarity custom filters to find the matching recording and heatmap context.</p></div><div className="admin-definition-grid"><div><span>Visitor ID</span><strong>{result.visitorKey}</strong></div><div><span>Session ID</span><strong>{result.sessionKey}</strong></div><div><span>Clarity</span><strong>{result.store.clarityProjectId ? 'Configured' : 'Not configured'}</strong></div></div></section>
  </AdminShell>;
}
