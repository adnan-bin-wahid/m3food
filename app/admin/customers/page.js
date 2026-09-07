import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';
import {
  HIGH_VALUE_CUSTOMER_THRESHOLD_MINOR,
  listAdminCustomers,
  parseAdminCustomerQuery,
} from '../../../src/lib/admin/customer-admin-service';
import { requireCurrentAdmin } from '../../../src/lib/auth/current-admin';
import { DrizzleAdminCustomerRepository } from '../../../src/lib/db/admin-customer-repository';

export const dynamic = 'force-dynamic';

function formatMoney(minor, currency) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
}

function formatDate(value, timezone) {
  if (!value) return '—';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeZone: timezone,
  }).format(date);
}

function pageHref(query, page) {
  const p = new URLSearchParams();
  if (query.query) p.set('q', query.query);
  if (query.segment !== 'ALL') p.set('segment', query.segment);
  if (query.channel !== 'ALL') p.set('channel', query.channel);
  p.set('page', String(page));
  return `/admin/customers?${p.toString()}`;
}

function consentCount(consent) {
  return [consent.emailMarketingAllowed, consent.smsMarketingAllowed, consent.whatsappMarketingAllowed].filter(Boolean).length;
}

export default async function CustomersPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const parameters = await searchParams;
  const query = parseAdminCustomerQuery(parameters);
  const result = await listAdminCustomers(admin, query, new DrizzleAdminCustomerRepository());

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{result.store.slug}</p>
          <h1>Customers</h1>
          <p className="admin-muted admin-header-copy">Customer history, repeat behaviour, consent-aware audiences, tags, and internal CRM notes.</p>
        </div>
        <span className="admin-count-badge">{result.total} matching</span>
      </header>

      <section className="admin-catalog-metrics" aria-label="Customer summary">
        <article className="admin-metric-card"><span>Customers</span><strong>{result.summary.customerCount}</strong><small>store total</small></article>
        <article className="admin-metric-card"><span>Repeat</span><strong>{result.summary.repeatCustomerCount}</strong><small>2+ orders</small></article>
        <article className="admin-metric-card"><span>Delivered revenue</span><strong>{formatMoney(result.summary.deliveredRevenueMinor, result.store.currency)}</strong><small>customer lifetime delivered value</small></article>
        <article className="admin-metric-card"><span>Marketing eligible</span><strong>{result.summary.marketingEligibleCount}</strong><small>latest consent allows ≥1 channel</small></article>
      </section>

      <form className="admin-order-filters admin-customer-filters" method="get">
        <label>
          Search
          <input name="q" type="search" defaultValue={query.query} maxLength="80" placeholder="Name, phone, or email" />
        </label>
        <label>
          Segment
          <select name="segment" defaultValue={query.segment}>
            <option value="ALL">All customers</option>
            <option value="NEW">New / one order</option>
            <option value="REPEAT">Repeat / 2+ orders</option>
            <option value="HIGH_VALUE">High value / {formatMoney(HIGH_VALUE_CUSTOMER_THRESHOLD_MINOR, result.store.currency)} delivered</option>
          </select>
        </label>
        <label>
          Marketing channel
          <select name="channel" defaultValue={query.channel}>
            <option value="ALL">Any consent state</option>
            <option value="EMAIL">Email allowed</option>
            <option value="SMS">SMS allowed</option>
            <option value="WHATSAPP">WhatsApp allowed</option>
          </select>
        </label>
        <button className="admin-button" type="submit">Apply filters</button>
        {(query.query || query.segment !== 'ALL' || query.channel !== 'ALL') ? <Link className="admin-secondary-button" href="/admin/customers">Clear</Link> : null}
      </form>

      {result.canExport ? (
        <section className="admin-panel admin-audience-panel" aria-label="Consent-aware audience export">
          <div>
            <p className="admin-eyebrow">Marketing audience</p>
            <h2>Export consent-safe CSV</h2>
            <p className="admin-muted">Exports use each customer’s latest captured order consent. Admin cannot turn consent on from this screen.</p>
          </div>
          <div className="admin-audience-actions">
            <a className="admin-secondary-button" href="/api/admin/customers/export?channel=EMAIL">Email CSV</a>
            <a className="admin-secondary-button" href="/api/admin/customers/export?channel=SMS">SMS CSV</a>
            <a className="admin-secondary-button" href="/api/admin/customers/export?channel=WHATSAPP">WhatsApp CSV</a>
          </div>
        </section>
      ) : null}

      <section className="admin-panel admin-orders-panel" aria-label="Customer results">
        {result.customers.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-customers-table">
              <thead><tr><th>Customer</th><th>Orders</th><th>Delivered value</th><th>Last order</th><th>Marketing</th><th>Tags</th></tr></thead>
              <tbody>
                {result.customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link className="admin-order-link" href={`/admin/customers/${customer.id}`}>{customer.name}</Link>
                      <small>{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</small>
                    </td>
                    <td><strong>{customer.orderCount}</strong><small>{customer.deliveredOrderCount} delivered</small></td>
                    <td>{formatMoney(customer.deliveredRevenueMinor, result.store.currency)}</td>
                    <td>{formatDate(customer.lastOrderAt, result.store.timezone)}</td>
                    <td><span className={consentCount(customer.consent) ? 'admin-consent-positive' : 'admin-muted'}>{consentCount(customer.consent)} channel{consentCount(customer.consent) === 1 ? '' : 's'}</span></td>
                    <td>{customer.tags.length ? <div className="admin-tag-list">{customer.tags.slice(0, 3).map((tag) => <span className="admin-customer-tag" key={tag}>{tag}</span>)}</div> : <span className="admin-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty-state"><h2>No matching customers</h2><p>Change the search, segment, or consent filter.</p></div>}

        <footer className="admin-pagination">
          <span>Page {query.page} of {result.totalPages}</span>
          <div>
            {query.page > 1 ? <Link href={pageHref(query, query.page - 1)}>Previous</Link> : <span>Previous</span>}
            {query.page < result.totalPages ? <Link href={pageHref(query, query.page + 1)}>Next</Link> : <span>Next</span>}
          </div>
        </footer>
      </section>
    </AdminShell>
  );
}
