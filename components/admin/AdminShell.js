'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminLogoutButton from './AdminLogoutButton';

export default function AdminShell({ admin, children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeNav = () => setIsMobileNavOpen(false);
  const brandTitle = admin?.storeName ? `${admin.storeName} Admin` : 'Niyamah Admin';

  return (
    <div className="admin-shell">
      {/* Mobile Top Navigation Bar (Shown on screens <= 900px) */}
      <header className="admin-mobile-header" aria-label="Mobile navigation header">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={() => setIsMobileNavOpen((prev) => !prev)}
          aria-expanded={isMobileNavOpen}
          aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className="admin-hamburger-icon" aria-hidden="true">
            {isMobileNavOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </span>
        </button>

        <Link className="admin-brand admin-brand-mobile" href="/admin/dashboard" onClick={closeNav}>
          {brandTitle}
        </Link>

        <div className="admin-mobile-user-badge" title={admin.email || admin.displayName}>
          <span>{admin.displayName ? admin.displayName.slice(0, 1).toUpperCase() : 'A'}</span>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileNavOpen ? (
        <div
          className="admin-backdrop"
          onClick={closeNav}
          aria-hidden="true"
        />
      ) : null}

      {/* Sidebar (Permanent on desktop, slide-out drawer on mobile) */}
      <aside className={`admin-sidebar ${isMobileNavOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link className="admin-brand" href="/admin/dashboard" onClick={closeNav}>
            {brandTitle}
          </Link>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={closeNav}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin/dashboard" onClick={closeNav}>Dashboard</Link>
          <Link href="/admin/financials" onClick={closeNav}>Financials</Link>
          <Link href="/admin/payments" onClick={closeNav}>Payments</Link>
          <Link href="/admin/orders" onClick={closeNav}>Orders</Link>
          <Link href="/admin/catalog" onClick={closeNav}>Catalog</Link>
          <Link href="/admin/customers" onClick={closeNav}>Customers</Link>
          <div className="admin-nav-group">
            <Link className="admin-nav-group-title" href="/admin/marketing" onClick={closeNav}>Marketing</Link>
            <div className="admin-nav-submenu">
              <Link href="/admin/marketing" onClick={closeNav}>Overview</Link>
              <Link href="/admin/marketing/visitors" onClick={closeNav}>Visitors</Link>
              <Link href="/admin/marketing/interactions" onClick={closeNav}>Interactions</Link>
              <Link href="/admin/marketing/clarity" onClick={closeNav}>Clarity (Replay & Heatmaps)</Link>
              <Link href="/admin/marketing/funnel" onClick={closeNav}>Funnel</Link>
              <Link href="/admin/marketing/campaigns" onClick={closeNav}>Campaigns</Link>
              <Link href="/admin/marketing/ads" onClick={closeNav}>Ads</Link>
              <Link href="/admin/marketing/sources" onClick={closeNav}>Sources</Link>
              <Link href="/admin/marketing/retargeting" onClick={closeNav}>Retargeting</Link>
            </div>
          </div>
          <Link href="/admin/settings" onClick={closeNav}>Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <p>{admin.displayName}<br />{admin.email}</p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
