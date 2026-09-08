import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import OrderStatusForm from '../../../../components/admin/OrderStatusForm';
import SteadfastShipmentForm from '../../../../components/admin/SteadfastShipmentForm';
import OrderFulfillmentCostForm from '../../../../components/admin/OrderFulfillmentCostForm';
import OrderPaymentStatusForm from '../../../../components/admin/OrderPaymentStatusForm';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  canManageOrders,
  getAdminOrderDetail,
  getAllowedOrderTransitions,
} from '../../../../src/lib/admin/order-admin-service';
import { DrizzleAdminOrderRepository } from '../../../../src/lib/db/admin-order-repository';
import { getAdminOrderProfitability } from '../../../../src/lib/admin/order-profitability-service';
import { DrizzleAdminOrderProfitabilityRepository } from '../../../../src/lib/db/admin-order-profitability-repository';
import { getAdminPaymentSettlement } from '../../../../src/lib/admin/payment-settlement-service';
import { DrizzleAdminPaymentSettlementRepository } from '../../../../src/lib/db/admin-payment-settlement-repository';
import { getAdminFulfillment } from '../../../../src/lib/admin/fulfillment-service';
import { DrizzleAdminFulfillmentRepository } from '../../../../src/lib/db/admin-fulfillment-repository';

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

function formatOptionalMoney(minor, currency, fallback = 'Unknown') {
  return minor === null ? fallback : formatMoney(minor, currency);
}

