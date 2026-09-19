import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import PageIntro from '../../../../components/admin/marketing/PageIntro';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import {
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  preserveReportingPeriod,
} from '../../../../src/lib/admin/reporting-period';

export const dynamic = 'force-dynamic';

const TUTORIALS = [
  {
    id: 'dashboard',
    title: '1. Understand your dashboard',
    category: 'Getting Started',
    summary: 'What your revenue, orders, and visitor metrics mean at a glance.',
    content: `
      Your Marketing Overview gives you a high-level pulse of your store without technical noise.
      
      • Delivered Revenue: Revenue from orders marked delivered.
      • Orders: The total number of customer orders placed in your selected date range.
      • Ad Spend: How much you spent on active Facebook & Instagram campaigns.
      • Return on Ads (ROAS): How much revenue you earned for every ৳1 spent on ads. For example, 1.50× means you earned ৳1.50 for every ৳1 spent.
      
      Look at the "What is working" and "Needs your attention" cards first every morning to see quick opportunities.
    `,
    relatedHref: '/admin/marketing',
    relatedText: 'Open Marketing Overview →',
  },
  {
    id: 'sources',
    title: '2. Understand where customers come from',
    category: 'Acquisition',
    summary: 'First touch vs last touch, Meta ads, organic search, and direct links.',
    content: `
      Not all visitors buy on their first visit. Many people see an ad, browse, leave, and come back later to order.
      
      • First Touch: The very first channel that introduced the customer to your store (e.g. an Instagram ad).
      • Last Touch: The link or channel they used right before placing the order (e.g. a direct visit or a WhatsApp link).
      
      Comparing both tells you which ads build brand awareness and which links close the sale.
    `,
    relatedHref: '/admin/marketing/sources',
    relatedText: 'View Traffic Sources →',
  },
  {
    id: 'journey',
    title: '3. How your sales journey works',
    category: 'Conversion',
    summary: 'The 5 stages of visitor progression from landing to purchase.',
    content: `
      Visitors move through 5 clear stages on your store:
      
      1. Visited store: The person arrived and loaded your page.
      2. Viewed the product: They scrolled down to see package details, photos, or descriptions.
      3. Showed buying intent: They clicked an "Order Now" button or chose a specific package.
      4. Started ordering: They opened the delivery form and began entering their name or phone number.
      5. Completed order: They submitted their order and received an order confirmation.
      
      If many people drop between stages 3 and 4, your order button might be hard to find on mobile. If they drop between 4 and 5, your delivery fee or checkout form may have friction.
    `,
    relatedHref: '/admin/marketing/funnel',
    relatedText: 'Open Sales Journey →',
  },
  {
    id: 'meta-tracking',
    title: '4. How Meta ads tracking works',
    category: 'Tracking',
    summary: 'How dual browser + server tracking helps recover sales signals that browsers may miss.',
    content: `
      Your store can use two complementary tracking layers:
      
      • Browser Pixel: Runs in the visitor's browser. It captures instant clicks and views.
      • Server CAPI (Conversions API): Sends purchase signals directly from our server to Meta once configured. This helps recover sales signals that browsers may miss due to ad-blockers or privacy restrictions.
      
      Both layers can share the exact same Order ID. Shared event IDs allow Meta to deduplicate matching browser and server events when both are active.
    `,
    relatedHref: '/admin/marketing/pixel',
    relatedText: 'Check Tracking Health →',
  },
  {
    id: 'roas',
    title: '5. What is ROAS?',
    category: 'Efficiency',
    summary: 'Return on Ad Spend: Measuring ad revenue efficiency before business costs.',
    content: `
      ROAS stands for Return on Ad Spend. It is calculated as:
      
      Attributed Revenue ÷ Ad Spend = ROAS
      
      • 1.0× ROAS means: ৳1 in attributed revenue for every ৳1 of ad spend, before product, delivery, returns and other business costs.
      • ROAS measures ad revenue efficiency, not final profit.
      • Actual profitability depends on: product margin / COGS, delivery, returns/refunds, fulfillment, and operating overhead.
    `,
    relatedHref: '/admin/marketing/ads',
    relatedText: 'Check Ad Performance →',
  },
  {
    id: 'campaign-tracking',
    title: '6. How to track a campaign',
    category: 'Campaigns',
    summary: 'Step-by-step guide to creating tagged links for Facebook, Instagram, or Google.',
    content: `
      To know which ad creative is working, avoid posting plain website links. Use a tagged link:
      
      1. Go to Campaign Tracking.
      2. In the creator wizard, enter your Campaign Name (e.g. "Eid Sale 2026").
      3. Select where you will advertise (e.g. Facebook Ads).
      4. Enter which ad creative you are using (e.g. "Video 01").
      5. Click "Create campaign tracking link".
      6. Copy the generated URL and paste it into Facebook Ads Manager as your Website URL.
    `,
    relatedHref: '/admin/marketing/campaigns',
    relatedText: 'Open Campaign Tracking →',
  },
  {
    id: 'why-leave',
    title: '7. How to understand why customers leave',
    category: 'Behavior',
    summary: 'Analyzing drop-offs between product views, buying intent, and checkout.',
    content: `
      Use the Customer Behavior tab to inspect customer engagement:
      
      • Scroll Depth: If 80% of visitors leave before scrolling 50% of the page, your headline and initial image need to be more captivating.
      • Button Clicks: Check how many people saw your "Order Now" button versus how many clicked it. Compare this rate with your own previous periods to measure changes in customer interest.
      • Checkout Abandonment: If visitors open the checkout form but don't finish, review whether your delivery charge or cash-on-delivery instructions are clearly stated.
    `,
    relatedHref: '/admin/marketing/interactions',
    relatedText: 'Inspect Customer Behavior →',
  },
  {
    id: 'recordings',
    title: '8. How to use recordings and heatmaps',
    category: 'Recordings',
    summary: 'Using Microsoft Clarity to watch real customer video replays and click maps.',
    content: `
      Microsoft Clarity lets you watch real customer visits like a video:
      
      • Video Replays: Watch where the visitor moved their finger or mouse, where they paused to read, and what happened before they left.
      • Heatmaps: See glowing colored maps of where people click the most.
      • Rage Clicks: Spots where customers clicked repeatedly in frustration because an element didn't respond.
      
      Niyamah automatically links every session ID to Clarity so you can find any specific customer session in 1 click.
    `,
    relatedHref: '/admin/marketing/clarity',
    relatedText: 'Open Recordings & Heatmaps →',
  },
  {
    id: 'retargeting',
    title: '9. What retargeting means',
    category: 'Recovery',
    summary: 'Why interested visitors leave, and how showing them a reminder brings them back.',
    content: `
      Many first-time visitors do not buy immediately. They might be busy, researching, or comparing options.
      
      Retargeting means showing a gentle reminder ad only to people who already visited your store, clicked your product, or started checkout.
      
      Because these visitors already showed interest in your product, follow-ups or reminder ads can be more targeted than cold outreach.
    `,
    relatedHref: '/admin/marketing/retargeting',
    relatedText: 'View Recoverable Audiences →',
  },
  {
    id: 'recovery-how-to',
    title: '10. How to recover interested visitors',
    category: 'Recovery',
    summary: 'Step-by-step guide to creating custom audiences in Meta Ads Manager.',
    content: `
      To run a recovery ad on Facebook or Instagram:
      
      1. Open Recover Customers in Niyamah Admin.
      2. Choose an audience (e.g. "Started ordering but didn't finish").
      3. Note the qualifying event (e.g. InitiateCheckout) and lookback days (e.g. 14 days).
      4. In Meta Ads Manager → Audiences → Create Custom Audience → Website.
      5. Include InitiateCheckout in the last 14 days.
      6. Exclude Purchase in the last 14 days so existing buyers don't see the ad.
      7. Launch a campaign offering free delivery or a limited-time discount.
    `,
    relatedHref: '/admin/marketing/retargeting',
    relatedText: 'Open Customer Recovery →',
  },
];

