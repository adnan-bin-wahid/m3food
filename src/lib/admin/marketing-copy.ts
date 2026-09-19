/**
 * Marketing Plain-Language Terminology & Contextual Help Dictionary
 * Translates engineering & analytics jargon into plain business concepts
 * for non-technical store owners while preserving technical terms as secondary labels.
 */

export interface EventTranslation {
  businessLabel: string;
  shortLabel: string;
  description: string;
  technicalEvent: string;
  stageNumber: number;
}

export const EVENT_TRANSLATIONS: Record<string, EventTranslation> = {
  PAGE_VIEW: {
    businessLabel: "Opened your store",
    shortLabel: "Store visit",
    description: "A visitor arrived at your store and loaded the page.",
    technicalEvent: "PAGE_VIEW / PageView",
    stageNumber: 1,
  },
  VIEW_CONTENT: {
    businessLabel: "Viewed the product",
    shortLabel: "Product view",
    description: "Visitor scrolled to or inspected the product details, images, or pricing.",
    technicalEvent: "VIEW_CONTENT / ViewContent",
    stageNumber: 2,
  },
  ADD_TO_CART: {
    businessLabel: "Showed buying intent",
    shortLabel: "Buying intent",
    description: "Visitor selected a quantity, clicked an order CTA, or opened the purchase form.",
    technicalEvent: "ADD_TO_CART / AddToCart",
    stageNumber: 3,
  },
  BEGIN_CHECKOUT: {
    businessLabel: "Started ordering",
    shortLabel: "Started checkout",
    description: "Visitor entered the checkout form and began typing their name, phone, or address.",
    technicalEvent: "BEGIN_CHECKOUT / InitiateCheckout",
    stageNumber: 4,
  },
  PURCHASE: {
    businessLabel: "Completed order",
    shortLabel: "Order placed",
    description: "Order was confirmed and saved with a unique order ID.",
    technicalEvent: "PURCHASE / Purchase",
    stageNumber: 5,
  },
};

export const METRIC_TOOLTIPS: Record<string, { term: string; plain: string; technical?: string }> = {
  revenue: {
    term: "Revenue",
    plain: "Total money earned from confirmed, non-cancelled orders.",
  },
  orders: {
    term: "Orders",
    plain: "Total number of orders successfully placed by customers.",
  },
  adSpend: {
    term: "Ad Spend",
    plain: "How much money you have spent on paid advertising (Meta / Google) in this time period.",
  },
  roas: {
    term: "Return on Ads (ROAS)",
    plain: "৳1 in attributed revenue for every ৳1 of ad spend, before product, delivery, returns and other business costs. ROAS measures ad revenue efficiency, not final profit.",
    technical: "ROAS = Attributed Revenue ÷ Ad Spend",
  },
  ctr: {
    term: "Click-Through Rate (CTR)",
    plain: "Out of everyone who saw your ad or button, what percentage actually clicked on it.",
    technical: "CTR = (Clicks ÷ Impressions) × 100",
  },
  cpc: {
    term: "Cost Per Click (CPC)",
    plain: "The average amount of money you pay each time someone clicks on your ad.",
    technical: "CPC = Total Spend ÷ Total Clicks",
  },
  conversionRate: {
    term: "Conversion Rate",
    plain: "Out of all people who visited your store, what percentage ended up completing an order.",
    technical: "Conversion Rate = (Purchasers ÷ Total Visitors) × 100",
  },
  firstTouch: {
    term: "First Touch",
    plain: "The source that first brought this customer to your store (e.g. Meta ad on Monday).",
  },
  lastTouch: {
    term: "Last Touch",
    plain: "The channel the customer used immediately before ordering (e.g. Direct link on Wednesday).",
  },
  utm: {
    term: "Tracking Link (UTM)",
    plain: "Special tags added to your website link so you know which specific ad, post, or WhatsApp message a visitor came from.",
    technical: "Urchin Tracking Module (utm_source, utm_medium, utm_campaign, utm_content, utm_term)",
  },
  matchQuality: {
    term: "Event Match Quality",
    plain: "A score from 1 to 10 reported by Meta measuring how well customer information provided matches Facebook/Instagram accounts.",
  },
  capi: {
    term: "Server Backup Tracking (CAPI)",
    plain: "A direct server connection that helps recover sales signals that browsers may miss due to ad-blockers or privacy restrictions.",
    technical: "Meta Conversions API",
  },
};

export interface PageHelpContent {
  title: string;
  summary: string;
  whatToLookAt: string[];
  whatNumbersMean: Array<{ label: string; meaning: string }>;
  goodResult: string;
  whatToDoIfLow: string;
}

