export interface FulfillmentShipmentRecord {
  id: string;
  provider: string;
  status: string;
  requestFingerprint: string;
  consignmentId: string | null;
  trackingCode: string | null;
  providerStatus: string | null;
  lastError: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
}

export interface FulfillmentOrderCandidate {
  orderId: string;
  publicId: string;
  status: string;
  currency: string;
  totalMinor: number;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  area: string | null;
  district: string;
  note: string | null;
  itemDescription: string;
  totalLot: number;
  shipment: FulfillmentShipmentRecord | null;
}

export interface AdminFulfillmentRepository {
  getOrderCandidate(storeId: string, publicId: string): Promise<FulfillmentOrderCandidate | null>;
  claimSubmission(input: {
    storeId: string;
    orderId: string;
    requestFingerprint: string;
    now: Date;
  }): Promise<"ACQUIRED" | "BUSY" | "SUBMITTED">;
  markSubmitted(input: {
    storeId: string;
    orderId: string;
    consignmentId: string;
    trackingCode: string;
    providerStatus: string | null;
    providerResponse: unknown;
    now: Date;
  }): Promise<void>;
  markFailed(input: {
    storeId: string;
    orderId: string;
    error: string;
    now: Date;
  }): Promise<void>;
}