export default async function MarketingHelpPage({ searchParams }) {
  const raw = await searchParams;
  const period = parseAdminReportingPeriod(raw);
  const reportingWindow = resolveAdminReportingWindow(
    period,
    new Date(),
    raw?.from,
    raw?.to,
  );
  const range = period;
  const admin = await requireCurrentAdmin();

  return (
    <AdminShell admin={admin}>
      <PageIntro
        pageKey="help"
        eyebrow="Niyamah Admin · Knowledge Base"
        title="Help & Learn"
        description="Simple, plain-language guides to help you understand your store visitors, track ad campaigns, and grow your sales."
      />

      <MarketingNav
        current="/admin/marketing/help"
        period={period}
        range={range}
        from={reportingWindow.from}
        to={reportingWindow.to}
      />

      {/* Guide Cards Grid */}
      <section style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {TUTORIALS.map((tutorial) => (
            <article
              key={tutorial.id}
              className="admin-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-5)',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    marginBottom: '8px',
                  }}
                >
                  {tutorial.category}
                </span>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--admin-forest)' }}>
                  {tutorial.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--admin-muted)', margin: '0 0 16px', lineHeight: '1.4' }}>
                  {tutorial.summary}
                </p>

                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#2d3748',
                    lineHeight: '1.6',
                    background: 'var(--admin-bg)',
                    padding: 'var(--space-3)',
                    borderRadius: '6px',
                    whiteSpace: 'pre-line',
                    marginBottom: '16px',
                  }}
                >
                  {tutorial.content.trim()}
                </div>
              </div>

              <div>
                <Link
                  href={preserveReportingPeriod(tutorial.relatedHref, raw)}
                  style={{
                    display: 'inline-block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--admin-forest)',
                    textDecoration: 'none',
                  }}
                >
                  {tutorial.relatedText}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
