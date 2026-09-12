'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { LuxuryOrderSectionProps } from './order/order-types';
import { orderArt, DISTRICTS } from './order/order-art';
import { OrderImage } from './order/order-image';
import { OrderOtp } from './order/order-otp';
import { PHONE_OTP_REQUIRED } from '../../src/lib/config/features';
import './order/order.css';

const STEPS = ['হিজাব', 'পারফিউম', 'প্যাকেজ', 'ডেলিভারি', 'নিশ্চিতকরণ'];

const TITLES = [
  'প্যাকেজে কোন হিজাব নিতে চান তা নির্বাচন করুন',
  'প্যাকেজে কোন পারফিউম নিতে চান তা নির্বাচন করুন',
  'আপনার নির্বাচিত হিজাব ও পারফিউম',
  'আপনার ডেলিভারি তথ্য দিন',
  'আপনার অর্ডার প্রস্তুত'
];

const HINTS = [
  'আপনার পছন্দের হিজাবটিতে ক্লিক করলেই পরবর্তী ধাপে চলে যাবে',
  'আপনার পছন্দের পারফিউমটিতে ক্লিক করলেই পরবর্তী ধাপে চলে যাবে',
  'আপনার পছন্দের হিজাব ও পারফিউম নির্বাচন সম্পন্ন হয়েছে, পরিমাণ নির্ধারণ করুন',
  'আপনার অর্ডার পৌঁছে দিতে নিচের তথ্যগুলো সঠিকভাবে দিন',
  'সব তথ্য ঠিক আছে কিনা দেখে অর্ডার নিশ্চিত করুন'
];

const FALLBACK_HIJABS = [
  { sku: 'NYM-SH-001', label: 'হোয়াইট পিঙ্ক ফ্লোরাল (White Pink Floral)', inStock: true, priceMinor: 80000 },
  { sku: 'NYM-SH-002', label: 'রয়্যাল ল্যাভেন্ডার (Royal Lavender)', inStock: true, priceMinor: 80000 },
  { sku: 'NYM-SH-003', label: 'রোজ পিঙ্ক ফ্লোরাল (Rose Pink Floral)', inStock: true, priceMinor: 80000 },
  { sku: 'NYM-SH-004', label: 'ল্যাভেন্ডার ব্লসম (Lavender Blossom)', inStock: true, priceMinor: 80000 },
  { sku: 'NYM-SH-005', label: 'আইভরি পিঙ্ক ব্লসম (Ivory Pink Blossom)', inStock: true, priceMinor: 80000 },
  { sku: 'NYM-SH-006', label: 'পীচ ফ্লোরাল (Peach Floral)', inStock: true, priceMinor: 80000 },
];

const FALLBACK_PERFUMES = [
  { sku: 'NYM-PRF-001', label: 'অরিজিনাল অর্কিড (Orchid)', inStock: true, priceMinor: 85000 },
  { sku: 'NYM-PRF-002', label: 'কোরাল ওশান ব্লু (Coral)', inStock: true, priceMinor: 85000 },
  { sku: 'NYM-PRF-003', label: 'গোল্ডেন ফিয়েস্তা (Fiesta)', inStock: true, priceMinor: 85000 },
  { sku: 'NYM-PRF-004', label: 'লাক্সারি অ্যাফেয়ার (Affair)', inStock: true, priceMinor: 85000 },
  { sku: 'NYM-PRF-005', label: 'অটাম ব্লুম (Autumn)', inStock: true, priceMinor: 85000 },
  { sku: 'NYM-PRF-006', label: 'এমেরাল্ড ট্রপিক (Tropic)', inStock: true, priceMinor: 85000 },
];

const money = (n: number) => '৳' + n.toLocaleString('bn-BD');

