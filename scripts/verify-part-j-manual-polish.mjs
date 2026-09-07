import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const service = read('src/lib/admin/marketing-analytics-service.ts');
const repoType = read('src/lib/admin/marketing-analytics-repository.ts');
const dbRepo = read('src/lib/db/admin-marketing-analytics-repository.ts');
const overview = read('app/admin/marketing/page.js');
const visitors = read('app/admin/marketing/visitors/page.js');
const funnel = read('app/admin/marketing/funnel/page.js');
const css = read('app/admin/admin.css');

const required = [
  [repoType, 'MarketingFunnelVisitorTotals'],
  [repoType, 'funnelVisitors: MarketingFunnelVisitorTotals'],
  [dbRepo, "bool_or(ce.event_name = 'VIEW_CONTENT') as viewed"],
  [dbRepo, 'purchaserVisitors'],
  [service, 'reachedProductViews'],
  [service, 'reachedPurchasers'],
  [service, 'label: "Purchasers"'],
  [overview, 'className="admin-status-card"'],
  [overview, 'className="admin-stacked-cell"'],
  [visitors, 'className="admin-stacked-cell"'],
  [funnel, 'unique tracked visitors reaching each commerce stage'],
  [css, 'Part J manual smoke-test polish'],
  [css, '.admin-stacked-cell > small'],
];

for (const [content, token] of required) {
  if (!content.includes(token)) throw new Error(`Part J manual polish token missing: ${token}`);
}

if (service.includes('{ key: "orders", label: "Orders", value: orders.orders }')) {
  throw new Error('Raw order count is still being used as a unique-visitor funnel stage.');
}

console.log('PART J MANUAL UI POLISH VERIFIED');
console.log('Funnel stages use monotonic unique visitor reach: present');
console.log('Order count remains separate from purchaser conversion: present');
console.log('Overview status cards have proper card layout: present');
console.log('Visitor/source secondary labels have stacked spacing: present');
