import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  RETARGETING_AUDIENCES,
  RETARGETING_WINDOWS,
  getRetargetingAudience,
  parseRetargetingAudience,
  parseRetargetingWindow,
} from '../../../../src/lib/admin/retargeting-service';
import { DrizzleAdminRetargetingRepository } from '../../../../src/lib/db/admin-retargeting-repository';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
}

function formatDate(value, timezone) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(date);
}

function maskKey(value) {
  if (!value) return 'anonymous';
  return value.length <= 12 ? value : `${value.slice(0, 6)}…${value.slice(-6)}`;
}

function href(audience, days) {
  const params = new URLSearchParams({ audience, days: String(days) });
  return `/admin/marketing/retargeting?${params.toString()}`;
}

export default async function RetargetingPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const audience = parseRetargetingAudience(raw?.audience);
  const days = parseRetargetingWindow(raw?.days);
  const result = await getRetargetingAudience(
    admin.storeId,
    audience,
    days,
    new DrizzleAdminRetargetingRepository(),
  );
  const timezone = result.store.timezone;

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{result.store.name} · Growth</p>
          <h1>Retargeting audiences</h1>
          <p className="admin-muted admin-header-copy">First-party abandonment segments with purchase exclusion. Only consented behavioral events enter these audiences.</p>
        </div>
        <span className={result.store.metaPixelId ? 'admin-status-pill' : 'admin-status-pill admin-status-pill-muted'}>
          Meta Pixel {result.store.metaPixelId ? 'configured' : 'not configured'}
        </span>
      </header>

      <section className="admin-retargeting-tabs" aria-label="Retargeting audience">
        {Object.entries(RETARGETING_AUDIENCES).map(([key, definition]) => (
          <Link key={key} href={href(key, days)} aria-current={audience === key ? 'page' : undefined}>{definition.shortLabel}</Link>
        ))}
      </section>

      <section className="admin-panel admin-retargeting-definition">
        <div>
          <p className="admin-eyebrow">Audience rule</p>
          <h2>{result.definition.label}</h2>
          <p>{result.definition.description}</p>
        </div>
        <div className="admin-rule-box"><strong>Meta website audience</strong><span>{result.definition.metaRule}</span><small>Window: {days} days · 30-minute inactivity grace</small></div>
      </section>

      <nav className="admin-range-picker admin-retargeting-range" aria-label="Audience lookback">
        {RETARGETING_WINDOWS.map((option) => (
          <Link key={option} href={href(audience, option)} aria-current={days === option ? 'page' : undefined}>{option} days</Link>
        ))}
      </nav>

      <section className="admin-metric-grid" aria-label="Retargeting summary">
        <article className="admin-metric-card"><span>Eligible visitors</span><strong>{result.summary.visitors}</strong><small>Unique visitors, purchase excluded</small></article>
        <article className="admin-metric-card admin-metric-card-accent"><span>Potential value</span><strong>{formatMoney(result.summary.potentialValueMinor, result.store.currency)}</strong><small>Latest qualifying event value</small></article>
        <article className="admin-metric-card"><span>Sources</span><strong>{result.summary.sourceCount}</strong><small>Distinct acquisition sources</small></article>
        <article className="admin-metric-card"><span>Lookback</span><strong>{days}d</strong><small>Older activity excluded</small></article>
      </section>

      <div className="admin-dashboard-grid admin-retargeting-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Audience preview</p><h2>Eligible visitor journeys</h2></div><span>Latest {result.summary.previewLimit}</span></div>
          {result.rows.length ? (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Visitor</th><th>Product</th><th>Source</th><th>Value</th><th>Last action</th></tr></thead><tbody>
              {result.rows.map((row) => <tr key={row.visitorId}><td><strong>{maskKey(row.visitorKey)}</strong><small>{maskKey(row.sessionKey)}</small></td><td><strong>{row.productName || 'Unknown product'}</strong><small>{row.sku || '—'}</small></td><td><strong>{row.source}</strong><small>{row.campaign || 'no campaign'}</small></td><td>{formatMoney(row.valueMinor, result.store.currency)}</td><td>{formatDate(row.lastActionAt, timezone)}</td></tr>)}
            </tbody></table></div>
          ) : <div className="admin-empty-state"><h2>No eligible visitors yet</h2><p>Visitors appear after the qualifying event is at least 30 minutes old and no later purchase exists.</p></div>}
        </section>

        <aside className="admin-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Acquisition</p><h2>Audience sources</h2></div></div>
          {result.sources.length ? <ul className="admin-source-list">{result.sources.map((source) => <li key={source.source}><span>{source.source}</span><strong>{source.visitors}</strong></li>)}</ul> : <p className="admin-muted">No source data yet.</p>}
          <hr className="admin-divider" />
          <p className="admin-note"><strong>Purchase exclusion is automatic in Effy Market.</strong> For Meta Ads Manager, create the matching Website Custom Audience using the rule shown above and explicitly exclude Purchase for the same lookback window.</p>
          <p className="admin-note">Anonymous visitors remain anonymous here; this page shows behavioral identifiers, not personal identity.</p>
        </aside>
      </div>
    </AdminShell>
  );
}
