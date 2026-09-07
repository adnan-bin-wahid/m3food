import Link from 'next/link';

const sections = [
  ['Overview', '/admin/marketing'],
  ['Visitors', '/admin/marketing/visitors'],
  ['Funnel', '/admin/marketing/funnel'],
  ['Sources', '/admin/marketing/sources'],
  ['Retargeting', '/admin/marketing/retargeting'],
];

export default function MarketingNav({ current, range = '30d' }) {
  return (
    <nav className="admin-marketing-nav" aria-label="Marketing analytics navigation">
      {sections.map(([label, href]) => {
        const destination = href.includes('retargeting') ? href : `${href}?range=${range}`;
        return <Link key={href} href={destination} aria-current={current === href ? 'page' : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
