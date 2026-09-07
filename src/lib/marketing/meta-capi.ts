import { createHash } from "node:crypto";
import type { MarketingEnvironment } from "../config/server-env";

export type MetaServerEventName = "PAGE_VIEW" | "VIEW_CONTENT" | "ADD_TO_CART" | "BEGIN_CHECKOUT" | "PURCHASE";

const META_EVENT_NAMES: Record<MetaServerEventName, string> = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  ADD_TO_CART: "AddToCart",
  BEGIN_CHECKOUT: "InitiateCheckout",
  PURCHASE: "Purchase",
};

export interface MetaCapiEventInput {
  pixelId?: string;
  analyticsAllowed: boolean;
  eventName: MetaServerEventName;
  eventId: string;
  occurredAt: Date;
  pageUrl?: string;
  clientIp?: string;
  userAgent?: string;
  visitorKey?: string;
  fbclid?: string;
  email?: string;
  phone?: string;
  valueMinor?: number | null;
  currency?: string | null;
  contentId?: string | null;
  contentName?: string | null;
  quantity?: number;
}

export interface MetaCapiDeliveryResult {
  sent: boolean;
  reason?: "CONSENT" | "CONFIG" | "FAILED";
  status?: number;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

function normalizePhone(value?: string) {
  const normalized = value?.replace(/\D/g, "");
  return normalized ? sha256(normalized) : undefined;
}

function validPixelId(value: unknown): value is string {
  return typeof value === "string" && /^\d{5,25}$/.test(value);
}

export async function sendMetaCapiEvent(
  input: MetaCapiEventInput,
  environment: MarketingEnvironment,
  fetchImpl: typeof fetch = fetch,
): Promise<MetaCapiDeliveryResult> {
  if (!input.analyticsAllowed) return { sent: false, reason: "CONSENT" };
  if (!validPixelId(input.pixelId) || !environment.META_CAPI_ACCESS_TOKEN || !environment.META_GRAPH_API_VERSION) {
    return { sent: false, reason: "CONFIG" };
  }

  const userData = Object.fromEntries(Object.entries({
    client_ip_address: input.clientIp && input.clientIp !== "local-or-unknown" ? input.clientIp : undefined,
    client_user_agent: input.userAgent,
    external_id: input.visitorKey ? [sha256(input.visitorKey)] : undefined,
    em: normalizeEmail(input.email) ? [normalizeEmail(input.email)] : undefined,
    ph: normalizePhone(input.phone) ? [normalizePhone(input.phone)] : undefined,
    fbc: input.fbclid ? `fb.1.${input.occurredAt.getTime()}.${input.fbclid}` : undefined,
  }).filter(([, value]) => value !== undefined));

  const customData = Object.fromEntries(Object.entries({
    currency: input.currency ?? undefined,
    value: typeof input.valueMinor === "number" ? input.valueMinor / 100 : undefined,
    content_ids: input.contentId ? [input.contentId] : undefined,
    content_name: input.contentName ?? undefined,
    content_type: input.contentId ? "product" : undefined,
    num_items: input.quantity,
  }).filter(([, value]) => value !== undefined));

  const payload: Record<string, unknown> = {
    data: [{
      event_name: META_EVENT_NAMES[input.eventName],
      event_time: Math.floor(input.occurredAt.getTime() / 1000),
      event_id: input.eventId,
      action_source: "website",
      event_source_url: input.pageUrl,
      user_data: userData,
      custom_data: customData,
    }],
  };
  if (environment.META_CAPI_TEST_EVENT_CODE) payload.test_event_code = environment.META_CAPI_TEST_EVENT_CODE;

  const endpoint = new URL(`https://graph.facebook.com/${environment.META_GRAPH_API_VERSION}/${input.pixelId}/events`);
  endpoint.searchParams.set("access_token", environment.META_CAPI_ACCESS_TOKEN);

  try {
    const response = await fetchImpl(endpoint.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500),
    });
    return response.ok ? { sent: true, status: response.status } : { sent: false, reason: "FAILED", status: response.status };
  } catch {
    return { sent: false, reason: "FAILED" };
  }
}
