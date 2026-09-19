'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminLogoutButton from './AdminLogoutButton';

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Auto-expand Marketing dropdown if current route is within marketing
  const isMarketingActive = pathname ? pathname.startsWith('/admin/marketing') : false;
  const [isMarketingOpen, setIsMarketingOpen] = useState(isMarketingActive);

  const closeNav = () => setIsMobileNavOpen(false);
  const brandTitle = admin?.storeName ? `${admin.storeName} Admin` : 'Niyamah Admin';

  const toggleMarketing = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMarketingOpen((prev) => !prev);
  };

  const isActive = (path, exact = false) => {
    if (!pathname) return false;
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

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
            <span className="admin-brand-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </span>
            <span className="admin-brand-text">{brandTitle}</span>
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
          <Link
            className={`admin-nav-link ${isActive('/admin/dashboard', true) ? 'is-active' : ''}`}
            href="/admin/dashboard"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="admin-nav-label">Dashboard</span>
          </Link>

          <Link
            className={`admin-nav-link ${isActive('/admin/financials') ? 'is-active' : ''}`}
            href="/admin/financials"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span className="admin-nav-label">Financials</span>
          </Link>

          <Link
            className={`admin-nav-link ${isActive('/admin/payments') ? 'is-active' : ''}`}
            href="/admin/payments"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            <span className="admin-nav-label">Payments</span>
          </Link>

          <Link
            className={`admin-nav-link ${isActive('/admin/orders') ? 'is-active' : ''}`}
            href="/admin/orders"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <span className="admin-nav-label">Orders</span>
          </Link>

          <Link
            className={`admin-nav-link ${isActive('/admin/catalog') ? 'is-active' : ''}`}
            href="/admin/catalog"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </span>
            <span className="admin-nav-label">Catalog</span>
          </Link>

          <Link
            className={`admin-nav-link ${isActive('/admin/customers') ? 'is-active' : ''}`}
            href="/admin/customers"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="admin-nav-label">Customers</span>
          </Link>

          {/* Marketing Accordion / Dropdown Group */}
          <div className={`admin-nav-group ${isMarketingOpen ? 'is-expanded' : ''}`}>
            <div className="admin-nav-group-row">
              <Link
                className={`admin-nav-link admin-nav-group-title ${isMarketingActive ? 'is-active' : ''}`}
                href="/admin/marketing"
                onClick={() => {
                  setIsMarketingOpen(true);
                  closeNav();
                }}
              >
                <span className="admin-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 11 18-5v12L3 14v-3z" />
                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                  </svg>
                </span>
                <span className="admin-nav-label">Marketing</span>
              </Link>
              <button
                type="button"
                className="admin-nav-toggle-btn"
                onClick={toggleMarketing}
                aria-label={isMarketingOpen ? 'Collapse Marketing menu' : 'Expand Marketing menu'}
                aria-expanded={isMarketingOpen}
              >
                <svg
                  className={`admin-chevron-icon ${isMarketingOpen ? 'is-rotated' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <div className={`admin-nav-submenu ${isMarketingOpen ? 'is-open' : ''}`}>
              <div className="admin-nav-submenu-section">
                <Link
                  className={`admin-submenu-link ${pathname === '/admin/marketing' ? 'is-active' : ''}`}
                  href="/admin/marketing"
                  onClick={closeNav}
                >
                  Overview
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/visitors') ? 'is-active' : ''}`}
                  href="/admin/marketing/visitors"
                  onClick={closeNav}
                >
                  Customers & Traffic
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/interactions') ? 'is-active' : ''}`}
                  href="/admin/marketing/interactions"
                  onClick={closeNav}
                >
                  Customer Behavior
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/ads') ? 'is-active' : ''}`}
                  href="/admin/marketing/ads"
                  onClick={closeNav}
                >
                  Ad Performance
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/funnel') ? 'is-active' : ''}`}
                  href="/admin/marketing/funnel"
                  onClick={closeNav}
                >
                  Sales Journey
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/retargeting') ? 'is-active' : ''}`}
                  href="/admin/marketing/retargeting"
                  onClick={closeNav}
                >
                  Recover Customers
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/clarity') ? 'is-active' : ''}`}
                  href="/admin/marketing/clarity"
                  onClick={closeNav}
                >
                  Recordings & Heatmaps
                </Link>
              </div>

              <div className="admin-nav-submenu-section admin-nav-submenu-advanced">
                <span className="admin-nav-section-title">Advanced</span>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/pixel') ? 'is-active' : ''}`}
                  href="/admin/marketing/pixel"
                  onClick={closeNav}
                >
                  Tracking Health
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/campaigns') ? 'is-active' : ''}`}
                  href="/admin/marketing/campaigns"
                  onClick={closeNav}
                >
                  Campaign Tracking
                </Link>
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/sources') ? 'is-active' : ''}`}
                  href="/admin/marketing/sources"
                  onClick={closeNav}
                >
                  Attribution & Sources
                </Link>
              </div>

              <div className="admin-nav-submenu-section admin-nav-submenu-help">
                <Link
                  className={`admin-submenu-link ${isActive('/admin/marketing/help') ? 'is-active' : ''}`}
                  href="/admin/marketing/help"
                  onClick={closeNav}
                >
                  Help & Learn
                </Link>
              </div>
            </div>
          </div>

          <Link
            className={`admin-nav-link ${isActive('/admin/settings') ? 'is-active' : ''}`}
            href="/admin/settings"
            onClick={closeNav}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="admin-nav-label">Settings</span>
          </Link>
        </nav>

        {/* User Card & Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-profile-card">
            <div className="admin-user-avatar" aria-hidden="true">
              {admin.displayName ? admin.displayName.slice(0, 1).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{admin.displayName || 'Admin'}</span>
              <span className="admin-user-email">{admin.email}</span>
            </div>
          </div>
          <div className="admin-sidebar-logout-wrap">
            <AdminLogoutButton />
          </div>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
