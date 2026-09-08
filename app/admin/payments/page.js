import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import {
  PAYMENT_RECONCILIATION_ISSUES,
} from '../../../src/lib/admin/payment-reconciliation-repository';
import {
  listAdminPaymentReconciliation,
} from '../../../src/lib/admin/payment-reconciliation-service';
import {
  PAYMENT_SETTLEMENT_STATUSES,
} from '../../../src/lib/admin/payment-settlement-repository';
import { DrizzleAdminPaymentReconciliationRepository } from '../../../src/lib/db/admin-payment-reconciliation-repository';

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

function label(value) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function issueLabel(issue) {
  switch (issue) {
    case 'DELIVERED_UNSETTLED':
      return 'Delivered · settlement unresolved';
    case 'REVERSED_AWAITING_REFUND':
      return 'Cancelled/returned · refund outstanding';
    case 'STATUS_MISMATCH':
      return 'Order/payment status mismatch';
    case 'MISSING_PAYMENT':
      return 'Missing payment record';
    default:
      return label(issue);
  }
}

function pageHref(query, page) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.issue) params.set('issue', query.issue);
  if (query.paymentStatus) {
    params.set('paymentStatus', query.paymentStatus);
  }
  params.set('page', String(page));
  return `/admin/payments?${params.toString()}`;
}

export default async function PaymentsPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const parameters = await searchParams;
  const result = await listAdminPaymentReconciliation(
    admin,
    parameters,
    new DrizzleAdminPaymentReconciliationRepository(),
  );

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Payment operations</p>
          <h1>Payment reconciliation</h1>
          <p className="admin-muted admin-header-copy">
            Resolve payment states that block realized profitability or violate the order/latest-payment integrity contract.
          </p>
        </div>
        <span className="admin-count-badge">
          {result.summary.totalUnresolved} unresolved
        </span>
      </header>

      <section
        className="admin-metric-grid"
        aria-label="Payment reconciliation summary"
      >
        <article className="admin-metric-card admin-metric-card-accent">
          <span>Delivered unresolved</span>
          <strong>{result.summary.deliveredUnsettled}</strong>
          <small>UNPAID, PENDING, or FAILED after delivery</small>
        </article>
        <article className="admin-metric-card">
          <span>Refund outstanding</span>
          <strong>{result.summary.reversedAwaitingRefund}</strong>
          <small>Cancelled/returned with PAID or PENDING settlement</small>
        </article>
        <article className="admin-metric-card">
          <span>Status mismatch</span>
          <strong>{result.summary.statusMismatch}</strong>
          <small>Order snapshot differs from latest payment</small>
        </article>
        <article className="admin-metric-card">
          <span>Missing payment</span>
          <strong>{result.summary.missingPayment}</strong>
          <small>Integrity exception requiring investigation</small>
        </article>
        <article className="admin-metric-card">
          <span>Oldest unresolved</span>
          <strong>
            {result.summary.oldestUnresolvedHours === null
              ? '—'
              : `${result.summary.oldestUnresolvedHours}h`}
          </strong>
          <small>Age since the latest order/payment reconciliation touch</small>
        </article>
      </section>

      <form className="admin-order-filters" method="get">
        <label>
          Search
          <input
            name="q"
            type="search"
            defaultValue={result.query.q}
            maxLength="80"
            placeholder="Order, customer, phone, or reference"
          />
        </label>
        <label>
          Issue
          <select name="issue" defaultValue={result.query.issue ?? ''}>
            <option value="">All unresolved issues</option>
            {PAYMENT_RECONCILIATION_ISSUES.map((issue) => (
              <option key={issue} value={issue}>
                {issueLabel(issue)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Payment
          <select
            name="paymentStatus"
            defaultValue={result.query.paymentStatus ?? ''}
          >
            <option value="">All payment statuses</option>
            {PAYMENT_SETTLEMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
        </label>
        <button className="admin-button" type="submit">
          Apply filters
        </button>
        {(result.query.q ||
          result.query.issue ||
          result.query.paymentStatus) ? (
          <Link
            className="admin-secondary-button"
            href="/admin/payments"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <section
        className="admin-panel admin-orders-panel"
        aria-label="Payment reconciliation queue"
      >
        {result.rows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Lifecycle</th>
                  <th>Payment</th>
                  <th>Issue</th>
                  <th>Amount</th>
                  <th>Reference / revision</th>
                  <th>Last touch</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.publicId}>
                    <td>
                      <Link
                        className="admin-order-link"
                        href={`/admin/orders/${row.publicId}`}
                      >
                        {row.publicId}
                      </Link>
                    </td>
                    <td>
                      <strong>{row.customerName}</strong>
                      <small>{row.customerPhone}</small>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill admin-status-${row.orderStatus.toLowerCase()}`}
                      >
                        {label(row.orderStatus)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-payment-pill">
                        {row.paymentStatus
                          ? label(row.paymentStatus)
                          : 'Missing'}
                      </span>
                      <small>{row.method}</small>
                    </td>
                    <td>
                      <strong>{issueLabel(row.issue)}</strong>
                      <small>{row.action}</small>
                    </td>
                    <td>
                      {formatMoney(row.amountMinor, row.currency)}
                    </td>
                    <td>
                      <span>{row.providerReference ?? '—'}</span>
                      <small>
                        Revision {row.paymentRevision ?? '—'}
                      </small>
                    </td>
                    <td>
                      {formatDate(
                        row.attentionSince,
                        row.timezone,
                      )}
                      <small>{row.attentionAgeHours}h ago</small>
                    </td>
                    <td>
                      <Link
                        className="admin-order-link"
                        href={`/admin/orders/${row.publicId}#payment-reconciliation`}
                      >
                        {result.canManage ? 'Reconcile' : 'Review'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <h2>No unresolved payment issues</h2>
            <p>
              The current filter has no settlement exception requiring review.
            </p>
          </div>
        )}

        <footer className="admin-pagination">
          <span>
            Page {result.query.page} of {result.totalPages} · {result.total} matching
          </span>
          <div>
            {result.query.page > 1 ? (
              <Link
                href={pageHref(
                  result.query,
                  result.query.page - 1,
                )}
              >
                Previous
              </Link>
            ) : (
              <span>Previous</span>
            )}
            {result.query.page < result.totalPages ? (
              <Link
                href={pageHref(
                  result.query,
                  result.query.page + 1,
                )}
              >
                Next
              </Link>
            ) : (
              <span>Next</span>
            )}
          </div>
        </footer>
      </section>

      <p className="admin-note">
        Reconciliation writes are not duplicated here. The queue links to the existing revision-protected S01 payment form, which atomically updates the latest payment, the order payment snapshot, and immutable payment status history. Analysts remain read-only.
      </p>
    </AdminShell>
  );
}
