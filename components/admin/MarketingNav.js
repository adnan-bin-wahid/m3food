import Link from 'next/link';

const businessSections = [
  ['Overview', '/admin/marketing'],
  ['Customers & Traffic', '/admin/marketing/visitors'],
  ['Customer Behavior', '/admin/marketing/interactions'],
  ['Ad Performance', '/admin/marketing/ads'],
  ['Sales Journey', '/admin/marketing/funnel'],
  ['Recover Customers', '/admin/marketing/retargeting'],
  ['Recordings & Heatmaps', '/admin/marketing/clarity'],
];

const advancedSections = [
  ['Tracking Health', '/admin/marketing/pixel'],
  ['Campaign Tracking', '/admin/marketing/campaigns'],
  ['Attribution & Sources', '/admin/marketing/sources'],
];

export default function MarketingNav({ current, range = '30d', from, to }) {
  const queryParams = new URLSearchParams();
  queryParams.set('range', range);
  if (range === 'custom') {
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
  }
  const queryString = queryParams.toString();

  const allSections = [...businessSections, ...advancedSections];
  const currentSection = allSections.find(([, href]) => current === href);
  const currentTitle = currentSection ? currentSection[0] : 'Marketing';

  return (
    <div className="admin-marketing-nav-container">
      <nav className="admin-marketing-context-bar" aria-label="Marketing section switcher">
        <div className="admin-marketing-breadcrumb">
          <Link href="/admin/marketing" className="admin-breadcrumb-root">Marketing</Link>
          <span className="admin-breadcrumb-sep">/</span>
          <span className="admin-breadcrumb-active">{currentTitle}</span>
        </div>

        <details className="admin-marketing-dropdown">
          <summary className="admin-marketing-dropdown-btn">
            Switch section ▾
          </summary>
          <div className="admin-marketing-dropdown-menu">
            <div className="admin-dropdown-group-label">Core Business</div>
            {businessSections.map(([label, href]) => {
              const destination = href.includes('retargeting') ? href : `${href}?${queryString}`;
              const isSelected = current === href;
              return (
                <Link
                  key={href}
                  href={destination}
                  className={`admin-dropdown-item ${isSelected ? 'is-active' : ''}`}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  {label}
                </Link>
              );
            })}
            <div className="admin-dropdown-divider" />
            <div className="admin-dropdown-group-label">Technical & Diagnostics</div>
            {advancedSections.map(([label, href]) => {
              const destination = `${href}?${queryString}`;
              const isSelected = current === href;
              return (
                <Link
                  key={href}
                  href={destination}
                  className={`admin-dropdown-item ${isSelected ? 'is-active' : ''}`}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  {label}
                </Link>
              );
            })}
            <div className="admin-dropdown-divider" />
            <Link
              href="/admin/marketing/help"
              className={`admin-dropdown-item ${current === '/admin/marketing/help' ? 'is-active' : ''}`}
            >
              Help & Learn
            </Link>
          </div>
        </details>
      </nav>
    </div>
  );
}
