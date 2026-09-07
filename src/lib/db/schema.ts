import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const storeStatusEnum = pgEnum("store_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const productStatusEnum = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["COD", "MANUAL"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const commerceEventNameEnum = pgEnum("commerce_event_name", [
  "PAGE_VIEW",
  "VIEW_CONTENT",
  "ADD_TO_CART",
  "BEGIN_CHECKOUT",
  "PURCHASE",
]);

export const visitorInteractionEventNameEnum = pgEnum("visitor_interaction_event_name", [
  "SESSION_START",
  "SECTION_VIEW",
  "CTA_VIEW",
  "CTA_CLICK",
  "SCROLL_DEPTH",
  "WHATSAPP_CLICK",
  "MESSENGER_CLICK",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "OWNER",
  "ADMIN",
  "ORDER_MANAGER",
  "ANALYST",
]);

export const marketingCampaignStatusEnum = pgEnum("marketing_campaign_status", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    primaryDomain: varchar("primary_domain", { length: 255 }),
    metaPixelId: varchar("meta_pixel_id", { length: 25 }).notNull().default(""),
    ga4MeasurementId: varchar("ga4_measurement_id", { length: 32 }).notNull().default(""),
    gtmContainerId: varchar("gtm_container_id", { length: 32 }).notNull().default(""),
    clarityProjectId: varchar("clarity_project_id", { length: 64 }).notNull().default(""),
    settingsRevision: integer("settings_revision").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("BDT"),
    timezone: varchar("timezone", { length: 64 })
      .notNull()
      .default("Asia/Dhaka"),
    status: storeStatusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stores_slug_uniq").on(table.slug),
    uniqueIndex("stores_primary_domain_uniq").on(table.primaryDomain),
  ],
).enableRLS();

export const marketingCampaigns = pgTable(
  "marketing_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    campaignKey: varchar("campaign_key", { length: 120 }).notNull(),
    source: varchar("source", { length: 120 }).notNull(),
    medium: varchar("medium", { length: 120 }).notNull(),
    content: varchar("content", { length: 160 }),
    term: varchar("term", { length: 160 }),
    landingUrl: text("landing_url"),
    notes: text("notes"),
    status: marketingCampaignStatusEnum("status")
      .notNull()
      .default("DRAFT"),
    revision: integer("revision").notNull().default(0),
    createdByAdminUserId: uuid("created_by_admin_user_id").notNull(),
    createdByAdminEmail: varchar("created_by_admin_email", {
      length: 255,
    }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("marketing_campaigns_store_key_uniq").on(
      table.storeId,
      table.campaignKey,
    ),
    index("marketing_campaigns_store_status_idx").on(
      table.storeId,
      table.status,
    ),
    index("marketing_campaigns_store_created_idx").on(
      table.storeId,
      table.createdAt,
    ),
  ],
).enableRLS();


export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),
    status: productStatusEnum("status").notNull().default("DRAFT"),
    revision: integer("revision").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_store_slug_uniq").on(table.storeId, table.slug),
    index("products_store_status_idx").on(table.storeId, table.status),
  ],
).enableRLS();

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull(),
    label: varchar("label", { length: 160 }),
    priceMinor: integer("price_minor").notNull(),
    compareAtPriceMinor: integer("compare_at_price_minor"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    revision: integer("revision").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_variants_store_sku_uniq").on(
      table.storeId,
      table.sku,
    ),
    index("product_variants_product_idx").on(table.productId),
    check("product_variants_price_nonnegative", sql`${table.priceMinor} >= 0`),
    check(
      "product_variants_compare_price_nonnegative",
      sql`${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= 0`,
    ),
  ],
).enableRLS();

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    trackStock: boolean("track_stock").notNull().default(true),
    available: integer("available").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    revision: integer("revision").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_store_variant_uniq").on(
      table.storeId,
      table.variantId,
    ),
    check("inventory_available_nonnegative", sql`${table.available} >= 0`),
    check("inventory_reserved_nonnegative", sql`${table.reserved} >= 0`),
  ],
).enableRLS();

export const catalogChangeHistory = pgTable(
  "catalog_change_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    changedByAdminUserId: uuid("changed_by_admin_user_id").notNull(),
    changedByAdminEmail: varchar("changed_by_admin_email", { length: 255 }).notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("catalog_change_history_store_time_idx").on(
      table.storeId,
      table.createdAt,
    ),
    index("catalog_change_history_product_idx").on(table.productId),
    index("catalog_change_history_variant_idx").on(table.variantId),
  ],
).enableRLS();

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 255 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_store_phone_uniq").on(table.storeId, table.phone),
    index("customers_store_created_idx").on(table.storeId, table.createdAt),
  ],
).enableRLS();