function formatMargin(value) {
  return value === null ? 'Unknown' : `${value.toFixed(2)}%`;
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
  const fulfillment = await getAdminFulfillment(
    admin,
    order.publicId,
    new DrizzleAdminFulfillmentRepository(),
  );
  const profitability = await getAdminOrderProfitability(
    admin,
    order.publicId,
    new DrizzleAdminOrderProfitabilityRepository(),
  );
  if (!profitability) notFound();
  const paymentSettlement = await getAdminPaymentSettlement(
    admin,
    order.publicId,
    new DrizzleAdminPaymentSettlementRepository(),
  );
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
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">Cost truth</p>
                <h2>Contribution economics</h2>
              </div>
              <span>{profitability.summary.recognition}</span>
            </div>
            <dl className="admin-definition-grid">
              <div><dt>First-party revenue</dt><dd>{formatMoney(profitability.summary.revenueMinor, order.currency)}</dd></div>
              <div><dt>Item COGS</dt><dd>{formatOptionalMoney(profitability.summary.cogsMinor, order.currency)}</dd></div>
              <div><dt>Gross profit</dt><dd>{formatOptionalMoney(profitability.summary.grossProfitMinor, order.currency)}</dd></div>
              <div><dt>Fulfillment cost</dt><dd>{formatOptionalMoney(profitability.summary.fulfillmentCostMinor, order.currency)}</dd></div>
              <div><dt>Projected contribution</dt><dd>{formatOptionalMoney(profitability.summary.projectedContributionMinor, order.currency)}</dd></div>
              <div><dt>Projected margin</dt><dd>{formatMargin(profitability.summary.projectedMarginPercent)}</dd></div>
              <div><dt>Recognized contribution</dt><dd>{formatOptionalMoney(profitability.summary.recognizedContributionMinor, order.currency, 'Not recognized')}</dd></div>
              <div><dt>Recognized margin</dt><dd>{profitability.summary.recognition === 'PROVISIONAL' ? 'Not recognized' : formatMargin(profitability.summary.recognizedMarginPercent)}</dd></div>
              <div><dt>Cost coverage</dt><dd>{profitability.summary.knownItemCostCount}/{profitability.summary.totalItemCount} item COGS snapshots</dd></div>
            </dl>
            <p className="admin-note">{profitability.summary.lifecycleNote}</p>
            {!profitability.summary.itemCostsComplete ? (
              <p className="admin-note">
                Contribution stays unknown while any immutable item COGS snapshot is missing. Unknown cost is never treated as zero.
              </p>
            ) : null}
            <OrderFulfillmentCostForm
              publicId={order.publicId}
              expectedRevision={profitability.fulfillmentCostRevision}
              fulfillmentCostMinor={profitability.fulfillmentCostMinor}
              currency={order.currency}
              editable={profitability.canManage}
            />
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
              <div><dt>Content</dt><dd>{order.attribution?.content ?? '—'}</dd></div>
              <div><dt>Term</dt><dd>{order.attribution?.term ?? '—'}</dd></div>
              <div><dt>Referrer</dt><dd className="admin-break-value">{order.attribution?.referrer ?? '—'}</dd></div>
              <div><dt>Landing page</dt><dd className="admin-break-value">{order.attribution?.landingPage ?? '—'}</dd></div>
              <div><dt>fbclid</dt><dd className="admin-break-value">{order.attribution?.fbclid ?? '—'}</dd></div>
              <div><dt>gclid</dt><dd className="admin-break-value">{order.attribution?.gclid ?? '—'}</dd></div>
              <div><dt>Visitor ID</dt><dd className="admin-break-value">{order.attribution?.visitorKey ?? '—'}</dd></div>
              <div><dt>Session ID</dt><dd className="admin-break-value">{order.attribution?.sessionKey ?? '—'}</dd></div>
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

          <section id="payment-reconciliation" className="admin-panel">
            <div className="admin-panel-heading"><h2>Payment</h2></div>
            <dl className="admin-definition-grid admin-definition-single">
              <div><dt>Method</dt><dd>{order.payment?.method ?? order.paymentMethod}</dd></div>
              <div><dt>Status</dt><dd>{label(paymentSettlement?.status ?? order.payment?.status ?? order.paymentStatus)}</dd></div>
              <div><dt>Amount</dt><dd>{formatMoney(order.payment?.amountMinor ?? order.totalMinor, order.currency)}</dd></div>
              <div><dt>Reference</dt><dd>{paymentSettlement?.providerReference ?? order.payment?.providerReference ?? '—'}</dd></div>
            </dl>
            {paymentSettlement && !paymentSettlement.statusConsistent ? (
              <p className="admin-error">
                Payment settlement data is inconsistent with the order snapshot. Saving a valid reconciliation will restore atomic status consistency.
              </p>
            ) : null}
            {paymentSettlement ? (
              <OrderPaymentStatusForm
                publicId={order.publicId}
                expectedRevision={paymentSettlement.revision}
                currentStatus={paymentSettlement.status}
                allowedTransitions={paymentSettlement.allowedTransitions}
                providerReference={paymentSettlement.providerReference}
                editable={paymentSettlement.canManage}
              />
            ) : (
              <p className="admin-note">
                No payment record is available for reconciliation.
              </p>
            )}
          </section>

          <section className="admin-panel admin-action-panel">
            <div className="admin-panel-heading"><h2>Steadfast fulfillment</h2></div>
            <div className="admin-shipment-card">
              {fulfillment?.shipment ? (
                <>
                  <span className={`admin-shipment-status ${fulfillment.shipment.status === 'FAILED' ? 'is-failed' : ''}`}>{fulfillment.shipment.status}</span>
                  <dl className="admin-definition-grid admin-definition-single">
                    <div><dt>Provider</dt><dd>{fulfillment.shipment.provider}</dd></div>
                    <div><dt>Consignment</dt><dd>{fulfillment.shipment.consignmentId || '—'}</dd></div>
                    <div><dt>Tracking code</dt><dd className="admin-break-value">{fulfillment.shipment.trackingCode || '—'}</dd></div>
                    <div><dt>Provider status</dt><dd>{fulfillment.shipment.providerStatus || '—'}</dd></div>
                    <div><dt>Submitted</dt><dd>{fulfillment.shipment.submittedAt ? formatDate(fulfillment.shipment.submittedAt, order.timezone) : '—'}</dd></div>
                  </dl>
                  {fulfillment.shipment.lastError ? <p className="admin-error">{fulfillment.shipment.lastError}</p> : null}
                </>
              ) : <p className="admin-note">No courier consignment has been created for this order.</p>}
              {fulfillment?.canManage && fulfillment.shipment?.status !== 'SUBMITTED' && ['CONFIRMED', 'PROCESSING'].includes(order.status) ? (
                <SteadfastShipmentForm publicId={order.publicId} retry={Boolean(fulfillment.shipment)} />
              ) : null}
            </div>
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
