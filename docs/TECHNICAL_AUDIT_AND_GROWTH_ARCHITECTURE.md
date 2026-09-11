# Niyamah Attires — Complete Technical Audit & Architecture Documentation
**Date of Audit:** September 12, 2026  
**Project:** Niyamah Attires (`niyamah-attires`)  
**Target Goal:** Enterprise Growth System for Meta Ads, Google Ads, GA4, GTM, Server-Side CAPI, Retargeting, Conversion Tracking, and Attribution.

---

## Executive Summary & Readiness Scorecard

| Marketing / Analytics Vector | Readiness Score | Operational State | Primary Blocker / Next Action |
| :--- | :---: | :--- | :--- |
| **Meta Pixel (Client-Side)** | **8.5 / 10** | Active (`PageView`, `ViewContent`, `Purchase`) | `AddToCart` & `InitiateCheckout` are uncalled in `app/page.js`. |
| **Meta Conversions API (CAPI)** | **9.0 / 10** | Production-Grade (`Purchase` & `/api/v1/events`) | Client does not dispatch `AddToCart` or `InitiateCheckout` to `/api/v1/events`. |
| **Google Analytics 4 (GA4)** | **7.5 / 10** | Active (`page_view`, `view_item`, `purchase`) | Consent defaults `ad_storage` & `ad_personalization` to `'denied'`. |
| **Google Tag Manager (GTM)** | **8.0 / 10** | Implemented (`dataLayer.push` with `effy_*` events) | Requires container ID in `stores.gtm_container_id` & GTM tag setup. |
| **Google Ads Conversion Tracking** | **5.0 / 10** | Backend Sync Ready; Conversion Tag Missing | Needs Google Ads conversion send tag (`AW-CONVERSION_ID`). |
| **Campaign & Attribution Engine** | **9.5 / 10** | Enterprise-Grade (First/Last Touch, UTMs, click IDs) | 100% functional with SQL profitability & ROAS computation. |
| **Retargeting Audiences** | **8.5 / 10** | Built-in First-Party Admin Segmentation | Missing automated direct audience push to Meta Graph API. |
| **Catalog Ads / Product Feeds** | **4.0 / 10** | REST JSON API Exists; XML/CSV Feeds Absent | Needs `/api/feeds/meta` and `/api/feeds/google` XML/CSV endpoints. |
| **SEO & Open Graph for Ads** | **5.5 / 10** | Basic Title/Desc present; Social & Schema missing | Missing OG tags, JSON-LD Schema.org `Product`, `sitemap.xml`, `robots.txt`. |

---

# PART 1: COMPLETE PROJECT ARCHITECTURE

### 1.1 Technology Stack & Runtime Matrix
- **Framework:** Next.js 16.0.0 (App Router, Server Components & Client Components).
- **Core Libraries:** React 19.0.0, React DOM 19.0.0.
- **Language:** TypeScript 5.9.3 (strict mode configured, `tsconfig.json`).
- **Package Manager:** npm (v10+, Lockfile v3).
- **Styling Architecture:** Tailwind CSS v4.2.4 with `@tailwindcss/postcss`, Vanilla CSS modules, scoped component styles (`niyamah.css`, `reviews.css`, `video-reviews.css`, `hero-polish.css`, `admin.css`).
- **Motion & Smooth Scrolling:** GSAP 3.15.0, Lenis smooth scroll 1.3.26, Framer Motion 12.38.0.
- **Database Engine:** PostgreSQL (Supabase managed), connecting via `postgres` driver (v3.4.7) with transaction pooler support (port 6543) and migration session pooler (port 5432).
- **ORM & Data Layer:** Drizzle ORM (v0.45.2) with Drizzle Kit (v0.31.10).
- **Validation Engine:** Zod 4.4.1 for request validation, environment parsing, and contract enforcement.
- **Testing & Verification:** Node.js native test runner (`node --import tsx --test`), Playwright test suite (`@playwright/test` v1.63.0), comprehensive domain verification scripts (`npm run check`).

