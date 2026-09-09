import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import {
  listAdminOrders,
  parseAdminOrderQuery,
} from '../../../src/lib/admin/order-admin-service';
import { ORDER_STATUSES } from '../../../src/lib/commerce/order-status';
import { DrizzleAdminOrderRepository } from '../../../src/lib/db/admin-order-repository';

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

function pageHref(query, page) {
  const parameters = new URLSearchParams();
  if (query.query) parameters.set('q', query.query);
  if (query.status) parameters.set('status', query.status);
  parameters.set('page', String(page));
  return `/admin/orders?${parameters.toString()}`;
}

export default async function OrdersPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const parameters = await searchParams;
  const query = parseAdminOrderQuery(parameters);
  const result = await listAdminOrders(
    admin.storeId,
    query,
    new DrizzleAdminOrderRepository(),
  );

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{admin.storeSlug}</p>
          <h1>Orders</h1>
          <p className="admin-muted admin-header-copy">
            Search customers, inspect complete order records, and manage the fulfilment lifecycle.
          </p>
        </div>
        <span className="admin-count-badge">{result.total} total</span>
      </header>

      <form className="admin-order-filters" method="get">
        <label>
          Search
          <input
            name="q"
            type="search"
            defaultValue={query.query}
            maxLength="80"
            placeholder="Order ID, customer, or phone"
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={query.status ?? ''}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{label(status)}</option>
            ))}
          </select>
        </label>
        <button className="admin-button" type="submit">Apply filters</button>
        {(query.query || query.status) ? (
          <Link className="admin-secondary-button" href="/admin/orders">Clear</Link>
        ) : null}
      </form>

      <section className="admin-panel admin-orders-panel" aria-label="Order results">
        {result.orders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>District</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {result.orders.map((order) => (
                  <tr key={order.publicId}>
                    <td>
                      <Link className="admin-order-link" href={`/admin/orders/${order.publicId}`}>
                        {order.publicId}
                      </Link>
                    </td>
                    <td><strong>{order.customerName}</strong><small>{order.customerPhone}</small></td>
                    <td>{order.district}</td>
                    <td className="admin-capitalize">{order.source}</td>
                    <td><span className={`admin-status-pill admin-status-${order.status.toLowerCase()}`}>{label(order.status)}</span></td>
                    <td><span className={`admin-risk-pill admin-risk-${order.riskLevel.toLowerCase()}`}>{order.riskLevel}{order.manualReviewRequired ? ' · REVIEW' : ''}</span></td>
                    <td><span className="admin-payment-pill">{label(order.paymentStatus)}</span></td>
                    <td>{formatMoney(order.totalMinor, order.currency)}</td>
                    <td>{formatDate(order.createdAt, order.timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <h2>No matching orders</h2>
            <p>Change the search or status filter to see another result set.</p>
          </div>
        )}

        <footer className="admin-pagination">
          <span>Page {query.page} of {result.totalPages}</span>
          <div>
            {query.page > 1 ? (
              <Link href={pageHref(query, query.page - 1)}>Previous</Link>
            ) : <span>Previous</span>}
            {query.page < result.totalPages ? (
              <Link href={pageHref(query, query.page + 1)}>Next</Link>
            ) : <span>Next</span>}
          </div>
        </footer>
      </section>
    </AdminShell>
  );
}
