import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import { CustomerNoteForm, CustomerTagForm, CustomerTagRemoveForm } from '../../../../components/admin/CustomerForms';
import { getAdminCustomer } from '../../../../src/lib/admin/customer-admin-service';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { DrizzleAdminCustomerRepository } from '../../../../src/lib/db/admin-customer-repository';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
}
function formatDate(value, timezone) {
  if (!value) return '—';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(date);
}
function label(value) { return String(value).charAt(0) + String(value).slice(1).toLowerCase().replaceAll('_', ' '); }
function consentLabel(value) { return value ? 'Allowed' : 'Declined'; }

export default async function CustomerDetailPage({ params }) {
  const admin = await requireCurrentAdmin();
  const { customerId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(customerId))) notFound();
  const customer = await getAdminCustomer(admin, customerId, new DrizzleAdminCustomerRepository());
  if (!customer) notFound();

  return (
    <AdminShell admin={admin}>
      <Link className="admin-back-link" href="/admin/customers">← Back to customers</Link>
      <header className="admin-order-detail-header">
        <div>
          <p className="admin-eyebrow">Customer profile</p>
          <h1>{customer.name}</h1>
          <p className="admin-muted">Customer since {formatDate(customer.createdAt, customer.store.timezone)}</p>
        </div>
        <span className={`admin-access-badge ${customer.canManage ? 'admin-access-write' : ''}`}>{customer.canManage ? 'CRM access' : 'Read only'}</span>
      </header>

      <section className="admin-catalog-metrics" aria-label="Customer lifetime metrics">
        <article className="admin-metric-card"><span>Orders</span><strong>{customer.orderCount}</strong><small>{customer.deliveredOrderCount} delivered</small></article>
        <article className="admin-metric-card"><span>Lifetime value</span><strong>{formatMoney(customer.deliveredRevenueMinor, customer.store.currency)}</strong><small>delivered orders only</small></article>
        <article className="admin-metric-card"><span>Average delivered order</span><strong>{formatMoney(customer.averageDeliveredOrderMinor, customer.store.currency)}</strong><small>delivered AOV</small></article>
        <article className="admin-metric-card"><span>Last order</span><strong className="admin-metric-date">{formatDate(customer.lastOrderAt, customer.store.timezone)}</strong><small>first {formatDate(customer.firstOrderAt, customer.store.timezone)}</small></article>
      </section>

      <div className="admin-order-detail-grid admin-customer-detail-grid">
        <div className="admin-order-detail-main">
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Order history</h2><span>Latest 100</span></div>
            {customer.orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Status</th><th>Payment</th><th>Source</th><th>Total</th><th>Placed</th></tr></thead><tbody>
              {customer.orders.map((order) => <tr key={order.publicId}>
                <td><Link className="admin-order-link" href={`/admin/orders/${order.publicId}`}>{order.publicId}</Link></td>
                <td><span className={`admin-status-pill admin-status-${order.status.toLowerCase()}`}>{label(order.status)}</span></td>
                <td>{label(order.paymentStatus)}</td><td className="admin-capitalize">{order.source ?? 'Direct'}</td><td>{formatMoney(order.totalMinor, order.currency)}</td><td>{formatDate(order.createdAt, customer.store.timezone)}</td>
              </tr>)}
            </tbody></table></div> : <p className="admin-muted">No orders are linked to this customer.</p>}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Internal notes</h2><span>Append-only</span></div>
            {customer.canManage ? <CustomerNoteForm customerId={customer.id} /> : <p className="admin-note">Your role cannot add CRM notes.</p>}
            <div className="admin-customer-note-list">
              {customer.notes.length ? customer.notes.map((note) => <article key={note.id}><p>{note.note}</p><small>{note.createdByAdminEmail} · {formatDate(note.createdAt, customer.store.timezone)}</small></article>) : <p className="admin-muted">No internal notes yet.</p>}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>CRM activity</h2><span>Latest 30</span></div>
            {customer.activity.length ? <ol className="admin-customer-activity">{customer.activity.map((entry) => <li key={entry.id}><strong>{label(entry.action)}</strong><span>{entry.changedByAdminEmail}</span><small>{formatDate(entry.createdAt, customer.store.timezone)}</small></li>)}</ol> : <p className="admin-muted">No CRM activity yet.</p>}
          </section>
        </div>

        <aside className="admin-order-detail-side">
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Contact</h2></div>
            <address className="admin-address"><strong>{customer.name}</strong><a href={`tel:${customer.phone}`}>{customer.phone}</a>{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : <span>No email</span>}</address>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Latest marketing consent</h2></div>
            <dl className="admin-definition-grid admin-definition-single">
              <div><dt>Email</dt><dd className={customer.consent.emailMarketingAllowed ? 'admin-consent-positive' : ''}>{consentLabel(customer.consent.emailMarketingAllowed)}</dd></div>
              <div><dt>SMS</dt><dd className={customer.consent.smsMarketingAllowed ? 'admin-consent-positive' : ''}>{consentLabel(customer.consent.smsMarketingAllowed)}</dd></div>
              <div><dt>WhatsApp</dt><dd className={customer.consent.whatsappMarketingAllowed ? 'admin-consent-positive' : ''}>{consentLabel(customer.consent.whatsappMarketingAllowed)}</dd></div>
              <div><dt>Policy</dt><dd>{customer.consent.privacyPolicyVersion ?? '—'}</dd></div>
              <div><dt>Captured</dt><dd>{formatDate(customer.consent.capturedAt, customer.store.timezone)}</dd></div>
            </dl>
            <p className="admin-note">Consent is read-only here and comes from the customer’s latest order consent snapshot.</p>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Tags</h2></div>
            <div className="admin-tag-list admin-tag-list-detail">
              {customer.tags.length ? customer.tags.map((tag) => <span className="admin-customer-tag" key={tag}>{tag}{customer.canManage ? <CustomerTagRemoveForm customerId={customer.id} tag={tag} /> : null}</span>) : <span className="admin-muted">No tags</span>}
            </div>
            {customer.canManage ? <CustomerTagForm customerId={customer.id} /> : null}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Acquisition sources</h2></div>
            {customer.acquisitionSources.length ? <ul className="admin-source-list">{customer.acquisitionSources.map((source) => <li key={source.source}><span className="admin-capitalize">{source.source}</span><strong>{source.orderCount}</strong></li>)}</ul> : <p className="admin-muted">No source data.</p>}
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