### 1.2 Deployment & Environment Architecture
- **Hosting Platform:** Vercel Serverless Platform (`vercel.json` with headers and crons configured).
- **Runtime Environment:** Node.js runtime (`export const runtime = "nodejs"` on dynamic API endpoints).
- **Environment Schema (`src/lib/config/server-env.ts`):**
  - `DATABASE_URL`: Transaction pooler PostgreSQL connection string (runtime).
  - `MIGRATION_DATABASE_URL`: Direct session PostgreSQL connection string (migrations/seeding).
  - `RATE_LIMIT_SALT`: Minimum 32-character secret for HMAC rate limiting.
  - `ADMIN_SESSION_SECRET`: Minimum 32-character secret for hashing admin session tokens.
  - `MARKETING_PREFERENCE_SECRET`: Secret for HMAC signed unsubscribe/preference links (`/preferences/:token`).
  - `CRON_SECRET`: Bearer authorization secret for Vercel Cron jobs (`/api/internal/paid-ads/sync`).
  - `META_CAPI_ACCESS_TOKEN` & `META_GRAPH_API_VERSION`: Graph API credentials for server-side Conversions API.
  - `META_CAPI_TEST_EVENT_CODE`: Test event verification code in Meta Events Manager.
  - `META_ADS_ACCESS_TOKEN` & `META_ADS_API_VERSION`: Graph API token for fetching Ads Insights (spend, impressions, clicks).
  - `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_API_VERSION`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`: Google Ads API credentials for daily reporting sync.
  - `STEADFAST_BASE_URL`, `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY`: Steadfast courier logistics integration.
  - `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX`: Payment gateway integration.
  - `PHONE_OTP_SECRET`, `PHONE_OTP_DELIVERY_MODE`, `PHONE_OTP_WEBHOOK_URL`, `PHONE_OTP_WEBHOOK_BEARER_TOKEN`: SMS OTP anti-fake order verification.

### 1.3 Detailed Directory & Layer Layout
```
├── app/                                # Next.js App Router root
│   ├── admin/                          # Authenticated Merchant Admin Portal
│   │   ├── catalog/                    # Product & Variant management ([productId])
│   │   ├── customers/                  # CRM, customer tags, notes, activity history
│   │   ├── dashboard/                  # Live executive KPI dashboard
│   │   ├── financials/                 # Unit economics, CAC, settlement reconciliation
│   │   ├── login/                      # Password-hash admin authentication
│   │   ├── marketing/                  # Growth & Ads Command Center
│   │   │   ├── ads/                    # Meta & Google Ads account/campaign sync
│   │   │   ├── campaigns/              # UTM registry & campaign attribution
│   │   │   ├── funnel/                 # Commerce conversion funnel analytics
│   │   │   ├── interactions/           # Section views, CTA clicks, scroll depth
│   │   │   ├── retargeting/            # Segmented retargeting audience generator
│   │   │   ├── sources/                # Acquisition channel performance
│   │   │   └── visitors/               # Visitor intelligence & session explorer
│   │   ├── orders/                     # Order fulfillment, courier sync, status history
│   │   ├── payments/                   # Payment reconciliation & settlements
│   │   └── settings/                   # Store settings, tracking IDs, couriers
│   ├── api/                            # Backend API Routes
│   │   ├── admin/                      # Admin auth & settings endpoints
│   │   ├── internal/                   # Protected cron & sync routes (/paid-ads/sync)
│   │   └── v1/                         # Public Storefront API
│   │       ├── checkout-intents/       # Abandoned cart & recovery capture
│   │       ├── events/                 # First-party commerce events + Meta CAPI
│   │       ├── interactions/           # Behavioral interaction telemetry
│   │       ├── orders/                 # Idempotent order checkout pipeline
│   │       ├── phone-verifications/    # Anti-fake order OTP start & verify
│   │       └── stores/[slug]/catalog/  # Public catalog & tracking ID distribution
│   ├── preferences/                    # Customer self-service consent/unsubscribe
│   ├── privacy/                        # GDPR/BTRC compliant privacy policy
│   ├── globals.css                     # Global design tokens
│   ├── layout.js                       # Root HTML shell & metadata
│   └── page.js                         # Haute couture landing page & tracking orchestration
├── components/                         # React UI Components
│   ├── admin/                          # Admin UI Shell, Navigation, Charts, Tables
│   └── niyamah/                        # Luxury Storefront Components
│       ├── attar-showcase/             # Artisanal perfume showcase & scent notes
│       ├── faq-section/                # Collapsible customer questions
│       ├── flash-sale-section/         # Curated drop flash sale with countdown
│       ├── hero-slider/                # 3-slide GSAP haute couture slider
│       ├── hijab-showcase/             # Bexi cotton salat hijab variation matrix
│       ├── luxury-header.tsx           # Translucent auto-hiding header
│       ├── luxury-footer.tsx           # Contact, helpline, policy footer
│       ├── luxury-order-section.tsx    # Multi-step direct checkout form with OTP
│       ├── reviews/                    # Editorial customer reviews carousel
│       ├── social-proof/               # Trust badges & customer testimonials
│       ├── trust-pillars/              # Quality & authenticity guarantees
│       ├── tulip-showcase/             # Tulip gift package showcase
│       ├── video-review-section.tsx    # Vertical full-edge video stories with scrubber
│       └── why-niyamah/                # Pinned GSAP promise cards & manifesto
├── config/stores/                      # Store tenant configurations (JSON)
├── drizzle/                            # Drizzle SQL migration files & snapshots
├── public/                             # Optimized images, video review clips, fonts
├── scripts/                            # Operational, bootstrap, and verification scripts
└── src/lib/                            # Enterprise Core Business Logic Layer
    ├── admin/                          # Admin domain services & repositories
    ├── analytics/                      # Behavioral analytics contracts & services
    ├── auth/                           # Admin session cookies & crypto verification
    ├── client/                         # Browser tracking adapters (pixel, google, clarity)
    ├── commerce/                       # Order, catalog, checkout intent domain services
    ├── config/                         # Server environment schemas & loaders
    ├── db/                             # Drizzle schema (35 tables), DB client, repositories
    ├── fulfillment/                    # Steadfast Courier client & shipment service
    ├── http/                           # Request handlers, rate limiters, responses
    ├── marketing/                      # Meta CAPI, Meta Ads client, Google Ads client
    ├── payments/                       # SSLCommerz client & payment intent engine
    ├── privacy/                        # Consent management & signed preference tokens
    └── security/                       # Phone OTP challenge, HMAC token verification
