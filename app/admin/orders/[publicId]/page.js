import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import OrderStatusForm from '../../../../components/admin/OrderStatusForm';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  canManageOrders,
  getAdminOrderDetail,
  getAllowedOrderTransitions,
} from '../../../../src/lib/admin/order-admin-service';
import { DrizzleAdminOrderRepository } from '../../../../src/lib/db/admin-order-repository';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
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
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
}

function yesNo(value) {
  return value ? 'Allowed' : 'Declined';
}

export default async function OrderDetailPage({ params }) {
  const admin = await requireCurrentAdmin();
  const { publicId } = await params;
  const order = await getAdminOrderDetail(
    admin.storeId,
    String(publicId).toUpperCase(),
    new DrizzleAdminOrderRepository(),
  );
  if (!order) notFound();
  const transitions = getAllowedOrderTransitions(order.status);
  const mayUpdate = canManageOrders(admin.role);

  return (
    <AdminShell admin={admin}>
      <Link className="admin-back-link" href="/admin/orders">← Back to orders</Link>
      <header className="admin-order-detail-header">
        <div>
          <p className="admin-eyebrow">Order record</p>
          <h1>{order.publicId}</h1>
          <p className="admin-muted">Placed {formatDate(order.createdAt, order.timezone)} · Last updated {formatDate(order.updatedAt, order.timezone)}</p>
        </div>
        <span className={`admin-status-pill admin-status-large admin-status-${order.status.toLowerCase()}`}>
          {label(order.status)}
        </span>
      </header>

      <div className="admin-order-detail-grid">
        <div className="admin-order-detail-main">
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Items and totals</h2></div>
            <div className="admin-item-list">
              {order.items.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>{item.variantLabel || 'Default variant'}{item.sku ? ` · ${item.sku}` : ''}</span>
                  </div>
                  <span>{item.quantity} × {formatMoney(item.unitPriceMinor, order.currency)}</span>
                  <b>{formatMoney(item.totalMinor, order.currency)}</b>
                </article>
              ))}
            </div>
            <dl className="admin-total-list">
              <div><dt>Subtotal</dt><dd>{formatMoney(order.subtotalMinor, order.currency)}</dd></div>
              <div><dt>Discount</dt><dd>− {formatMoney(order.discountMinor, order.currency)}</dd></div>
              <div><dt>Shipping</dt><dd>{formatMoney(order.shippingMinor, order.currency)}</dd></div>
              <div className="admin-total-final"><dt>Total</dt><dd>{formatMoney(order.totalMinor, order.currency)}</dd></div>
            </dl>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Status timeline</h2></div>
            <ol className="admin-timeline">
              {order.history.map((entry) => (
                <li key={entry.id}>
                  <span />
                  <div>
                    <strong>{label(entry.toStatus)}</strong>
                    <small>{formatDate(entry.createdAt, order.timezone)}</small>
                    {entry.changedByAdminEmail ? <p>By {entry.changedByAdminEmail}</p> : <p>Created by checkout</p>}
                    {entry.note ? <blockquote>{entry.note}</blockquote> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Attribution and consent</h2></div>
            <dl className="admin-definition-grid">
              <div><dt>Source</dt><dd className="admin-capitalize">{order.attribution?.source ?? 'Direct'}</dd></div>
              <div><dt>Medium</dt><dd>{order.attribution?.medium ?? '—'}</dd></div>
              <div><dt>Campaign</dt><dd>{order.attribution?.campaign ?? '—'}</dd></div>
              <div><dt>Landing page</dt><dd className="admin-break-value">{order.attribution?.landingPage ?? '—'}</dd></div>
            </dl>
            {order.consent ? (
              <div className="admin-consent-grid">
                <span>Analytics: {yesNo(order.consent.analyticsAllowed)}</span>
                <span>Email: {yesNo(order.consent.emailMarketingAllowed)}</span>
                <span>SMS: {yesNo(order.consent.smsMarketingAllowed)}</span>
                <span>WhatsApp: {yesNo(order.consent.whatsappMarketingAllowed)}</span>
                <small>Policy {order.consent.privacyPolicyVersion} · {formatDate(order.consent.capturedAt, order.timezone)}</small>
              </div>
            ) : <p className="admin-note">No consent snapshot is attached.</p>}
          </section>
        </div>

        <aside className="admin-order-detail-side">
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Customer</h2></div>
            <address className="admin-address">
              <strong>{order.customerName}</strong>
              <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
              {order.customerEmail ? <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a> : null}
              <span>{order.addressLine1}</span>
              {order.addressLine2 ? <span>{order.addressLine2}</span> : null}
              <span>{[order.area, order.district].filter(Boolean).join(', ')}</span>
            </address>
            {order.note ? <p className="admin-customer-note"><strong>Customer note</strong>{order.note}</p> : null}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Payment</h2></div>
            <dl className="admin-definition-grid admin-definition-single">
              <div><dt>Method</dt><dd>{order.payment?.method ?? order.paymentMethod}</dd></div>
              <div><dt>Status</dt><dd>{label(order.payment?.status ?? order.paymentStatus)}</dd></div>
              <div><dt>Amount</dt><dd>{formatMoney(order.payment?.amountMinor ?? order.totalMinor, order.currency)}</dd></div>
              <div><dt>Reference</dt><dd>{order.payment?.providerReference ?? '—'}</dd></div>
            </dl>
          </section>

          <section className="admin-panel admin-action-panel">
            <div className="admin-panel-heading"><h2>Update status</h2></div>
            {!mayUpdate ? (
              <p className="admin-note">Your Analyst role has read-only access.</p>
            ) : transitions.length ? (
              <OrderStatusForm
                publicId={order.publicId}
                currentStatus={order.status}
                transitions={[...transitions]}
              />
            ) : (
              <p className="admin-note">This order is in a terminal state.</p>
            )}
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
