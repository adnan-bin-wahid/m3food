import Link from 'next/link';

const sections = [
  ['Overview', '/admin/marketing'],
  ['Visitors', '/admin/marketing/visitors'],
  ['Interactions', '/admin/marketing/interactions'],
  ['Clarity', '/admin/marketing/clarity'],
  ['Pixel & CAPI', '/admin/marketing/pixel'],
  ['Funnel', '/admin/marketing/funnel'],
  ['Campaigns', '/admin/marketing/campaigns'],
  ['Ads', '/admin/marketing/ads'],
  ['Sources', '/admin/marketing/sources'],
  ['Retargeting', '/admin/marketing/retargeting'],
];

export default function MarketingNav({ current, range = '30d', from, to }) {
  const queryParams = new URLSearchParams();
  queryParams.set('range', range);
  if (range === 'custom') {
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
  }
  const queryString = queryParams.toString();

  return (
    <nav className="admin-marketing-nav" aria-label="Marketing analytics navigation">
      {sections.map(([label, href]) => {
        const destination = href.includes('retargeting') ? href : `${href}?${queryString}`;
        return <Link key={href} href={destination} aria-current={current === href ? 'page' : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