export function LuxuryOrderSection(props: LuxuryOrderSectionProps) {
  const {
    catalogSelection: selection,
    catalogError = '',
    catalogProducts,
    quantity,
    setQuantity,
    orderState,
    setOrderState,
    otpState,
    setOtpState,
    idempotencyKeyRef,
    submitOrder
  } = props;

  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState('');
  const [selectedHijabSku, setSelectedHijabSku] = useState<string>('NYM-SH-001');
  const [selectedPerfumeSku, setSelectedPerfumeSku] = useState<string>('NYM-PRF-001');

  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const locked = useRef(false);

  const products = catalogProducts?.length ? catalogProducts : selection ? [{ ...selection.product, variants: selection.product.variants?.length ? selection.product.variants : [selection.variant] }] : [];

  const hijabProduct = products.find(p => /hijab|salat|হিজাব/i.test((p.slug || '') + ' ' + p.name)) || { name: 'নামাজের হিজাব — Pure bexi কটন', slug: 'pure-bexi-cotton-salat-hijab', variants: FALLBACK_HIJABS };
  const perfumeProduct = products.find(p => /perfume|attar|পারফিউম|আতর/i.test((p.slug || '') + ' ' + p.name)) || { name: 'নন আলকোহলিক পারফিউম', slug: 'non-alcoholic-orchid-perfume', variants: FALLBACK_PERFUMES };
  const tulipProduct = products.find(p => /gift|tulip|টিউলিপ/i.test((p.slug || '') + ' ' + p.name)) || selection?.product || { name: 'টিউলিপ প্যাকেজ (লাক্সারি গিফট সেট)', slug: 'tulip-package-gift-set', variants: [{ sku: 'NYM-TLP-001', label: 'কমপ্লিট গিফট সেট', inStock: true, priceMinor: 122500 }] };

  const hijabVariants = hijabProduct.variants?.length ? hijabProduct.variants : FALLBACK_HIJABS;
  const perfumeVariants = perfumeProduct.variants?.length ? perfumeProduct.variants : FALLBACK_PERFUMES;
  const tulipVariant = tulipProduct.variants?.find(v => v.sku === 'NYM-TLP-001') || tulipProduct.variants?.[0] || selection?.variant;

  const activeHijab = hijabVariants.find(v => v.sku === selectedHijabSku) || hijabVariants[0];
  const activePerfume = perfumeVariants.find(v => v.sku === selectedPerfumeSku) || perfumeVariants[0];

  const priceMinor = tulipVariant?.priceMinor || 122500;
  const amount = priceMinor * quantity / 100;

  const busy = orderState.status === 'loading' || (PHONE_OTP_REQUIRED && (otpState.status === 'sending' || otpState.status === 'verifying'));
  const completed = orderState.status === 'success';
  const unavailable = !tulipVariant || !tulipVariant.inStock || !!catalogError;

  function go(nextStep: number) {
    setStep(nextStep);
    setLocalError('');
    requestAnimationFrame(() => {
      const h = heading.current;
      h?.focus({ preventScroll: true });
      if (h && h.getBoundingClientRect().top < 70) {
        h.scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      }
    });
  }

  function clearError() {
    if (orderState.status === 'error') {
      idempotencyKeyRef.current = null;
      setOrderState({ status: 'idle', message: '', publicId: '', preferencesUrl: '' });
    }
  }

  function onSelectHijab(sku: string) {
    if (busy || completed) return;
    setSelectedHijabSku(sku);
    clearError();
    setLocalError('');
    // Auto advance to Step 2 (Perfume) without requiring clicking next!
    go(1);
  }

  function onSelectPerfume(sku: string) {
    if (busy || completed) return;
    setSelectedPerfumeSku(sku);
    clearError();
    setLocalError('');
    // Auto advance to Step 3 (Package & Quantity) without requiring clicking next!
    go(2);
  }

  function count(nextQty: number) {
    setQuantity(Math.max(1, Math.min(5, nextQty)));
    idempotencyKeyRef.current = null;
    clearError();
  }

  function next() {
    if (unavailable) {
      setLocalError('অর্ডারের জন্য স্টকে থাকা একটি পণ্য নির্বাচন করুন।');
      return;
    }
    if (step === 3) {
      if (!form.current?.reportValidity()) return;
      const phone = String(new FormData(form.current).get('phone') || '').replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/[\s()-]/g, '');
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) {
        setLocalError('সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।');
        form.current?.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
        return;
      }
    }
    go(Math.min(4, step + 1));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step !== 4) {
      next();
      return;
    }
    if (busy || completed || locked.current || unavailable) return;
    locked.current = true;
    try {
      await submitOrder(e);
    } finally {
      locked.current = false;
    }
  }

  return (
    <section id="order-section" className="no-section" lang="bn" data-track-section="order">
      <span id="order" />
      <div className="no-shell">
        <header className="no-brandbar">
          <div>NIYAMAH<small>ATTIRES</small></div>
          <p>A SMALL CHOICE — A BIGGER PEACE</p>
        </header>

        {/* Step Progress Tracker */}
        <nav className="no-steps" aria-label="Order progress">
          {STEPS.map((label, i) => (
            <button
              type="button"
              key={label}
              disabled={i > step || busy || completed}
              onClick={() => go(i)}
              aria-current={step === i ? 'step' : undefined}
              className={i <= step ? 'is-done' : ''}
            >
              <b>{i < step ? '✓' : i + 1}</b>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <form
          ref={form}
          id="order-form"
          onSubmit={onSubmit}
          onFocusCapture={() => {
            if (tulipVariant?.id) {
              props.trackEventOnce(`begin-checkout:${tulipVariant.id}:${quantity}`, 'BEGIN_CHECKOUT', selection, quantity);
            }
          }}
          onChange={(e) => {
            const data = new FormData(e.currentTarget);
            setCustomer(Object.fromEntries(['name', 'phone', 'email', 'address', 'district', 'area'].map(k => [k, String(data.get(k) || '')])));
            props.scheduleCheckoutRecoveryCapture(e.currentTarget);
            const target = e.target;
            if (PHONE_OTP_REQUIRED && target instanceof HTMLInputElement && target.name === 'phone' && otpState.status !== 'idle') {
              setOtpState({ status: 'idle', challengeId: '', phone: '', code: '', token: '', message: '', devCode: '' });
            }
            clearError();
          }}
          data-clarity-mask="true"
        >
          {/* Hidden fields to capture selected Hijab & Perfume variants */}
          <input type="hidden" name="selectedHijab" value={activeHijab?.label || selectedHijabSku} />
          <input type="hidden" name="selectedPerfume" value={activePerfume?.label || selectedPerfumeSku} />
          <input type="hidden" name="note" value={`হিজাব: ${activeHijab?.label || selectedHijabSku} | পারফিউম: ${activePerfume?.label || selectedPerfumeSku}`} />

          <div className={`no-panel ${step < 2 ? 'no-product-step' : ''}`}>
            {/* Left Preview Stage on Desktop for Step 3, 4, 5 (Shows selected Hijab + Perfume) */}
            {step >= 2 && (
              <aside className="no-stage no-stage-dual">
                <p>MODESTY<br />IN EVERY<br />MOMENT<span /></p>
                <div className="no-arch" />
                <div className="no-dual-stage-art">
                  <div className="no-stage-hijab">
                    <OrderImage src={orderArt(hijabProduct, activeHijab.sku)} alt={activeHijab.label || activeHijab.sku} />
                  </div>
                  <div className="no-stage-perfume">
                    <OrderImage src={orderArt(perfumeProduct, activePerfume.sku)} alt={activePerfume.label || activePerfume.sku} />
                  </div>
                </div>
                <div className="no-stone" />
                <div className="no-stage-info">
                  <div className="no-stage-mini-thumbs">
                    <OrderImage src={orderArt(hijabProduct, activeHijab.sku)} alt="হিজাব" />
                    <OrderImage src={orderArt(perfumeProduct, activePerfume.sku)} alt="পারফিউম" />
                  </div>
                  <div>
                    <strong>নির্বাচিত কম্বো সেট</strong>
                    <small>{activeHijab?.label?.split('(')[0]?.trim()} + {activePerfume?.label?.split('(')[0]?.trim()}</small>
                  </div>
                  <div>
                    <small>Qty: {quantity}</small>
                    <strong>{money(amount)}</strong>
                  </div>
                </div>
              </aside>
            )}

            <div className="no-content">
              {/* Sticky Top Strip on Mobile for Step 4 & 5 */}
              {step >= 3 && (
                <div className="no-mobile-strip">
                  <div className="no-mobile-dual-thumbs">
                    <OrderImage src={orderArt(hijabProduct, activeHijab.sku)} alt="হিজাব" />
                    <OrderImage src={orderArt(perfumeProduct, activePerfume.sku)} alt="পারফিউম" />
                  </div>
                  <div className="no-mobile-strip-info">
                    <strong>নির্বাচিত কম্বো সেট</strong>
                    <small>{activeHijab?.label?.split('(')[0]?.trim()} + {activePerfume?.label?.split('(')[0]?.trim()}</small>
                  </div>
                  <div className="no-mobile-strip-price">
                    <strong>{money(amount)}</strong>
                    <button type="button" onClick={() => go(0)} className="no-mobile-strip-change">পরিবর্তন</button>
                  </div>
                </div>
              )}

              <header className="no-title">
                <p>STEP {step + 1} OF 5</p>
                <h2 ref={heading} tabIndex={-1}>{completed ? 'আপনার অর্ডার সফল হয়েছে' : TITLES[step]}</h2>
                <span>{completed ? 'আমাদের সঙ্গে থাকার জন্য ধন্যবাদ।' : HINTS[step]}</span>
              </header>

              <fieldset disabled={busy || completed} className="no-fields">
                {/* STEP 1: Hijab Selection (Auto-advances to Step 2 on click) */}
                {step === 0 && (
                  <div className="no-variant-grid no-variant-grid-custom">
                    {hijabVariants.map((v) => {
                      const isSelected = selectedHijabSku === v.sku;
                      return (
                        <button
                          type="button"
                          key={v.sku}
                          disabled={!v.inStock}
                          aria-pressed={isSelected}
                          className={`no-choice ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => onSelectHijab(v.sku)}
                        >
                          <OrderImage src={orderArt(hijabProduct, v.sku)} alt={v.label || v.sku} />
                          <strong>{v.label ? v.label.split('(')[0].trim() : v.sku}</strong>
                          <small>{v.label && v.label.includes('(') ? `(${v.label.split('(')[1]}` : '১০০% বেক্সি কটন'}</small>
                          <b className="no-radio">{isSelected ? '✓' : ''}</b>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* STEP 2: Perfume Selection (Auto-advances to Step 3 on click) */}
                {step === 1 && (
                  <div className="no-variant-grid no-variant-grid-custom">
                    {perfumeVariants.map((v) => {
                      const isSelected = selectedPerfumeSku === v.sku;
                      return (
                        <button
                          type="button"
                          key={v.sku}
                          disabled={!v.inStock}
                          aria-pressed={isSelected}
                          className={`no-choice ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => onSelectPerfume(v.sku)}
                        >
                          <OrderImage src={orderArt(perfumeProduct, v.sku)} alt={v.label || v.sku} />
                          <strong>{v.label ? v.label.split('(')[0].trim() : v.sku}</strong>
                          <small>{v.label && v.label.includes('(') ? `(${v.label.split('(')[1]}` : '১০০% অ্যালকোহল মুক্ত'}</small>
                          <b className="no-radio">{isSelected ? '✓' : ''}</b>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* STEP 3: Single Compact Card with 2 Pictures + Minimal Text */}
                {step === 2 && (
                  <>
                    <div className="no-combo-card-compact">
                      <div className="no-combo-duo">
                        {/* Hijab Item */}
                        <button
                          type="button"
                          className="no-combo-pick"
                          onClick={() => go(0)}
                          title="হিজাব পরিবর্তন করতে ক্লিক করুন"
                        >
                          <div className="no-combo-pic">
                            <OrderImage src={orderArt(hijabProduct, activeHijab.sku)} alt={activeHijab.label || activeHijab.sku} />
                          </div>
                          <strong className="no-combo-name">{activeHijab.label ? activeHijab.label.split('(')[0].trim() : activeHijab.sku}</strong>
                          <span className="no-combo-edit">বদলান ↗</span>
                        </button>

                        {/* Plus Symbol */}
                        <div className="no-combo-plus" aria-hidden="true">+</div>

                        {/* Perfume Item */}
                        <button
                          type="button"
                          className="no-combo-pick"
                          onClick={() => go(1)}
                          title="পারফিউম পরিবর্তন করতে ক্লিক করুন"
                        >
                          <div className="no-combo-pic">
                            <OrderImage src={orderArt(perfumeProduct, activePerfume.sku)} alt={activePerfume.label || activePerfume.sku} />
                          </div>
                          <strong className="no-combo-name">{activePerfume.label ? activePerfume.label.split('(')[0].trim() : activePerfume.sku}</strong>
                          <span className="no-combo-edit">বদলান ↗</span>
                        </button>
                      </div>

                      <div className="no-combo-bag-tag">
                        <span>🛍️ সাথে ফ্রি সিগনেচার টিউলিপ গিফট ব্যাগ অন্তর্ভুক্ত</span>
                      </div>
                    </div>

                    {/* Quantity & Price Card */}
                    <div className="no-combo-qty-card">
                      <div className="no-combo-qty-left">
                        <label>প্যাকেজের পরিমাণ</label>
                        <div className="no-counter">
                          <button type="button" onClick={() => count(quantity - 1)} disabled={quantity <= 1} aria-label="পরিমাণ কমান">−</button>
                          <output>{quantity.toLocaleString('bn-BD')}</output>
                          <button type="button" onClick={() => count(quantity + 1)} disabled={quantity >= 5} aria-label="পরিমাণ বাড়ান">+</button>
                          <small>✓ স্টকে আছে</small>
                        </div>
                      </div>
                      <div className="no-combo-qty-right">
                        <span className="no-combo-price-label">প্রতি প্যাকেজ অফার মূল্য: ৳১,২২৫</span>
                        <strong className="no-combo-price">{money(amount)}</strong>
                      </div>
                    </div>

                    <div className="no-totals">
                      <p><span>প্যাকেজ মূল্য ({quantity}টি)</span><strong>{money(amount)}</strong></p>
                      <p><span>ডেলিভারি চার্জ</span><strong>{money(0)} (ফ্রি)</strong></p>
                      <p><span>মোট প্রদেয়</span><strong>{money(amount)}</strong></p>
                    </div>
                  </>
                )}

                {/* STEP 4: Delivery Form */}
                <div hidden={step !== 3} className="no-delivery">
                  <div className="no-form-grid">
                    <label>
                      নাম <em>*</em>
                      <input name="name" autoComplete="name" required minLength={2} maxLength={255} placeholder="আপনার পূর্ণ নাম লিখুন" />
                    </label>
                    <label>
                      মোবাইল নম্বর <em>*</em>
                      <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={11} maxLength={18} placeholder="01XXXXXXXXX" />
                    </label>
                    <label className="no-wide">
                      সম্পূর্ণ ঠিকানা <em>*</em>
                      <textarea name="address" autoComplete="street-address" required minLength={3} maxLength={1000} rows={2} placeholder="বাড়ি নং, রোড/এলাকা, গ্রাম/মহল্লা" />
                    </label>
                    <label>
                      জেলা <em>*</em>
                      <input name="district" list="no-districts" autoComplete="address-level1" required minLength={2} maxLength={160} placeholder="জেলা নির্বাচন করুন" />
                      <datalist id="no-districts">
                        {DISTRICTS.map(d => <option key={d} value={d} />)}
                      </datalist>
                    </label>
                    <label>
                      উপজেলা / থানা <em>*</em>
                      <input name="area" autoComplete="address-level2" required minLength={2} maxLength={160} placeholder="উপজেলা / থানার নাম লিখুন" />
                    </label>
                    <label className="no-wide">
                      ইমেইল <small>(ঐচ্ছিক)</small>
                      <input name="email" type="email" autoComplete="email" maxLength={255} placeholder="name@example.com" />
                    </label>
                  </div>

                  <div className="no-payment">
                    <b>♧</b>
                    <div>
                      <strong>Cash on Delivery</strong>
                      <small>পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</small>
                    </div>
                    <span>✓</span>
                  </div>

                  <label className="no-consent">
                    <input name="privacyAcknowledged" type="checkbox" required />
                    <span>আমি <a href="/privacy" target="_blank" rel="noreferrer">গোপনীয়তা নীতি</a> পড়েছি এবং অর্ডার প্রসেসিং ও ডেলিভারির জন্য তথ্য ব্যবহারে সম্মত।</span>
                  </label>

                  <details className="no-marketing">
                    <summary>নতুন কালেকশন ও অফারের নোটিফিকেশন (ঐচ্ছিক)</summary>
                    {[['emailMarketingConsent', 'Email'], ['smsMarketingConsent', 'SMS'], ['whatsappMarketingConsent', 'WhatsApp']].map(([name, label]) => (
                      <label key={name}>
                        <input type="checkbox" name={name} />
                        {label}-এ অফার পেতে চাই
                      </label>
                    ))}
                  </details>
                </div>

                {/* STEP 5: Order Confirmation (Shows Mini Visual of Chosen Hijab & Perfume) */}
                {step === 4 && (
                  <div className="no-confirm-grid">
                    <div className="no-summary">
                      <h3>
                        অর্ডার সারাংশ
                        <button type="button" onClick={() => go(2)}>পরিবর্তন ↗</button>
                      </h3>

                      {/* Mini Visual Preview of the Selected Hijab & Perfume */}
                      <div className="no-confirm-items-visual">
                        <div className="no-confirm-item">
                          <div className="no-confirm-thumb">
                            <OrderImage src={orderArt(hijabProduct, activeHijab.sku)} alt={activeHijab.label || activeHijab.sku} />
                          </div>
                          <div className="no-confirm-text">
                            <small>সালাত হিজাব</small>
                            <strong>{activeHijab.label ? activeHijab.label.split('(')[0].trim() : activeHijab.sku}</strong>
                          </div>
                        </div>

                        <div className="no-confirm-plus" aria-hidden="true">+</div>

                        <div className="no-confirm-item">
                          <div className="no-confirm-thumb">
                            <OrderImage src={orderArt(perfumeProduct, activePerfume.sku)} alt={activePerfume.label || activePerfume.sku} />
                          </div>
                          <div className="no-confirm-text">
                            <small>পারফিউম</small>
                            <strong>{activePerfume.label ? activePerfume.label.split('(')[0].trim() : activePerfume.sku}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="no-confirm-bonus">
                        <span>🛍️ সিগনেচার টিউলিপ গিফট ব্যাগ অন্তর্ভুক্ত</span>
                      </div>

                      <dl>
                        <div><dt>প্যাকেজ</dt><dd>টিউলিপ গিফট সেট</dd></div>
                        <div><dt>পরিমাণ</dt><dd>{quantity}টি</dd></div>
                        <div><dt>ডেলিভারি পদ্ধতি</dt><dd>Cash on Delivery</dd></div>
                        <div><dt>ডেলিভারি চার্জ</dt><dd>{money(0)} (ফ্রি)</dd></div>
                        <div className="no-grand"><dt>মোট পরিশোধ</dt><dd>{money(amount)}</dd></div>
                      </dl>
                    </div>

                    <div className="no-summary">
                      <h3>আপনার তথ্য<button type="button" onClick={() => go(3)}>পরিবর্তন ↗</button></h3>
                      <dl>
                        {[['name', 'নাম'], ['phone', 'মোবাইল'], ['address', 'ঠিকানা'], ['district', 'জেলা'], ['area', 'উপজেলা / থানা']].map(([k, label]) => (
                          <div key={k}><dt>{label}</dt><dd>{customer[k]}</dd></div>
                        ))}
                      </dl>
                      {PHONE_OTP_REQUIRED && <p className="no-note">অর্ডার নিশ্চিত করতে মোবাইল নম্বর OTP দিয়ে যাচাই করতে হতে পারে।</p>}
                    </div>
                  </div>
                )}
              </fieldset>

              {step === 4 && PHONE_OTP_REQUIRED && <OrderOtp {...props} />}

              {(localError || catalogError || orderState.message) && (
                <div className="no-alert" role="status">
                  <p>{localError || catalogError || orderState.message}</p>
                  {orderState.publicId && <strong>অর্ডার নম্বর: {orderState.publicId}</strong>}
                  {orderState.preferencesUrl && <a href={orderState.preferencesUrl}>মার্কেটিং পছন্দ পরিবর্তন করুন</a>}
                </div>
              )}

              {/* Bottom Navigation Actions */}
              <div className="no-actions">
                <button
                  type="button"
                  className="no-back"
                  onClick={() => go(step - 1)}
                  disabled={step === 0 || busy || completed}
                >
                  ← পূর্ববর্তী
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    className="no-next"
                    onClick={(e) => {
                      e.preventDefault();
                      next();
                    }}
                    disabled={unavailable || busy}
                  >
                    পরবর্তী ধাপ →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="no-next"
                    data-track-cta="order_submit"
                    data-track-label="অর্ডার নিশ্চিত করুন"
                    disabled={unavailable || busy || completed}
                  >
                    {completed ? 'অর্ডার সফল হয়েছে ✓' : busy ? 'প্রক্রিয়া চলছে…' : 'অর্ডার নিশ্চিত করুন →'}
                  </button>
                )}
              </div>

              {step === 4 && <p className="no-secure">♧ নিরাপদ ও নির্ভরযোগ্য ক্যাশ অন ডেলিভারি সার্ভিস</p>}
            </div>
          </div>
        </form>
        <footer className="no-footer" />
      </div>
    </section>
  );
}