export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdByAdminUserId: uuid("created_by_admin_user_id").notNull(),
    createdByAdminEmail: varchar("created_by_admin_email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("customer_notes_store_customer_time_idx").on(
      table.storeId,
      table.customerId,
      table.createdAt,
    ),
  ],
).enableRLS();

export const customerTags = pgTable(
  "customer_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 40 }).notNull(),
    addedByAdminUserId: uuid("added_by_admin_user_id").notNull(),
    addedByAdminEmail: varchar("added_by_admin_email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_tags_store_customer_tag_uniq").on(
      table.storeId,
      table.customerId,
      table.tag,
    ),
    index("customer_tags_store_tag_idx").on(table.storeId, table.tag),
  ],
).enableRLS();

export const customerActivityHistory = pgTable(
  "customer_activity_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    changedByAdminUserId: uuid("changed_by_admin_user_id").notNull(),
    changedByAdminEmail: varchar("changed_by_admin_email", { length: 255 }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("customer_activity_store_customer_time_idx").on(
      table.storeId,
      table.customerId,
      table.createdAt,
    ),
    index("customer_activity_store_action_time_idx").on(
      table.storeId,
      table.action,
      table.createdAt,
    ),
  ],
).enableRLS();

export const visitors = pgTable(
  "visitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    visitorKey: varchar("visitor_key", { length: 80 }).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("visitors_store_key_uniq").on(
      table.storeId,
      table.visitorKey,
    ),
  ],
).enableRLS();

export const visitorSessions = pgTable(
  "visitor_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    sessionKey: varchar("session_key", { length: 80 }).notNull(),
    landingPage: text("landing_page"),
    referrer: text("referrer"),
    utmSource: varchar("utm_source", { length: 255 }),
    utmMedium: varchar("utm_medium", { length: 255 }),
    utmCampaign: varchar("utm_campaign", { length: 255 }),
    utmContent: varchar("utm_content", { length: 255 }),
    utmTerm: varchar("utm_term", { length: 255 }),
    fbclid: text("fbclid"),
    gclid: text("gclid"),
    userAgent: text("user_agent"),
    ipHash: varchar("ip_hash", { length: 128 }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("visitor_sessions_store_key_uniq").on(
      table.storeId,
      table.sessionKey,
    ),
    index("visitor_sessions_visitor_idx").on(table.visitorId),
    index("visitor_sessions_campaign_idx").on(
      table.storeId,
      table.utmCampaign,
    ),
  ],
).enableRLS();

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: varchar("public_id", { length: 32 }).notNull(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    visitorId: uuid("visitor_id").references(() => visitors.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => visitorSessions.id, {
      onDelete: "set null",
    }),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("COD"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("UNPAID"),
    currency: varchar("currency", { length: 3 }).notNull().default("BDT"),
    subtotalMinor: integer("subtotal_minor").notNull(),
    discountMinor: integer("discount_minor").notNull().default(0),
    shippingMinor: integer("shipping_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    area: varchar("area", { length: 160 }),
    district: varchar("district", { length: 160 }).notNull(),
    note: text("note"),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_public_id_uniq").on(table.publicId),
    uniqueIndex("orders_store_idempotency_uniq").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("orders_store_status_created_idx").on(
      table.storeId,
      table.status,
      table.createdAt,
    ),
    index("orders_customer_phone_idx").on(
      table.storeId,
      table.customerPhone,
    ),
    check("orders_subtotal_nonnegative", sql`${table.subtotalMinor} >= 0`),
    check("orders_discount_nonnegative", sql`${table.discountMinor} >= 0`),
    check(
      "orders_discount_not_above_subtotal",
      sql`${table.discountMinor} <= ${table.subtotalMinor}`,
    ),
    check("orders_shipping_nonnegative", sql`${table.shippingMinor} >= 0`),
    check("orders_total_nonnegative", sql`${table.totalMinor} >= 0`),
    check(
      "orders_total_consistent",
      sql`${table.totalMinor} = ${table.subtotalMinor} - ${table.discountMinor} + ${table.shippingMinor}`,
    ),
  ],
).enableRLS();

export const orderConsents = pgTable(
  "order_consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    privacyPolicyVersion: varchar("privacy_policy_version", {
      length: 32,
    }).notNull(),
    analyticsAllowed: boolean("analytics_allowed").notNull().default(false),
    emailMarketingAllowed: boolean("email_marketing_allowed")
      .notNull()
      .default(false),
    smsMarketingAllowed: boolean("sms_marketing_allowed")
      .notNull()
      .default(false),
    whatsappMarketingAllowed: boolean("whatsapp_marketing_allowed")
      .notNull()
      .default(false),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("order_consents_order_uniq").on(table.orderId),
    index("order_consents_store_captured_idx").on(
      table.storeId,
      table.capturedAt,
    ),
  ],
).enableRLS();

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 255 }).notNull(),
    variantLabel: varchar("variant_label", { length: 160 }),
    sku: varchar("sku", { length: 100 }),
    quantity: integer("quantity").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    totalMinor: integer("total_minor").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_nonnegative", sql`${table.unitPriceMinor} >= 0`),
    check("order_items_total_nonnegative", sql`${table.totalMinor} >= 0`),
    check(
      "order_items_total_consistent",
      sql`${table.totalMinor} = ${table.unitPriceMinor} * ${table.quantity}`,
    ),
  ],
).enableRLS();

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    note: text("note"),
    changedByAdminUserId: uuid("changed_by_admin_user_id"),
    changedByAdminEmail: varchar("changed_by_admin_email", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_status_history_order_idx").on(table.orderId),
    index("order_status_history_admin_idx").on(table.changedByAdminUserId),
  ],
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("UNPAID"),
    amountMinor: integer("amount_minor").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("BDT"),
    providerReference: varchar("provider_reference", { length: 255 }),
    providerResponse: jsonb("provider_response"),
    ...timestamps,
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    index("payments_store_status_idx").on(table.storeId, table.status),
    check("payments_amount_nonnegative", sql`${table.amountMinor} >= 0`),
  ],
).enableRLS();

