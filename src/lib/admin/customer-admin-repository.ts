export type CustomerSegment = "ALL" | "NEW" | "REPEAT" | "HIGH_VALUE";
export type MarketingChannel = "ALL" | "EMAIL" | "SMS" | "WHATSAPP";

export interface AdminCustomerQuery {
  query: string;
  segment: CustomerSegment;
  channel: MarketingChannel;
  page: number;
  pageSize: number;
}

export interface CustomerConsentState {
  emailMarketingAllowed: boolean;
  smsMarketingAllowed: boolean;
  whatsappMarketingAllowed: boolean;
  privacyPolicyVersion: string | null;
  capturedAt: Date | null;
}

export interface AdminCustomerListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  orderCount: number;
  deliveredOrderCount: number;
  deliveredRevenueMinor: number;
  lastOrderAt: Date | null;
  consent: CustomerConsentState;
  tags: string[];
}

export interface AdminCustomerSummary {
  customerCount: number;
  repeatCustomerCount: number;
  deliveredRevenueMinor: number;
  marketingEligibleCount: number;
}

export interface AdminCustomerListResult {
  store: { name: string; slug: string; currency: string; timezone: string };
  customers: AdminCustomerListItem[];
  total: number;
  summary: AdminCustomerSummary;
}

export interface AdminCustomerOrder {
  publicId: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  currency: string;
  source: string | null;
  createdAt: Date;
}

export interface AdminCustomerNote {
  id: string;
  note: string;
  createdByAdminEmail: string;
  createdAt: Date;
}

export interface AdminCustomerActivity {
  id: string;
  action: string;
  changedByAdminEmail: string;
  metadata: unknown;
  createdAt: Date;
}

export interface AdminCustomerDetail extends AdminCustomerListItem {
  store: AdminCustomerListResult["store"];
  firstOrderAt: Date | null;
  averageDeliveredOrderMinor: number;
  acquisitionSources: Array<{ source: string; orderCount: number }>;
  orders: AdminCustomerOrder[];
  notes: AdminCustomerNote[];
  activity: AdminCustomerActivity[];
}

export interface CustomerActor {
  id: string;
  email: string;
}

export interface AddCustomerTagInput {
  storeId: string;
  customerId: string;
  tag: string;
  actor: CustomerActor;
  now: Date;
}

export interface RemoveCustomerTagInput extends AddCustomerTagInput {}

export interface AddCustomerNoteInput {
  storeId: string;
  customerId: string;
  note: string;
  actor: CustomerActor;
  now: Date;
}

export type CustomerMutationResult =
  | { kind: "OK" }
  | { kind: "NOT_FOUND" }
  | { kind: "DUPLICATE" };

export interface MarketingAudienceRow {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  deliveredOrderCount: number;
  deliveredRevenueMinor: number;
  lastOrderAt: Date | null;
  consentCapturedAt: Date;
}

export interface AdminCustomerRepository {
  listCustomers(storeId: string, query: AdminCustomerQuery): Promise<AdminCustomerListResult | null>;
  getCustomer(storeId: string, customerId: string): Promise<AdminCustomerDetail | null>;
  addTag(input: AddCustomerTagInput): Promise<CustomerMutationResult>;
  removeTag(input: RemoveCustomerTagInput): Promise<CustomerMutationResult>;
  addNote(input: AddCustomerNoteInput): Promise<CustomerMutationResult>;
  listMarketingAudience(storeId: string, channel: Exclude<MarketingChannel, "ALL">): Promise<MarketingAudienceRow[]>;
}
