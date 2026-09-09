"use client";

import Image from "next/image";
import { FormEvent, MutableRefObject } from "react";
import { ShieldCheck, Truck, RotateCcw, Phone, CheckCircle2, Lock, Sparkles, ArrowRight } from "lucide-react";

interface CatalogSelection {
  product: {
    name: string;
    slug?: string;
  };
  variant: {
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

interface LuxuryOrderSectionProps {
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

export function LuxuryOrderSection({
  catalogSelection,
  catalogError = "",
  quantity,
  setQuantity,
  regularUnitPrice,
  unitPrice,
  regularTotal,
  total,
  savings,
  banglaPackLabels,
  orderState,
  setOrderState,
  otpState,
  setOtpState,
  startPhoneOtp,
  verifyPhoneOtp,
  submitOrder,
  scheduleCheckoutRecoveryCapture,
  idempotencyKeyRef,
  trackEventOnce,
}: LuxuryOrderSectionProps) {
  const productName = catalogSelection?.product?.name || "প্রিমিয়াম মদিনা সিল্ক ওড়না";

  return (
    <section
      id="order-section"
      className="relative w-full bg-gradient-to-b from-[#08110c] via-[#0d1f15] to-[#08110c] text-[#f8f1e3] py-24 border-t border-[#c9a24d]/25 overflow-hidden"
      data-track-section="order"
    >
      <div id="order" className="sr-only" aria-hidden="true" />

      {/* Decorative Atmospheric Glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#c9a24d]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[600px] h-[600px] bg-[#123d2a]/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Product Prestige & Editorial Showcase (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a24d]/40 bg-[#c9a24d]/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-[#c9a24d] mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>বিশেষ অফার ও প্রি-অর্ডার • Limited Offer</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f8f1e3] leading-[1.2]">
                {productName}
                <span className="block italic font-normal text-[#c9a24d] mt-1">
                  The Medina Silk Veil
                </span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#f8f1e3]/75 leading-relaxed">
                দুবাই স্ট্যান্ডার্ড আল্ট্রা-সফট মদিনা সিল্ক, শতভাগ অপেক ও মার্জিত ড্রুপিং ফিনিশ। আজ অর্ডার করলে পাচ্ছেন সরাসরি বিশেষ ডিসকাউন্ট এবং সারা বাংলাদেশে ফ্রি ডেলিভারি।
              </p>
            </div>

            {/* Product Card with Arched Frame */}
            <div className="relative rounded-2xl border border-[#c9a24d]/30 bg-[#123d2a]/40 p-6 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="relative h-72 sm:h-80 w-full rounded-xl overflow-hidden border border-white/10">
                <Image
                  src="/niyamah/editorial/hijab-drape.jpg"
                  alt={productName}
                  fill
                  sizes="(max-width: 768px) 90vw, 450px"
                  className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                
                {/* Floating Savings Badge */}
                <div className="absolute top-4 left-4 rounded-full bg-[#c9a24d] text-[#08110c] px-3.5 py-1 text-xs font-mono font-bold tracking-wider uppercase shadow-lg">
                  সাশ্রয় ৳{savings.toLocaleString("bn-BD")}
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a24d] block">
                      বিশেষ অফার মূল্য
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-white">
                        ৳{unitPrice.toLocaleString("bn-BD")}
                      </span>
                      <del className="text-white/50 text-sm font-mono">
                        ৳{regularUnitPrice.toLocaleString("bn-BD")}
                      </del>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    ইন স্টক • Ready to Ship
                  </span>
                </div>
              </div>

              {/* Guarantees List */}
              <div className="mt-6 grid grid-cols-2 gap-3.5 text-xs text-[#f8f1e3]/85">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <Truck className="h-4 w-4 text-[#c9a24d] shrink-0" />
                  <span>সারা দেশে ফ্রি ডেলিভারি</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <ShieldCheck className="h-4 w-4 text-[#c9a24d] shrink-0" />
                  <span>দেখে পেমেন্ট (COD)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <RotateCcw className="h-4 w-4 text-[#c9a24d] shrink-0" />
                  <span>৭ দিনের সহজ এক্সচেঞ্জ</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <Phone className="h-4 w-4 text-[#c9a24d] shrink-0" />
                  <span>হটলাইন: ০৯৬১৩-২৪০২৪০</span>
                </div>
              </div>
            </div>

            {/* Micro Quote */}
            <div className="border-l-2 border-[#c9a24d] pl-4 py-1 text-xs sm:text-sm text-[#f8f1e3]/70 italic font-serif">
              “শালীনতা কোনো সীমাবদ্ধতা নয়, এটি আত্মমর্যাদা ও অন্তরের পরম আভিজাত্য।”
            </div>
          </div>

          {/* Right Column: Interactive Order & OTP Verification Panel (7 cols) */}
          <div className="lg:col-span-7">
            <div
              id="order-form"
              className="rounded-2xl border border-[#c9a24d]/40 bg-[#0e2218]/90 p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-[#f8f1e3]">
                    অর্ডার ফর্ম • Checkout
                  </h3>
                  <p className="text-xs text-[#c9a24d] font-mono tracking-wider mt-1 uppercase">
                    নিচের তথ্যগুলো পূরণ করে অর্ডার কনফার্ম করুন
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/60 font-mono">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>256-bit SSL Secure</span>
                </div>
              </div>

              {/* Quantity & Total Price Selector */}
              <div className="mb-6 p-4 rounded-xl border border-[#c9a24d]/25 bg-black/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-[#c9a24d] block mb-1">
                      পরিমাণ নির্বাচন করুন • Select Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((val, idx) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setQuantity(val);
                            trackEventOnce("add-to-cart", "ADD_TO_CART", catalogSelection, val);
                          }}
                          className={`h-9 px-3 sm:px-4 rounded border text-xs font-mono font-semibold transition-all cursor-pointer ${
                            quantity === val
                              ? "border-[#c9a24d] bg-[#c9a24d] text-[#08110c] shadow-md shadow-[#c9a24d]/20 scale-105"
                              : "border-white/15 bg-white/5 text-[#f8f1e3] hover:border-[#c9a24d]/50"
                          }`}
                        >
                          {banglaPackLabels[idx] || `${val} পিস`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                    <span className="text-[11px] font-mono uppercase text-white/60 block">
                      সর্বমোট পরিশোধযোগ্য
                    </span>
                    <div className="flex sm:justify-end items-baseline gap-2 mt-0.5">
                      <del className="text-xs font-mono text-white/40">
                        ৳{regularTotal.toLocaleString("bn-BD")}
                      </del>
                      <span className="font-serif text-2xl font-bold text-[#c9a24d]">
                        ৳{total.toLocaleString("bn-BD")}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono block">
                      সাশ্রয়: ৳{savings.toLocaleString("bn-BD")} • ফ্রি ডেলিভারি
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form
                onSubmit={submitOrder}
                onFocusCapture={() =>
                  trackEventOnce("begin-checkout", "BEGIN_CHECKOUT", catalogSelection, quantity)
                }
                onChange={(event) => {
                  scheduleCheckoutRecoveryCapture(event.currentTarget);
                  if (event.target && "name" in event.target && event.target.name === "phone" && otpState.status !== "idle") {
                    setOtpState({
                      status: "idle",
                      challengeId: "",
                      phone: "",
                      code: "",
                      token: "",
                      message: "",
                      devCode: ""
                    });
                  }
                  if (orderState.status === "error") {
                    idempotencyKeyRef.current = null;
                    setOrderState({
                      status: "idle",
                      message: "",
                      publicId: "",
                      preferencesUrl: ""
                    });
                  }
                }}
                className="space-y-4"
                data-clarity-mask="true"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#f8f1e3]/80 mb-1.5">
                    আপনার নাম • Full Name <span className="text-[#c9a24d]">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    maxLength={255}
                    placeholder="আপনার পুরো নাম লিখুন"
                    required
                    className="w-full h-11 px-4 rounded-lg bg-black/40 border border-white/15 text-[#f8f1e3] text-sm placeholder:text-white/30 focus:border-[#c9a24d] focus:outline-none focus:ring-1 focus:ring-[#c9a24d] transition-colors"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#f8f1e3]/80 mb-1.5">
                    মোবাইল নম্বর • Phone Number <span className="text-[#c9a24d]">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    minLength={11}
                    maxLength={18}
                    placeholder="০১XXXXXXXXX"
                    required
                    className="w-full h-11 px-4 rounded-lg bg-black/40 border border-white/15 text-[#f8f1e3] text-sm placeholder:text-white/30 focus:border-[#c9a24d] focus:outline-none focus:ring-1 focus:ring-[#c9a24d] transition-colors"
                  />
                </div>

                {/* OTP Verification Box */}
                {otpState.status !== "idle" && (
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      otpState.status === "verified"
                        ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-200"
                        : otpState.status === "error"
                        ? "border-red-500/60 bg-red-950/30 text-red-200"
                        : "border-[#c9a24d]/60 bg-[#123d2a]/50 text-[#f8f1e3]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs font-mono uppercase tracking-wider">
                          মোবাইল ভেরিফিকেশন • OTP Verification
                        </span>
                      </div>
                      <span className="text-xs text-[#c9a24d]">{otpState.message}</span>
                    </div>

                    {otpState.status !== "verified" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            aria-label="৬ সংখ্যার OTP"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="৬ সংখ্যার কোড"
                            value={otpState.code}
                            onChange={(event) =>
                              setOtpState((current) => ({
                                ...current,
                                code: event.target.value.replace(/\D/g, "").slice(0, 6),
                                status: current.status === "error" ? "awaiting" : current.status
                              }))
                            }
                            className="flex-1 h-10 px-3 rounded bg-black/50 border border-white/20 text-center text-base tracking-[0.25em] font-mono text-[#f8f1e3] focus:border-[#c9a24d] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={verifyPhoneOtp}
                            disabled={otpState.status === "verifying" || otpState.code.length !== 6}
                            className="h-10 px-4 rounded bg-[#c9a24d] text-[#08110c] text-xs font-semibold uppercase tracking-wider disabled:opacity-50 hover:bg-[#d9b86c] transition-colors cursor-pointer"
                          >
                            {otpState.status === "verifying" ? "যাচাই হচ্ছে…" : "যাচাই করুন"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => startPhoneOtp(otpState.phone)}
                            disabled={otpState.status === "sending" || otpState.status === "verifying"}
                            className="text-[#c9a24d] hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            নতুন কোড পাঠান (Resend)
                          </button>
                          {otpState.devCode && (
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                              Dev OTP: {otpState.devCode}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#f8f1e3]/80 mb-1.5">
                    ইমেইল এড্রেস • Email <span className="text-white/40">(ঐচ্ছিক)</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    placeholder="name@example.com"
                    className="w-full h-11 px-4 rounded-lg bg-black/40 border border-white/15 text-[#f8f1e3] text-sm placeholder:text-white/30 focus:border-[#c9a24d] focus:outline-none focus:ring-1 focus:ring-[#c9a24d] transition-colors"
                  />
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#f8f1e3]/80 mb-1.5">
                    সম্পূর্ণ ঠিকানা • Delivery Address <span className="text-[#c9a24d]">*</span>
                  </label>
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    minLength={3}
                    maxLength={1000}
                    placeholder="বাসা নং, রোড/মহল্লা, থানা"
                    rows={3}
                    required
                    className="w-full p-4 rounded-lg bg-black/40 border border-white/15 text-[#f8f1e3] text-sm placeholder:text-white/30 focus:border-[#c9a24d] focus:outline-none focus:ring-1 focus:ring-[#c9a24d] transition-colors"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#f8f1e3]/80 mb-1.5">
                    জেলা • District <span className="text-[#c9a24d]">*</span>
                  </label>
                  <input
                    name="district"
                    type="text"
                    autoComplete="address-level1"
                    minLength={2}
                    maxLength={160}
                    placeholder="যেমন: ঢাকা, চট্টগ্রাম, সিলেট"
                    required
                    className="w-full h-11 px-4 rounded-lg bg-black/40 border border-white/15 text-[#f8f1e3] text-sm placeholder:text-white/30 focus:border-[#c9a24d] focus:outline-none focus:ring-1 focus:ring-[#c9a24d] transition-colors"
                  />
                </div>

                {/* Privacy Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-[#f8f1e3]/75 cursor-pointer select-none">
                    <input
                      name="privacyAcknowledged"
                      type="checkbox"
                      required
                      className="mt-0.5 rounded border-white/20 bg-black/40 text-[#c9a24d] focus:ring-[#c9a24d]"
                    />
                    <span>
                      আমি <a href="/privacy" target="_blank" className="text-[#c9a24d] underline">গোপনীয়তা নীতি</a> পড়েছি এবং পার্সেল ডেলিভারি ও অর্ডার প্রসেসিংয়ের জন্য তথ্য ব্যবহারে সম্মত।
                    </span>
                  </label>
                </div>

                {/* Optional Marketing Consent */}
                <details className="text-xs text-[#f8f1e3]/60 pt-1 group">
                  <summary className="cursor-pointer hover:text-[#c9a24d] select-none font-mono">
                    + নতুন কালেকশন ও স্পেশাল অফারের নোটিফিকেশন পেতে চান? (ঐচ্ছিক)
                  </summary>
                  <div className="mt-2 pl-2 space-y-2 border-l border-white/10">
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input name="emailMarketingConsent" type="checkbox" className="rounded" />
                      <span>Email-এ বিশেষ প্রিভিউ ও অফার পেতে চাই</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input name="smsMarketingConsent" type="checkbox" className="rounded" />
                      <span>SMS-এ ট্র্যাকিং ও ডিসকাউন্ট নোটিফিকেশন পেতে চাই</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input name="whatsappMarketingConsent" type="checkbox" className="rounded" />
                      <span>WhatsApp-এ ভিআইপি সাপোর্ট ও অফার পেতে চাই</span>
                    </label>
                  </div>
                </details>

                {/* Status Alert */}
                {(catalogError || orderState.message) && (
                  <div
                    className={`p-4 rounded-lg text-xs leading-relaxed ${
                      orderState.status === "success"
                        ? "bg-emerald-950/60 border border-emerald-500/60 text-emerald-200"
                        : orderState.status === "loading"
                        ? "bg-amber-950/60 border border-amber-500/60 text-amber-200"
                        : "bg-red-950/60 border border-red-500/60 text-red-200"
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <p className="font-medium">
                      {catalogError || orderState.message}
                    </p>
                    {orderState.publicId && (
                      <p className="mt-1 font-mono text-sm text-[#c9a24d]">
                        অর্ডার ট্র্যাকিং নম্বর: #{orderState.publicId}
                      </p>
                    )}
                    {orderState.preferencesUrl && (
                      <p className="mt-1 text-[11px]">
                        <a href={orderState.preferencesUrl} className="underline">
                          মার্কেটিং পছন্দ পরিবর্তন করুন
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Order CTA */}
                <button
                  type="submit"
                  data-track-cta="order_submit"
                  data-track-label="অর্ডার নিশ্চিত করুন"
                  disabled={
                    !catalogSelection ||
                    !catalogSelection.variant.inStock ||
                    Boolean(catalogError) ||
                    orderState.status === "loading" ||
                    orderState.status === "success" ||
                    otpState.status === "sending" ||
                    otpState.status === "verifying"
                  }
                  className="w-full mt-4 h-14 rounded-lg border border-[#c9a24d] bg-[#c9a24d] hover:bg-[#d9b86c] text-[#08110c] font-semibold text-sm sm:text-base uppercase tracking-[0.14em] shadow-xl shadow-[#c9a24d]/15 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.01]"
                >
                  <span>
                    {orderState.status === "loading"
                      ? "অর্ডার গ্রহণ করা হচ্ছে…"
                      : orderState.status === "success"
                      ? "অর্ডার সফল হয়েছে ✓"
                      : otpState.status === "verified"
                      ? "অর্ডার নিশ্চিত করুন • Confirm Order"
                      : "অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি)"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Micro Security Footnote */}
                <div className="pt-2 text-center">
                  <p className="text-[11px] text-white/50 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-[#c9a24d]" />
                    <span>কোনো অগ্রিম পেমেন্ট লাগবে না • পার্সেল হাতে পেয়ে মূল্য পরিশোধ করবেন</span>
                  </p>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