export const commerceEvents = pgTable(
  "commerce_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => visitorSessions.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    eventName: commerceEventNameEnum("event_name").notNull(),
    eventId: varchar("event_id", { length: 120 }).notNull(),
    valueMinor: integer("value_minor"),
    currency: varchar("currency", { length: 3 }),
    pageUrl: text("page_url"),
    payload: jsonb("payload").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("commerce_events_store_event_id_uniq").on(
      table.storeId,
      table.eventId,
    ),
    index("commerce_events_store_name_time_idx").on(
      table.storeId,
      table.eventName,
      table.occurredAt,
    ),
    index("commerce_events_session_idx").on(table.sessionId),
    check(
      "commerce_events_value_nonnegative",
      sql`${table.valueMinor} is null or ${table.valueMinor} >= 0`,
    ),
  ],
).enableRLS();

export const visitorInteractionEvents = pgTable(
  "visitor_interaction_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => visitorSessions.id, { onDelete: "cascade" }),
    eventName: visitorInteractionEventNameEnum("event_name").notNull(),
    eventId: varchar("event_id", { length: 120 }).notNull(),
    pageUrl: text("page_url"),
    elementKey: varchar("element_key", { length: 160 }),
    elementLabel: varchar("element_label", { length: 255 }),
    sectionKey: varchar("section_key", { length: 160 }),
    targetUrl: text("target_url"),
    scrollDepth: integer("scroll_depth"),
    payload: jsonb("payload").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("visitor_interaction_events_store_event_id_uniq").on(
      table.storeId,
      table.eventId,
    ),
    index("visitor_interaction_events_store_name_time_idx").on(
      table.storeId,
      table.eventName,
      table.occurredAt,
    ),
    index("visitor_interaction_events_session_time_idx").on(
      table.sessionId,
      table.occurredAt,
    ),
    index("visitor_interaction_events_store_element_idx").on(
      table.storeId,
      table.elementKey,
      table.eventName,
    ),
    check(
      "visitor_interaction_events_scroll_depth_check",
      sql`${table.scrollDepth} is null or (${table.scrollDepth} >= 1 and ${table.scrollDepth} <= 100)`,
    ),
  ],
).enableRLS();

export const orderAttributions = pgTable(
  "order_attributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id").references(() => visitors.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => visitorSessions.id, {
      onDelete: "set null",
    }),
    source: varchar("source", { length: 255 }).notNull(),
    medium: varchar("medium", { length: 255 }),
    campaign: varchar("campaign", { length: 255 }),
    content: varchar("content", { length: 255 }),
    term: varchar("term", { length: 255 }),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    fbclid: text("fbclid"),
    gclid: text("gclid"),
    firstTouch: jsonb("first_touch"),
    lastTouch: jsonb("last_touch"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("order_attributions_order_uniq").on(table.orderId),
    index("order_attributions_campaign_idx").on(
      table.storeId,
      table.campaign,
    ),
  ],
).enableRLS();


