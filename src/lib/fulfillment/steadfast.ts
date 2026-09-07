import type { SteadfastEnvironment } from "../config/server-env";

export interface SteadfastOrderInput {
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmountMinor: number;
  note?: string | null;
  itemDescription?: string | null;
  totalLot?: number;
}

export interface SteadfastShipmentResult {
  consignmentId: string;
  trackingCode: string;
  providerStatus: string | null;
  raw: unknown;
}

export class SteadfastError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "NETWORK" | "PROVIDER_ERROR" | "INVALID_RESPONSE",
    message: string,
  ) {
    super(message);
    this.name = "SteadfastError";
  }
}

export function buildSteadfastPayload(input: SteadfastOrderInput) {
  return {
    invoice: input.invoice,
    recipient_name: input.recipientName.slice(0, 100),
    recipient_phone: input.recipientPhone.slice(0, 32),
    recipient_address: input.recipientAddress.slice(0, 250),
    cod_amount: Math.max(0, input.codAmountMinor) / 100,
    note: input.note?.slice(0, 250) || undefined,
    item_description: input.itemDescription?.slice(0, 250) || undefined,
    total_lot: input.totalLot && input.totalLot > 0 ? input.totalLot : undefined,
    delivery_type: 0,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export async function createSteadfastShipment(
  input: SteadfastOrderInput,
  environment: SteadfastEnvironment,
  fetchImpl: typeof fetch = fetch,
): Promise<SteadfastShipmentResult> {
  if (!environment.STEADFAST_API_KEY || !environment.STEADFAST_SECRET_KEY) {
    throw new SteadfastError("NOT_CONFIGURED", "Steadfast credentials are not configured.");
  }
  const url = `${environment.STEADFAST_BASE_URL.replace(/\/$/, "")}/create_order`;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Api-Key": environment.STEADFAST_API_KEY,
        "Secret-Key": environment.STEADFAST_SECRET_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildSteadfastPayload(input)),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new SteadfastError("NETWORK", error instanceof Error ? error.message : "Steadfast request failed.");
  }

  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    throw new SteadfastError("PROVIDER_ERROR", `Steadfast rejected the shipment with HTTP ${response.status}.`);
  }
  const record = body && typeof body === "object" ? body as Record<string, unknown> : null;
  const consignment = record?.consignment && typeof record.consignment === "object"
    ? record.consignment as Record<string, unknown>
    : record;
  const consignmentId = stringValue(consignment?.consignment_id ?? consignment?.id);
  const trackingCode = stringValue(consignment?.tracking_code ?? consignment?.trackingCode ?? record?.tracking_code ?? record?.trackingCode);
  const providerStatus = stringValue(consignment?.status) || null;
  if (!consignmentId || !trackingCode) {
    throw new SteadfastError("INVALID_RESPONSE", "Steadfast response did not contain a consignment ID and tracking code.");
  }
  return { consignmentId, trackingCode, providerStatus, raw: body };
}