```

---

# PART 2: DATABASE & BACKEND SCHEMA ANALYSIS

The database layer utilizes **Supabase PostgreSQL** managed via **Drizzle ORM** (`src/lib/db/schema.ts`). All tables enforce **Row Level Security (RLS)**.

### Complete 35-Table Schema Breakdown

#### Product & Catalog Management
1. **`stores`**: Multi-tenant store configuration.
   - *Fields:* `id`, `name`, `slug`, `primaryDomain`, `metaPixelId`, `ga4MeasurementId`, `gtmContainerId`, `clarityProjectId`, `settingsRevision`, `currency`, `timezone`, `status`, `createdAt`, `updatedAt`.
2. **`products`**: Core store products.
   - *Fields:* `id`, `storeId` (FK `stores.id`), `name`, `slug`, `description`, `status` (`DRAFT`/`ACTIVE`/`ARCHIVED`), `revision`, `createdAt`, `updatedAt`.
3. **`product_variants`**: Product SKUs and variant pricing.
   - *Fields:* `id`, `storeId`, `productId` (FK `products.id`), `sku`, `label`, `priceMinor` (cents/paisa), `compareAtPriceMinor`, `unitCostMinor` (COGS for profit tracking), `isDefault`, `isActive`, `revision`, `createdAt`, `updatedAt`.
4. **`inventory`**: Real-time inventory and reservations.
   - *Fields:* `id`, `storeId`, `variantId` (FK `product_variants.id`), `trackStock`, `available`, `reserved`, `revision`, `updatedAt`.
5. **`catalog_change_history`**: Audit trail for catalog updates.
   - *Fields:* `id`, `storeId`, `productId`, `variantId`, `action`, `changedByAdminUserId`, `changedByAdminEmail`, `beforeState` (jsonb), `afterState` (jsonb), `createdAt`.

#### Customer Relationship Management (CRM)
6. **`customers`**: Consolidated customer master records.
   - *Fields:* `id`, `storeId`, `name`, `phone`, `email`, `createdAt`, `updatedAt`.
   - *Indexes:* Unique on `(storeId, phone)`.
7. **`customer_notes`**: Internal operational notes.
   - *Fields:* `id`, `storeId`, `customerId` (FK `customers.id`), `note`, `createdByAdminUserId`, `createdByAdminEmail`, `createdAt`.
8. **`customer_tags`**: CRM segmentation tags (e.g., `VIP`, `Repeat`, `FraudRisk`).
   - *Fields:* `id`, `storeId`, `customerId` (FK `customers.id`), `tag`, `addedByAdminUserId`, `addedByAdminEmail`, `createdAt`.
9. **`customer_activity_history`**: Customer timeline events.
   - *Fields:* `id`, `storeId`, `customerId`, `action`, `changedByAdminUserId`, `changedByAdminEmail`, `metadata` (jsonb), `createdAt`.
10. **`customer_marketing_preferences`**: Granular consent settings.
    - *Fields:* `id`, `storeId`, `customerId`, `emailMarketingAllowed`, `smsMarketingAllowed`, `whatsappMarketingAllowed`, `privacyPolicyVersion`, `source`, `createdAt`, `updatedAt`.

#### Visitor Intelligence & Session Tracking
11. **`visitors`**: Unique cross-session visitors.
    - *Fields:* `id`, `storeId`, `visitorKey`, `firstSeenAt`, `lastSeenAt`.
12. **`visitor_sessions`**: Individual browsing sessions.
    - *Fields:* `id`, `storeId`, `visitorId` (FK `visitors.id`), `sessionKey`, `campaignId` (FK `marketing_campaigns.id`), `landingPage`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `fbclid`, `gclid`, `userAgent`, `ipHash`, `startedAt`, `lastSeenAt`.
13. **`phone_verification_challenges`**: Anti-fraud OTP challenges.
    - *Fields:* `id`, `storeId`, `phone`, `codeHash`, `attemptCount`, `maxAttempts`, `expiresAt`, `resendAfter`, `verifiedAt`, `consumedAt`, `invalidatedAt`, `createdAt`, `updatedAt`.

#### Order Management & Fulfillment
14. **`orders`**: Master order table.
    - *Fields:* `id`, `publicId` (`ORD-YYYYMMDD-XXXX`), `storeId`, `customerId`, `visitorId`, `sessionId`, `status` (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`), `paymentMethod` (`COD`, `MANUAL`, `ONLINE`), `paymentStatus` (`UNPAID`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`), `currency`, `subtotalMinor`, `discountMinor`, `shippingMinor`, `totalMinor`, `fulfillmentCostMinor`, `fulfillmentCostRevision`, `customerName`, `customerPhone`, `phoneVerificationChallengeId`, `phoneVerifiedAt`, `riskLevel` (`LOW`, `MEDIUM`, `HIGH`), `riskReasons` (jsonb), `riskSnapshot` (jsonb), `manualReviewRequired`, `customerEmail`, `addressLine1`, `addressLine2`, `area`, `district`, `note`, `idempotencyKey`, `requestHash`, `createdAt`, `updatedAt`.
15. **`order_items`**: Line items per order.
    - *Fields:* `id`, `orderId` (FK `orders.id`), `productId`, `variantId`, `productName`, `variantLabel`, `sku`, `quantity`, `unitPriceMinor`, `totalMinor`, `unitCostMinor`, `totalCostMinor`.
16. **`order_consents`**: Snapshot of consent at checkout.
    - *Fields:* `id`, `storeId`, `orderId` (FK `orders.id`), `privacyPolicyVersion`, `analyticsAllowed`, `emailMarketingAllowed`, `smsMarketingAllowed`, `whatsappMarketingAllowed`, `capturedAt`.
17. **`order_status_history`**: Audit trail of order status movements.
    - *Fields:* `id`, `orderId`, `fromStatus`, `toStatus`, `note`, `changedByAdminUserId`, `changedByAdminEmail`, `createdAt`.
18. **`order_cost_history`**: Historical adjustments to fulfillment costs.
    - *Fields:* `id`, `storeId`, `orderId`, `action`, `beforeFulfillmentCostMinor`, `afterFulfillmentCostMinor`, `changedByAdminUserId`, `changedByAdminEmail`, `createdAt`.
19. **`order_attributions`**: First and last touch campaign attribution.
    - *Fields:* `id`, `storeId`, `orderId` (FK `orders.id`), `visitorId`, `sessionId`, `firstTouchCampaignId`, `lastTouchCampaignId`, `source`, `medium`, `campaign`, `content`, `term`, `referrer`, `landingPage`, `fbclid`, `gclid`, `firstTouch` (jsonb), `lastTouch` (jsonb), `createdAt`.
20. **`fulfillment_shipments`**: Logistics dispatch records (Steadfast).
    - *Fields:* `id`, `storeId`, `orderId`, `provider` (`STEADFAST`), `status`, `requestFingerprint`, `consignmentId`, `trackingCode`, `providerStatus`, `lastError`, `providerResponse` (jsonb), `submittedAt`, `createdAt`, `updatedAt`.

#### Payments & Settlements
21. **`payments`**: Payment transactions.
    - *Fields:* `id`, `storeId`, `orderId`, `method`, `status`, `amountMinor`, `currency`, `providerReference`, `providerResponse`, `revision`, `createdAt`, `updatedAt`.
22. **`payment_intents`**: Online payment intents (SSLCommerz).
    - *Fields:* `id`, `storeId`, `orderId`, `paymentId`, `provider` (`SSL_COMMERZ`), `status`, `idempotencyKey`, `amountMinor`, `currency`, `providerSessionId`, `providerReference`, `gatewayUrl`, `providerPayload`, `createdAt`, `updatedAt`.
23. **`payment_provider_events`**: Webhook audit logs from gateways.
24. **`payment_status_history`**: Ledger of payment state changes.

#### Behavioral Events & Marketing Attribution
25. **`commerce_events`**: High-value funnel milestones.
    - *Fields:* `id`, `storeId`, `visitorId`, `sessionId`, `orderId`, `productId`, `variantId`, `eventName` (`PAGE_VIEW`, `VIEW_CONTENT`, `ADD_TO_CART`, `BEGIN_CHECKOUT`, `PURCHASE`), `eventId`, `valueMinor`, `currency`, `pageUrl`, `payload` (jsonb), `occurredAt`, `receivedAt`.
26. **`visitor_interaction_events`**: Micro-interaction telemetry.
    - *Fields:* `id`, `storeId`, `visitorId`, `sessionId`, `eventName` (`SESSION_START`, `SECTION_VIEW`, `CTA_VIEW`, `CTA_CLICK`, `SCROLL_DEPTH`, `WHATSAPP_CLICK`, `MESSENGER_CLICK`), `eventId`, `pageUrl`, `elementKey`, `elementLabel`, `sectionKey`, `targetUrl`, `scrollDepth`, `payload`, `occurredAt`, `receivedAt`.
27. **`checkout_intents`**: Cart & checkout abandonment recovery store.
    - *Fields:* `id`, `storeId`, `intentKey`, `visitorId`, `sessionId`, `productId`, `variantId`, `phone`, `email`, `quantity`, `privacyPolicyVersion`, `emailMarketingAllowed`, `smsMarketingAllowed`, `whatsappMarketingAllowed`, `lastActivityAt`, `createdAt`, `updatedAt`.
28. **`marketing_campaigns`**: Registered marketing campaigns.
    - *Fields:* `id`, `storeId`, `name`, `campaignKey`, `source`, `medium`, `content`, `term`, `landingUrl`, `notes`, `status`, `revision`, `createdByAdminUserId`, `createdByAdminEmail`, `createdAt`, `updatedAt`.
29. **`paid_ad_accounts`**: Connected ad accounts (Meta & Google).
    - *Fields:* `id`, `storeId`, `provider` (`META`, `GOOGLE`), `externalAccountId`, `name`, `currency`, `timezone`, `isActive`, `syncEnabled`, `syncLookbackDays`, `revision`, `createdAt`, `updatedAt`.
30. **`paid_ad_campaign_mappings`**: Connects ad accounts to internal campaigns.
    - *Fields:* `id`, `storeId`, `accountId`, `marketingCampaignId`, `externalCampaignId`, `externalCampaignName`, `isActive`, `revision`, `createdAt`, `updatedAt`.
31. **`paid_ad_daily_metrics`**: Daily ad delivery data from API.
    - *Fields:* `id`, `storeId`, `mappingId`, `metricDate`, `spendMinor`, `impressions`, `clicks`, `ingestionSource` (`MANUAL`, `API`), `revision`, `createdAt`, `updatedAt`.
32. **`paid_ad_sync_runs`**: Automated sync audit logs.
    - *Fields:* `id`, `storeId`, `accountId`, `provider`, `scheduleKey`, `startDate`, `endDate`, `status`, `rowsFetched`, `rowsWritten`, `skippedUnmapped`, `errorCode`, `errorMessage`, `startedAt`, `completedAt`.

#### Security & Administration
33. **`admin_users`**: Admin staff credentials with bcrypt password hash.
34. **`admin_sessions`**: Stateful HMAC-hashed session tokens with automatic expiration.
35. **`request_rate_limits`**: Distributed sliding-window database rate limiter.

---

# PART 3: COMPLETE ORDER FLOW ANALYSIS

```
[1. Visitor Lands]
       │ (URL contains ?utm_source=...&fbclid=...&gclid=...)
       ▼
[2. Client Extraction & Attribution]
       │ `getFirstPartyTrackingKeys()` reads/generates visitorKey & sessionKey
       │ `buildAttribution()` extracts UTMs and Click IDs into localStorage/sessionStorage
       ▼
[3. Product Browsing & Showcases]
       │ User inspects Hijab, Attar, or Tulip Gift Package
       │ Dispatches `niyamah:select-product` event
       ▼
[4. Direct Checkout Trigger]
       │ User scrolls to `LuxuryOrderSection` or clicks "অর্ডার করুন" (CTA)
       │ Selects color/fragrance variant and quantity
       ▼
[5. Anti-Fake Order Phone OTP Verification]
       │ User enters mobile number (`01XXXXXXXXX`)
       │ POST `/api/v1/phone-verifications/start` -> generates HMAC challenge & OTP
       │ User enters 4-digit code -> POST `/api/v1/phone-verifications/verify`
       │ Returns cryptographic `phoneVerificationToken`
       ▼
[6. Order Submission]
       │ User fills Shipping Address, District, and submits form
       │ POST `/api/v1/orders` with `Idempotency-Key` header
       ▼
[7. Server Transaction & Order Creation]
       │ Validates `phoneVerificationToken`, checks stock & idempotency hash
       │ Evaluates fraud risk via `assessOrderRisk()` (burst rate, returns, past cancels)
       │ Inserts into `orders`, `order_items`, `order_consents`, `order_attributions`
       │ Generates unique `publicId` (e.g. `ORD-20260912-7A9B1C2D`)
       ▼
[8. Dual Conversion Dispatch]
       ├── Browser: `trackMetaPixelEvent("PURCHASE")` + `trackGoogleCommerceEvent("PURCHASE")`
       └── Server: `sendMetaCapiEvent("PURCHASE")` with SHA-256 phone/email, fbc, IP, UA
       ▼
[9. Admin Receiving & Processing]
       │ Order immediately surfaces in `/admin/orders` and `/admin/dashboard`
       │ Admin reviews order risk badge (`LOW`, `MEDIUM`, `HIGH`)
       │ Status update: PENDING -> CONFIRMED -> PROCESSING
       ▼
[10. Courier Logistics Hand-off]
       │ Admin clicks "Dispatch to Steadfast" in `/admin/orders/[publicId]`
       │ Server executes `submitOrderToSteadfast()` -> receives Consignment ID & Tracking Code
       │ Updates order status to `SHIPPED`
```

---

# PART 4: META ADS TRACKING ANALYSIS

### 4.1 Pixel Implementation Details
- **File Path:** `src/lib/client/pixel.ts`
- **Helper Function:** `trackMetaPixelEvent(input, environment)`
- **Dynamic Script Loader:**
  ```javascript
  // Dynamic fbevents.js injector in ensureMetaQueue()
  if (!documentObject.getElementById("effy-meta-pixel")) {
    const script = documentObject.createElement("script");
    script.id = "effy-meta-pixel";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    documentObject.head.appendChild(script);
  }
  ```
- **Pixel ID Storage:**
  - Persisted in database column `stores.meta_pixel_id`.
  - Configurable via Merchant Admin at `/admin/settings` (`app/admin/settings/actions.ts`).
  - Loaded dynamically on the client via `GET /api/v1/stores/[storeSlug]/catalog`.
- **Consent Gating:**
  - The script strictly checks `if (consent !== "accepted") return false;`.
  - Calls `fbq("consent", "grant")` when accepted.
  - Calls `revokeMetaPixelConsent()` -> `fbq("consent", "revoke")` if consent is declined.

---

# PART 5: META PIXEL EVENT MAPPING

### Event Matrix & Current Status

| Event Name | Standard Meta Event | Exists in Client Code? | File & Location | Status & Missing Elements |
| :--- | :--- | :---: | :--- | :--- |
| **PageView** | `PageView` | **YES** | `app/page.js:345` | **Active.** Dispatched on initial load when consent is ready. |
| **ViewContent** | `ViewContent` | **YES** | `app/page.js:350` | **Active.** Dispatched when product/variant selection is loaded. Sends `content_ids`, `content_name`, `content_type: 'product'`, `value`, `currency`. |
| **AddToCart** | `AddToCart` | **NO** | `src/lib/client/pixel.ts:4` | **Missing in Storefront.** Library supports it, but `app/page.js` never triggers it. Needs trigger on variant selection or "অর্ডার করুন" click. |
| **InitiateCheckout** | `InitiateCheckout` | **NO** | `src/lib/client/pixel.ts:5` | **Missing in Storefront.** Library supports it (`BEGIN_CHECKOUT`), but `app/page.js` never triggers it when user begins filling the order form. |
| **Purchase** | `Purchase` | **YES** | `app/page.js:548` | **Active.** Dispatched upon successful checkout response. Sends `content_ids`, `value`, `currency`, `num_items`, and `eventID: payload.data.publicId`. |

---

# PART 6: META CONVERSION API (CAPI) READINESS

### 6.1 Server-Side Capability Assessment
- **File Path:** `src/lib/marketing/meta-capi.ts`
- **Core Function:** `sendMetaCapiEvent(input, environment)`
- **Endpoint:** `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events`

### 6.2 Parameter & Signal Availability Checklist

| CAPI Parameter | Implemented? | Code Location | How It Works |
| :--- | :---: | :--- | :--- |
| **Event ID (Deduplication)** | **YES** | `meta-capi.ts:90`, `orders/route.ts:31` | Exact match with browser pixel `eventId: payload.data.publicId` for 100% deduplication. |
| **Customer Email (`em`)** | **YES** | `meta-capi.ts:72` | Lowercased, trimmed, and SHA-256 hashed. |
| **Customer Phone (`ph`)** | **YES** | `meta-capi.ts:73` | Stripped of non-digit characters and SHA-256 hashed. |
| **Client IP Address** | **YES** | `meta-capi.ts:69`, `orders/route.ts:32` | Extracted via `getRequestClientKey(request)` from `x-forwarded-for`. |
| **Client User Agent** | **YES** | `meta-capi.ts:70`, `orders/route.ts:33` | Extracted from request headers. |
| **Click ID (`fbc`)** | **YES** | `meta-capi.ts:74` | Formats `fbclid` into standard `fb.1.${eventTime}.${fbclid}` format. |
| **External ID (`external_id`)** | **YES** | `meta-capi.ts:71` | SHA-256 hashed persistent first-party `visitorKey`. |
| **Test Event Code** | **YES** | `meta-capi.ts:97` | Sent via `META_CAPI_TEST_EVENT_CODE` for Events Manager testing. |

### 6.3 What Exists vs. What Needs Implementation
- **What Exists:**
  - Complete server-side `Purchase` event delivery in `app/api/v1/orders/route.ts:29-35`.
  - Generic server-side event pipeline in `app/api/v1/events/route.ts:22-28`.
- **What Needs Implementation:**
  - `app/page.js` must make a client POST to `/api/v1/events` for `ADD_TO_CART` and `BEGIN_CHECKOUT` so Meta CAPI receives real-time server-side cart and checkout signals.

---

# PART 7: GOOGLE ANALYTICS 4 ANALYSIS

### 7.1 Implementation Details
- **File Path:** `src/lib/client/google.ts`
- **Helper Function:** `trackGoogleCommerceEvent(input, environment)`
- **Measurement ID Storage:** Database `stores.ga4_measurement_id` (e.g., `G-XXXXXXXXXX`).
- **Dynamic Script Injection:**
  ```javascript
  // In ensureGa4():
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  ```

### 7.2 GA4 Ecommerce Event Mapping

| GA4 Standard Event | Mapped from Internal Event | Triggered in `app/page.js`? | Payload Parameters |
| :--- | :--- | :---: | :--- |
| `page_view` | `PAGE_VIEW` | **YES** | `page_location`, `page_referrer`, `event_id` |
| `view_item` | `VIEW_CONTENT` | **YES** | `items: [{ item_id, item_name, price, quantity }]`, `value`, `currency` |
| `add_to_cart` | `ADD_TO_CART` | **NO** | Ready in `google.ts:42`, uncalled in `app/page.js` |
| `begin_checkout` | `BEGIN_CHECKOUT` | **NO** | Ready in `google.ts:43`, uncalled in `app/page.js` |
| `purchase` | `PURCHASE` | **YES** | `transaction_id`, `value`, `currency`, `items: [...]` |

### 7.3 Critical Google Consent Mode Issue
In `src/lib/client/google.ts:146-151`:
```typescript
gtag("consent", "update", {
  analytics_storage: "granted",
  ad_storage: "denied",          // <-- BLOCKS GOOGLE ADS REMARKETING & CONVERSIONS!
  ad_user_data: "denied",        // <-- BLOCKS ENHANCED CONVERSIONS IN GOOGLE ADS!
  ad_personalization: "denied",  // <-- BLOCKS DYNAMIC REMARKETING AUDIENCES!
});
```
**Action Required:** When user accepts analytics/marketing consent, `ad_storage`, `ad_user_data`, and `ad_personalization` must be updated to `"granted"` to enable Google Ads conversion tracking and retargeting!

---

# PART 8: GOOGLE TAG MANAGER (GTM) ANALYSIS

### 8.1 GTM Integration Details
- **File Path:** `src/lib/client/google.ts:93-108`
- **Helper Function:** `ensureGtm(browser, documentObject, containerId)`
- **Container ID Storage:** Database `stores.gtm_container_id` (format: `GTM-XXXXXXX`).
- **DataLayer Event Format:**
  When `trackGoogleCommerceEvent` runs, it automatically pushes to `window.dataLayer`:
  ```javascript
  dataLayer.push({
    event: `effy_${eventName}`, // e.g. effy_page_view, effy_view_item, effy_purchase
    ecommerce: {
      event_id: "...",
      transaction_id: "ORD-20260912-XXXX",
      value: 1225.00,
      currency: "BDT",
      items: [{ item_id: "NYM-TLP-001", item_name: "...", price: 1225, quantity: 1 }]
    }
  });
  ```

---

# PART 9: CONSENT MANAGEMENT & PRIVACY SYSTEM

### 9.1 Architecture
- **Consent Utilities:** `src/lib/privacy/consent.ts`
- **Storage:** LocalStorage key `effy_analytics_consent` (`'accepted'` | `'declined'` | `'unknown'`).
- **Policy Versioning:** `CURRENT_PRIVACY_POLICY_VERSION = "2026-03-01"`.
- **Behavioral Isolation:**
  - If `analyticsConsent !== 'accepted'`, all tracking calls immediately abort.
  - Revocation triggers: `revokeMetaPixelConsent()`, `revokeGoogleConsent()`, and `revokeClarityConsent()`.
  - Customer preference link: `/preferences/[token]` allows instant opt-out of SMS, Email, or WhatsApp marketing.

---

# PART 10: MARKETING & ATTRIBUTION SYSTEM

### 10.1 First-Touch & Last-Touch Attribution Engine
- **Files:** `src/lib/client/checkout.ts`, `src/lib/marketing/campaigns.ts`, `src/lib/db/landing-order-repository.ts`
- **Captured Parameters:**
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
  - `fbclid` (Meta Click ID), `gclid` (Google Click ID)
  - `referrer`, `landing_page`
- **Data Model:**
  - `visitor_sessions` stores initial click IDs and session UTM parameters.
  - `order_attributions` links orders to `first_touch_campaign_id` and `last_touch_campaign_id`.
- **Profitability Intelligence:**
  The system merges order revenue (`orders.total_minor`), product cost of goods (`order_items.total_cost_minor`), fulfillment shipping costs (`orders.fulfillment_cost_minor`), and ad spend (`paid_ad_daily_metrics.spend_minor`) to compute exact **Gross Margin, Net Profit, ROAS, and CAC** per campaign in `/admin/marketing/campaigns` and `/admin/financials`.

---

# PART 11: RETARGETING READINESS

### 11.1 Built-in First-Party Audience Segmentation
- **File:** `src/lib/admin/retargeting-service.ts`
- **Available Segments:**
  1. **Cart Abandoners (`CART_ABANDONERS`):** Visitors with `ADD_TO_CART` and no subsequent `PURCHASE`.
  2. **Checkout Abandoners (`CHECKOUT_ABANDONERS`):** Visitors with `BEGIN_CHECKOUT` and no subsequent `PURCHASE`.
  3. **Product Viewers (`VIEWED_NO_PURCHASE`):** Visitors with `VIEW_CONTENT` and no subsequent `PURCHASE`.
- **Configurable Lookback Windows:** 7 Days, 14 Days, 30 Days (with 30-minute inactivity grace).
- **Admin Interface:** `/admin/marketing/retargeting`.

---

# PART 12: PRODUCT CATALOG ADS READINESS

### 12.1 Current State
- Public catalog exists at: `GET /api/v1/stores/[storeSlug]/catalog`.
- Returns structured JSON containing all products, active variants, prices, compare-at prices, and stock statuses.
- **GAP:** Meta Commerce Manager (Catalog Sales Ads / Advantage+ Catalog) and Google Merchant Center (Google Shopping / Performance Max) require standardized **XML (RSS 2.0 / Google Merchant Feed)** or **CSV** formats.
- **Requirement:** Implement dedicated endpoints:
  - `/api/feeds/meta` (Facebook Catalog XML)
  - `/api/feeds/google` (Google Merchant Center XML)

---

# PART 13: ADMIN PANEL MARKETING FEATURES

### Admin Capabilities Map (`app/admin/`)
1. **Overview Dashboard (`/admin/dashboard`):** Today's revenue, orders, AOV, conversion rate, top selling variants.
2. **Marketing Command Center (`/admin/marketing`):** Full funnel visualization (Sessions -> Views -> Carts -> Checkouts -> Purchases).
3. **Ads Management (`/admin/marketing/ads`):** Direct Meta Ads & Google Ads API daily spend, impressions, clicks sync.
4. **Campaign Intelligence (`/admin/marketing/campaigns`):** Attribution breakdown by UTM source/medium/campaign with order count and ROAS.
5. **Retargeting Audiences (`/admin/marketing/retargeting`):** Abandonment lists with visitor keys, dates, and Meta audience rules.
6. **Visitor Intelligence (`/admin/marketing/visitors`):** Drill-down on individual visitor timelines and interaction events.
7. **Financial Intelligence (`/admin/financials`):** Settlement reconciliation, profit after ad spend, COGS, and courier fees.
8. **Settings (`/admin/settings`):** Live editing of Meta Pixel ID, GA4 ID, GTM ID, Clarity ID, and courier API keys.

---

# PART 14: PERFORMANCE & SEO FOR ADS

### 14.1 Strengths
- Fast server-rendered landing page with static assets served via Next.js App Router.
- Responsive cutouts and compressed WebP/PNG assets in `public/niyamah/`.
- Scoped CSS architecture preventing global pollution.

### 14.2 Deficiencies for Ad Quality Score & Organic Reach
1. **Missing Open Graph & Twitter Cards:** `app/layout.js` lacks `og:image`, `og:title`, `og:description`, `og:url`, reducing click-through rates on Facebook and WhatsApp link shares.
2. **Missing Structured Data (JSON-LD):** No Schema.org `Product`, `Offer`, or `Organization` markup for Google rich snippets.
3. **Missing Crawler Assets:** No `app/sitemap.js` or `app/robots.js`.

---

# SECTION E: MISSING TRACKING REQUIREMENTS (CONSOLIDATED AUDIT)

1. **Client Event Gap in `app/page.js`:**
   - Standard Meta `AddToCart` and GA4 `add_to_cart` are never triggered.
   - Standard Meta `InitiateCheckout` and GA4 `begin_checkout` are never triggered.
2. **Google Consent Mode Ad Storage Block in `src/lib/client/google.ts`:**
   - `ad_storage`, `ad_user_data`, and `ad_personalization` are hardcoded to `"denied"`, preventing Google Ads conversion tracking and remarketing.
3. **Product Catalog XML Feeds Absent:**
   - No automated feed for Meta Catalog Sales Ads or Google Merchant Center.
4. **Open Graph & SEO Metadata Incomplete in `app/layout.js`:**
   - Missing social share card images and Schema.org rich snippets.

---

# SECTION F: EXACT IMPLEMENTATION ROADMAP

### PHASE 1: Basic Tracking & Google Consent Fix
- **Target Files:**
  - `src/lib/client/google.ts` (lines 146–151)
- **Change:**
  Update `trackGoogleCommerceEvent` to grant advertising consent when `input.consent === "accepted"`:
  ```typescript
  gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  ```
- **Reason:** Unblocks Google Ads Conversion Tracking, Enhanced Conversions, and Google Remarketing.

### PHASE 2: Complete Ecommerce Funnel Events (`AddToCart` & `InitiateCheckout`)
- **Target Files:**
  - `app/page.js`
  - `components/niyamah/luxury-order-section.tsx`
- **Change:**
  1. Trigger `trackEventOnce('add-to-cart', 'ADD_TO_CART', catalogSelection)` when:
     - The user clicks any "অর্ডার করুন" (Order Now) CTA button.
     - The user switches a product variant or changes quantity.
  2. Trigger `trackEventOnce('begin-checkout', 'BEGIN_CHECKOUT', catalogSelection)` when:
     - The user enters/focuses on any input field in `LuxuryOrderSection`.
- **Reason:** Restores 100% full funnel visibility in Meta Events Manager and GA4 Funnel Reports.

### PHASE 3: Dual CAPI Server-Side Cart & Checkout Delivery
- **Target Files:**
  - `app/page.js` (inside `trackEventOnce`)
- **Change:**
  Ensure `trackBrowserCommerceEvent` is dispatched to `/api/v1/events` whenever `ADD_TO_CART` or `BEGIN_CHECKOUT` fires.
- **Reason:** Enables server-side Meta Conversions API for mid-funnel events, drastically increasing Meta Event Quality Match Scores (EMQ) to 8.5+.

### PHASE 4: Automated Product Catalog Feed Endpoints
- **Target Files (New Routes):**
  - `app/api/feeds/meta/route.ts`
  - `app/api/feeds/google/route.ts`
- **Change:**
  Query active products and variants via `DrizzleCatalogRepository` and serialize them into standard RSS 2.0 XML with `<g:id>`, `<g:title>`, `<g:price>`, `<g:image_link>`, and `<g:availability>`.
- **Reason:** Unlocks Meta Dynamic Product Ads (DPA / Advantage+ Catalog) and Google Shopping Ads.

### PHASE 5: Social Sharing, Open Graph & SEO Polish
- **Target Files:**
  - `app/layout.js`
  - `app/sitemap.js`
  - `app/robots.js`
- **Change:**
  Add comprehensive `openGraph`, `twitter`, and JSON-LD `Product` schema in `app/layout.js`. Add dynamic `sitemap.js` and `robots.js`.
- **Reason:** Maximizes ad landing page quality score and ensures premium previews when links are shared across social channels.