export const PAGE_HELP_CONTENTS: Record<string, PageHelpContent> = {
  overview: {
    title: "Marketing Overview",
    summary: "This page gives you a bird's-eye view of how your marketing is performing: how much you spent, how much you earned, and where visitors are dropping off.",
    whatToLookAt: [
      "Revenue vs Ad Spend: Are you generating more attributed sales revenue than you spend on ads?",
      "Return on Ads (ROAS): 1.0× means ৳1 in revenue for every ৳1 of ad spend, before product, delivery, returns, and overhead costs.",
      "The Sales Journey drop-off: Are people leaving before seeing the product, or after starting checkout?",
    ],
    whatNumbersMean: [
      { label: "Revenue", meaning: "Money earned from orders in the selected time period." },
      { label: "Ad Spend", meaning: "Amount spent on Meta / Google ads." },
      { label: "ROAS", meaning: "Revenue earned per ৳1 spent on ads (before product & operating costs)." },
      { label: "Conversion Rate", meaning: "Percentage of visitors who complete an order." },
    ],
    goodResult: "Ad spend generates steady attributed orders with a ROAS high enough to comfortably cover product margin, delivery, and overhead.",
    whatToDoIfLow: "If ROAS is low, check which ads have the highest cost per order under 'Ad Performance' and pause inefficient ones. ROAS measures ad revenue efficiency, not final profit.",
  },
  visitors: {
    title: "Customers & Traffic",
    summary: "See every individual person who visited your store, where they came from, and what they did during their visit.",
    whatToLookAt: [
      "Where your best visitors come from (Meta Ads vs Direct vs Social)",
      "How many visitors return more than once",
      "Which visitors showed interest but didn't finish ordering",
    ],
    whatNumbersMean: [
      { label: "Total Visitors", meaning: "Unique people who visited your store." },
      { label: "Buying Stage", meaning: "The furthest point the visitor reached (Visited → Viewed → Buying Intent → Checkout → Purchased)." },
      { label: "Source", meaning: "The ad, Facebook post, or direct link that brought them." },
    ],
    goodResult: "More than 60% of visitors reach the 'Viewed Product' stage, and repeat visitors show high purchase rates.",
    whatToDoIfLow: "If visitors leave immediately (within 5 seconds), your ad might be promising something different from what the landing page shows. Check 'Recordings & Heatmaps'.",
  },
  interactions: {
    title: "Customer Behavior",
    summary: "Understand how visitors interact with your page: how far down they scroll, and which order buttons they click.",
    whatToLookAt: [
      "Scroll Depth: How many people scroll past 50% of your page to see your offers and pricing?",
      "CTA Click Rate: Which buttons get clicked most often?",
      "Drop-off before the order form: Are people reaching the bottom of the page?",
    ],
    whatNumbersMean: [
      { label: "Scroll 50%", meaning: "Percentage of visitors who saw at least half of your page." },
      { label: "CTA Views", meaning: "How many times visitors actually saw a specific button." },
      { label: "CTA Clicks", meaning: "How many times a button was clicked." },
      { label: "Click Rate", meaning: "Percentage of viewers who clicked the button." },
    ],
    goodResult: "Compare this metric with your own previous periods to identify whether new layouts or offers increase button engagement.",
    whatToDoIfLow: "If scroll depth is low, move your best benefits, photos, and a clear 'Order Now' button higher up on the page.",
  },
  clarity: {
    title: "Recordings & Heatmaps",
    summary: "Watch real screen recordings of anonymous customer visits to see where they tapped and what happened before they left.",
    whatToLookAt: [
      "Visitors who reached the order section but didn't buy — what stopped them?",
      "Rage clicks (tapping repeatedly on something that isn't clickable)",
      "Dead clicks and quick backs (leaving immediately)",
    ],
    whatNumbersMean: [
      { label: "Recordings", meaning: "Replays of visitors interacting with your store." },
      { label: "Heatmaps", meaning: "Visual maps showing the most tapped and scrolled areas of your page." },
    ],
    goodResult: "Visitors scroll smoothly to the order form, select their options without hesitation, and submit the order.",
    whatToDoIfLow: "Look for parts of the form where visitors pause or clear fields — test whether simplifying form fields reduces checkout drop-off.",
  },
  pixel: {
    title: "Tracking Health",
    summary: "Make sure your website and server tracking are active and sending accurate sales data to Meta to help recover sales signals that browsers may miss.",
    whatToLookAt: [
      "Website Tracking status: Check for recent activity",
      "Server Backup Tracking (CAPI): Verify server connection",
      "Event Match Quality: Check match quality score reported in Meta Events Manager",
    ],
    whatNumbersMean: [
      { label: "Website Tracking", meaning: "Tracks clicks and visits through the customer's browser." },
      { label: "Server Backup (CAPI)", meaning: "Sends sales data directly from our server to Meta to help recover sales signals that browsers may miss." },
      { label: "Deduplication", meaning: "Shared event IDs allow Meta to deduplicate matching browser and server events." },
    ],
    goodResult: "Health indicators active and configured, and recent events or purchases verified without errors.",
    whatToDoIfLow: "If server tracking is unconfigured, verify your Meta Access Token and Dataset ID in Settings.",
  },
  funnel: {
    title: "Sales Journey",
    summary: "Visualizes the 5 steps every customer takes: from first arriving at your store to completing an order.",
    whatToLookAt: [
      "Where is the biggest drop-off between steps?",
      "What percentage of people who start ordering actually finish?",
    ],
    whatNumbersMean: [
      { label: "Step 1: Visitors", meaning: "Total people who landed on your page." },
      { label: "Step 2: Viewed product", meaning: "People who looked at product details." },
      { label: "Step 3: Showed buying intent", meaning: "People who clicked an order button." },
      { label: "Step 4: Started ordering", meaning: "People who began filling the order form." },
      { label: "Step 5: Completed order", meaning: "People who placed an order." },
    ],
    goodResult: "Performance varies by product, traffic quality, and campaign. Track your stage-by-stage continuation rates over time to measure improvement.",
    whatToDoIfLow: "If people drop between Step 4 and Step 5, simplify your checkout form and highlight cash-on-delivery or free delivery.",
  },
  ads: {
    title: "Ad Performance",
    summary: "Track the efficiency of your paid advertising campaigns on Meta and Google.",
    whatToLookAt: [
      "Which ad campaigns generate the highest ROAS?",
      "Which campaigns are spending money without generating orders?",
      "Cost per order compared to your product profit margin (COGS, delivery, returns).",
    ],
    whatNumbersMean: [
      { label: "Ad Spend", meaning: "Total ad spend reported by Meta / Google." },
      { label: "Attributed Revenue", meaning: "Revenue from customers who came from these ads." },
      { label: "Cost Per Order", meaning: "Ad spend divided by orders from ads." },
      { label: "ROAS", meaning: "Revenue earned per taka spent on ads. Measures ad efficiency, not final profit." },
    ],
    goodResult: "Cost per order is comfortably below your product margin after delivery and returns. ROAS measures ad revenue efficiency, not final profit.",
    whatToDoIfLow: "Pause campaigns with high spend and zero orders. Shift budget to the specific campaign with the highest ROAS.",
  },
  campaigns: {
    title: "Campaign Tracking",
    summary: "Create and manage clean tracking links for your ads, Facebook posts, influencers, or WhatsApp broadcasts.",
    whatToLookAt: [
      "Are all your active ads using registered tracking links?",
      "Check 'Unrecognized tracking links' for traffic coming from links that were not registered.",
    ],
    whatNumbersMean: [
      { label: "Campaign Name", meaning: "A human-friendly name for your promotional effort (e.g. Eid Sale 2026)." },
      { label: "Tracking Link", meaning: "The unique link with UTM parameters you give to Facebook or influencers." },
    ],
    goodResult: "Zero unrecognized tracking links, and every campaign accurately reports its sales.",
    whatToDoIfLow: "Always create your ad link using the 'Create Tracking Link' button before launching any ad on Meta.",
  },
  sources: {
    title: "Attribution & Sources",
    summary: "Discover which channels (Meta Ads, Direct, Facebook organic, Google, WhatsApp) generate the most orders and revenue.",
    whatToLookAt: [
      "Compare Meta Ads orders vs Direct orders.",
      "Check First-touch (how they found you) vs Last-touch (what made them buy).",
    ],
    whatNumbersMean: [
      { label: "First Touch", meaning: "The channel that originally introduced the customer to your store." },
      { label: "Last Touch", meaning: "The channel the customer clicked right before placing their order." },
    ],
    goodResult: "Balanced acquisition across paid campaigns and direct/organic returning customers.",
    whatToDoIfLow: "If Meta brings all first touches but no repeat orders, use WhatsApp or SMS to bring customers back directly.",
  },
  retargeting: {
    title: "Recover Customers",
    summary: "Find interested visitors who showed high buying intent but left before purchasing, and learn how to re-engage them.",
    whatToLookAt: [
      "How many people started ordering but didn't finish?",
      "What is the total potential revenue waiting to be recovered?",
    ],
    whatNumbersMean: [
      { label: "Recoverable People", meaning: "Visitors who took an interest action in the last 7 to 30 days but never purchased." },
      { label: "Potential Value", meaning: "Estimated order revenue if these customers are re-engaged." },
    ],
    goodResult: "Re-engaging visitors who abandoned checkout provides an opportunity to recover sales without acquiring entirely new visitors.",
    whatToDoIfLow: "Use the 'How to use this audience in Meta Ads' guide to run a targeted retargeting ad offering a discount or free shipping.",
  },
};
