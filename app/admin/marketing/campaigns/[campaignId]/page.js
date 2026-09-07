import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../../components/admin/AdminShell';
import MarketingNav from '../../../../../components/admin/MarketingNav';
import { getCampaignAttributionDetailReport } from '../../../../../src/lib/admin/campaign-attribution-diagnostics-service';
import { MARKETING_RANGES, parseMarketingRange } from '../../../../../src/lib/admin/marketing-analytics-service';
import { requireCurrentAdmin } from '../../../../../src/lib/auth/current-admin';
import { DrizzleAdminCampaignAttributionDiagnosticsRepository } from '../../../../../src/lib/db/admin-campaign-attribution-diagnostics-repository';

export const dynamic = 'force-dynamic';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatDate(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}

function label(status) {
  return status.charAt(0) + status.slice(1).toLowerCase().replaceAll('_', ' ');
}

export default async function CampaignAttributionDetailPage({ params, searchParams }) {
  const admin = await requireCurrentAdmin();
  const { campaignId } = await params;
  const raw = await searchParams;
  const range = parseMarketingRange(raw?.range);
  const detail = await getCampaignAttributionDetailReport(
    admin.storeId,
    String(campaignId),
    range,
    new DrizzleAdminCampaignAttributionDiagnosticsRepository(),
  );

  if (!detail) notFound();

  const { campaign, metrics } = detail;

  return (
    <AdminShell admin={admin}>
      <Link className="admin-back-link" href={`/admin/marketing/campaigns?range=${range}`}>
        ← Back to campaigns
      </Link>

      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Campaign attribution detail</p>
          <h1>{campaign.name}</h1>
          <p className="admin-muted admin-header-copy">
            <code>{campaign.campaignKey}</code> · {campaign.source} / {campaign.medium} · {label(campaign.status)}
          </p>
        </div>
        <nav className="admin-range-picker">
          {MARKETING_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin/marketing/campaigns/${campaign.id}?range=${option}`}
              aria-current={range === option ? 'page' : undefined}
            >
              {option === 'all' ? 'All' : option}
            </Link>
          ))}
        </nav>
      </header>

      <MarketingNav current="/admin/marketing/campaigns" range={range} />

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Lifecycle attribution</p>
            <h2>{detail.window.label}</h2>
          </div>
          <span>Last-touch operational view</span>
        </div>
        <dl className="admin-definition-grid">
          <div><dt>Visitors</dt><dd>{metrics.visitors}</dd></div>
          <div><dt>Sessions</dt><dd>{metrics.sessions}</dd></div>
          <div><dt>First-touch orders</dt><dd>{metrics.firstTouchOrders}</dd></div>
          <div><dt>Last-touch orders</dt><dd>{metrics.lastTouchOrders}</dd></div>
          <div><dt>Reached confirmed</dt><dd>{metrics.confirmedReachedOrders}</dd></div>
          <div><dt>Reached delivered</dt><dd>{metrics.deliveredReachedOrders}</dd></div>
          <div><dt>Placed revenue</dt><dd>{formatMoney(metrics.lastTouchRevenueMinor, campaign.currency)}</dd></div>
        </dl>
        <p className="admin-note">
          “Reached confirmed” and “Reached delivered” use immutable order status history. They mean the order reached that lifecycle stage, even if its current status later changed.
        </p>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Campaign definition</p>
            <h2>Registry identity</h2>
          </div>
          <span>{label(campaign.status)}</span>
        </div>
        <dl className="admin-definition-grid">
          <div><dt>utm_campaign</dt><dd><code>{campaign.campaignKey}</code></dd></div>
          <div><dt>utm_source</dt><dd>{campaign.source}</dd></div>
          <div><dt>utm_medium</dt><dd>{campaign.medium}</dd></div>
          <div><dt>utm_content</dt><dd>{campaign.content || '—'}</dd></div>
          <div><dt>utm_term</dt><dd>{campaign.term || '—'}</dd></div>
          <div><dt>Landing URL</dt><dd className="admin-break-value">{campaign.landingUrl || '—'}</dd></div>
        </dl>
        {campaign.notes ? <p className="admin-note">{campaign.notes}</p> : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Attribution evidence</p>
            <h2>Recent attributed orders</h2>
          </div>
          <span>Up to 50</span>
        </div>

        {detail.orders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th>Value</th>
                  <th>Raw source</th>
                  <th>Raw campaign</th>
                  <th>First → Last</th>
                </tr>
              </thead>
              <tbody>
                {detail.orders.map((order) => (
                  <tr key={order.publicId}>
                    <td><Link href={`/admin/orders/${order.publicId}`}><strong>{order.publicId}</strong></Link></td>
                    <td>{order.role}</td>
                    <td>{label(order.status)}</td>
                    <td>{formatDate(order.createdAt, campaign.timezone)}</td>
                    <td>{formatMoney(order.totalMinor, order.currency)}</td>
                    <td>{order.source}{order.medium ? ` / ${order.medium}` : ''}</td>
                    <td>{order.campaign || '—'}</td>
                    <td>{order.firstTouchCampaign || 'Direct'} → {order.lastTouchCampaign || 'Direct'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No orders are first-touch or last-touch attributed to this campaign in the selected period.</p>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Interpretation</p>
            <h2>How to read this page</h2>
          </div>
          <span>No ad spend yet</span>
        </div>
        <p className="admin-muted">
          First-touch orders show acquisition influence; last-touch orders show the final recorded session before checkout. This page intentionally does not calculate spend, CPA or ROAS until paid-provider data is connected in Part O.
        </p>
      </section>
    </AdminShell>
  );
}