export const checkoutIntents = pgTable(
  "checkout_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    intentKey: varchar("intent_key", { length: 120 }).notNull(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => visitorSessions.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 255 }),
    quantity: integer("quantity").notNull().default(1),
    privacyPolicyVersion: varchar("privacy_policy_version", { length: 32 }).notNull(),
    emailMarketingAllowed: boolean("email_marketing_allowed").notNull().default(false),
    smsMarketingAllowed: boolean("sms_marketing_allowed").notNull().default(false),
    whatsappMarketingAllowed: boolean("whatsapp_marketing_allowed").notNull().default(false),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("checkout_intents_store_key_uniq").on(table.storeId, table.intentKey),
    index("checkout_intents_store_activity_idx").on(table.storeId, table.lastActivityAt),
    index("checkout_intents_session_idx").on(table.sessionId),
    check("checkout_intents_quantity_positive", sql`${table.quantity} > 0`),
  ],
).enableRLS();

export const customerMarketingPreferences = pgTable(
  "customer_marketing_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    emailMarketingAllowed: boolean("email_marketing_allowed").notNull().default(false),
    smsMarketingAllowed: boolean("sms_marketing_allowed").notNull().default(false),
    whatsappMarketingAllowed: boolean("whatsapp_marketing_allowed").notNull().default(false),
    privacyPolicyVersion: varchar("privacy_policy_version", { length: 32 }).notNull(),
    source: varchar("source", { length: 32 }).notNull().default("SELF_SERVICE"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_marketing_preferences_store_customer_uniq").on(
      table.storeId,
      table.customerId,
    ),
    index("customer_marketing_preferences_store_updated_idx").on(
      table.storeId,
      table.updatedAt,
    ),
  ],
).enableRLS();

export const fulfillmentShipments = pgTable(
  "fulfillment_shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull().default("STEADFAST"),
    status: varchar("status", { length: 32 }).notNull().default("PENDING"),
    requestFingerprint: varchar("request_fingerprint", { length: 64 }).notNull(),
    consignmentId: varchar("consignment_id", { length: 128 }),
    trackingCode: varchar("tracking_code", { length: 128 }),
    providerStatus: varchar("provider_status", { length: 64 }),
    lastError: text("last_error"),
    providerResponse: jsonb("provider_response"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fulfillment_shipments_store_order_uniq").on(table.storeId, table.orderId),
    index("fulfillment_shipments_store_status_idx").on(table.storeId, table.status, table.updatedAt),
    check("fulfillment_shipments_provider_check", sql`${table.provider} = 'STEADFAST'`),
    check("fulfillment_shipments_status_check", sql`${table.status} in ('PENDING', 'SUBMITTED', 'FAILED')`),
  ],
).enableRLS();

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: adminRoleEnum("role").notNull().default("ADMIN"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("admin_users_store_email_uniq").on(table.storeId, table.email),
    index("admin_users_store_active_idx").on(table.storeId, table.isActive),
  ],
).enableRLS();

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_hash_uniq").on(table.tokenHash),
    index("admin_sessions_user_expiry_idx").on(
      table.adminUserId,
      table.expiresAt,
    ),
    index("admin_sessions_expiry_idx").on(table.expiresAt),
  ],
).enableRLS();

export const requestRateLimits = pgTable(
  "request_rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar("scope", { length: 80 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    requestCount: integer("request_count").notNull().default(1),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("request_rate_limits_scope_key_uniq").on(
      table.scope,
      table.keyHash,
    ),
    index("request_rate_limits_expiry_idx").on(table.expiresAt),
    check("request_rate_limits_count_positive", sql`${table.requestCount} > 0`),
  ],
).enableRLS();

export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderConsent = typeof orderConsents.$inferSelect;
export type CommerceEvent = typeof commerceEvents.$inferSelect;
export type VisitorInteractionEvent = typeof visitorInteractionEvents.$inferSelect;
export type CheckoutIntent = typeof checkoutIntents.$inferSelect;
export type CustomerMarketingPreference = typeof customerMarketingPreferences.$inferSelect;
export type FulfillmentShipment = typeof fulfillmentShipments.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
