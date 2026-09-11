import type {FormEvent, MutableRefObject} from "react";
export interface CatalogVariant {id?:string; sku:string; label?:string|null; inStock:boolean; priceMinor:number; compareAtPriceMinor?:number|null;}
export interface CatalogProduct {id?:string;name:string;slug?:string;variants:CatalogVariant[];}
export interface CatalogSelection {
  product: {
    name: string;
    id?: string;
    variants?: CatalogVariant[];
    slug?: string;
  };
  variant: {
    id?: string;
    label?: string | null;
    sku: string;
    inStock: boolean;
    priceMinor: number;
    compareAtPriceMinor?: number | null;
  };
}

interface OrderState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  publicId: string;
  preferencesUrl?: string;
}

interface OtpState {
  status: "idle" | "sending" | "awaiting" | "verifying" | "verified" | "error";
  challengeId: string;
  phone: string;
  code: string;
  token: string;
  message: string;
  devCode?: string;
}

export interface LuxuryOrderSectionProps {
  catalogProducts?: CatalogProduct[];
  onCatalogSelectionChange?: (selection: CatalogSelection) => void;
  catalogSelection: CatalogSelection | null;
  catalogError?: string;
  quantity: number;
  setQuantity: (q: number) => void;
  regularUnitPrice: number;
  unitPrice: number;
  regularTotal: number;
  total: number;
  savings: number;
  banglaPackLabels: string[];
  orderState: OrderState;
  setOrderState: React.Dispatch<React.SetStateAction<OrderState>>;
  otpState: OtpState;
  setOtpState: React.Dispatch<React.SetStateAction<OtpState>>;
  startPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: () => Promise<void>;
  submitOrder: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  scheduleCheckoutRecoveryCapture: (form: HTMLFormElement) => void;
  idempotencyKeyRef: MutableRefObject<string | null>;
  trackEventOnce: (key: string, eventName: string, selection: CatalogSelection | null, qty: number) => void;
}

