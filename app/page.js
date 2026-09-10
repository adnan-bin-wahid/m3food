'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import NiyamahSections, {
  LuxuryHeader,
  LuxuryOrderSection,
  FaqSection,
  LuxuryFooter
} from '../components/niyamah';
import ScrollProgress from '../components/ScrollProgress';
import { trackBrowserCommerceEvent } from '../src/lib/client/analytics';
import { buildAttribution, clearBrowserTrackingKeys, getBrowserTrackingKeys, getFirstPartyTrackingKeys, selectDefaultVariant } from '../src/lib/client/checkout';
import { revokeMetaPixelConsent, trackMetaPixelEvent } from '../src/lib/client/pixel';
import { revokeGoogleConsent, trackGoogleCommerceEvent } from '../src/lib/client/google';
import { loadClarity, revokeClarityConsent, trackClarityEvent } from '../src/lib/client/clarity';
import { trackBrowserInteraction } from '../src/lib/client/interactions';
import { getPublicStoreSlug } from '../src/lib/client/store-runtime';
import { CURRENT_PRIVACY_POLICY_VERSION, readAnalyticsConsent, writeAnalyticsConsent } from '../src/lib/privacy/consent';

const storeSlug = getPublicStoreSlug();

const banglaPackLabels = ['১ পিস', '২ পিস', '৩ পিস', '৪ পিস', '৫ পিস'];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [quantity, setQuantity] = useState(1);
  const [pixelId, setPixelId] = useState('');
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [gtmContainerId, setGtmContainerId] = useState('');
  const [clarityProjectId, setClarityProjectId] = useState('');
  const [storeCurrency, setStoreCurrency] = useState('BDT');
  const [catalogSelection, setCatalogSelection] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [orderState, setOrderState] = useState({ status: 'idle', message: '', publicId: '', preferencesUrl: '' });
  const [otpState, setOtpState] = useState({ status: 'idle', challengeId: '', phone: '', code: '', token: '', message: '', devCode: '' });
  const [analyticsConsent, setAnalyticsConsent] = useState('unknown');
  const [consentReady, setConsentReady] = useState(false);
  const idempotencyKeyRef = useRef(null);
  const checkoutIntentKeyRef = useRef(null);
  const checkoutIntentTimerRef = useRef(null);
  const trackedCommerceEventsRef = useRef(new Set());
  const commerceEventIdsRef = useRef(new Map());
  const trackedInteractionViewsRef = useRef(new Set());
  const interactionEventIdsRef = useRef(new Map());

  const unitPrice = (catalogSelection?.variant.priceMinor ?? 125000) / 100;
  const regularUnitPrice = (catalogSelection?.variant.compareAtPriceMinor ?? 189000) / 100;
  const total = useMemo(() => unitPrice * quantity, [quantity, unitPrice]);
  const regularTotal = useMemo(() => regularUnitPrice * quantity, [quantity, regularUnitPrice]);
  const savings = Math.max(0, regularTotal - total);

  function trackEventOnce(key, eventName, selection = null, trackedQuantity = 1) {
    if (!consentReady) return;
    if (eventName !== 'PAGE_VIEW' && !selection) return;

    let eventId = commerceEventIdsRef.current.get(key);
    if (!eventId) {
      eventId = `web_${window.crypto.randomUUID()}`;
      commerceEventIdsRef.current.set(key, eventId);
    }
    const eventValue = selection ? selection.variant.priceMinor * trackedQuantity / 100 : undefined;
    const item = selection ? {
      id: selection.variant.sku,
      name: selection.product.name,
      price: selection.variant.priceMinor / 100,
      quantity: trackedQuantity
    } : undefined;

    trackMetaPixelEvent({
      pixelId,
      consent: analyticsConsent,
      eventName,
      eventId,
      dedupeKey: key,
      data: selection ? {
        content_ids: [selection.variant.sku],
        content_name: selection.product.name,
        content_type: 'product',
        value: eventValue,
        currency: storeCurrency,
        num_items: trackedQuantity
      } : {}
    });
    trackGoogleCommerceEvent({
      measurementId: ga4MeasurementId,
      containerId: gtmContainerId,
      consent: analyticsConsent,
      eventName,
      eventId,
      dedupeKey: key,
      pageUrl: window.location.href,
      referrer: document.referrer,
      currency: selection ? storeCurrency : undefined,
      value: eventValue,
      item
    });

    if (trackedCommerceEventsRef.current.has(key)) return;
    trackedCommerceEventsRef.current.add(key);
    void trackBrowserCommerceEvent(
      {
        storeSlug,
        eventName,
        analyticsAllowed: analyticsConsent === 'accepted',
        selection,
        quantity: trackedQuantity,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        eventId
      },
      {
        pageUrl: window.location.href,
        referrer: document.referrer,
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage,
        createUuid: () => window.crypto.randomUUID(),
        fetch: (input, init) => window.fetch(input, init)
      }
    ).then((accepted) => {
      if (!accepted) trackedCommerceEventsRef.current.delete(key);
    });
  }

  function interactionEnvironment() {
    return {
      pageUrl: window.location.href,
      referrer: document.referrer,
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage,
      createUuid: () => window.crypto.randomUUID(),
      fetch: (input, init) => window.fetch(input, init)
    };
  }

  function trackInteraction(eventName, metadata = {}, onceKey = '') {
    if (!consentReady) return;
    if (onceKey && trackedInteractionViewsRef.current.has(onceKey)) return;
    if (onceKey) trackedInteractionViewsRef.current.add(onceKey);

    let eventId = onceKey ? interactionEventIdsRef.current.get(onceKey) : null;
    if (!eventId) {
      eventId = `interaction_${window.crypto.randomUUID()}`;
      if (onceKey) interactionEventIdsRef.current.set(onceKey, eventId);
    }

    const clarityName = `${eventName.toLowerCase()}${metadata.elementKey ? `.${metadata.elementKey}` : metadata.sectionKey ? `.${metadata.sectionKey}` : metadata.scrollDepth ? `.${metadata.scrollDepth}` : ''}`;
    trackClarityEvent(clarityName, analyticsConsent);

    void trackBrowserInteraction({
      storeSlug,
      eventName,
      analyticsAllowed: analyticsConsent === 'accepted',
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      eventId,
      ...metadata
    }, interactionEnvironment()).then((accepted) => {
      if (!accepted && onceKey) trackedInteractionViewsRef.current.delete(onceKey);
    });
  }

  function getCheckoutTrackingContext() {
    const analyticsAllowed = analyticsConsent === 'accepted';

    const keys = getFirstPartyTrackingKeys(
      window.localStorage,
      window.sessionStorage,
      () => window.crypto.randomUUID(),
      analyticsAllowed
    );

    return {
      keys,
      attribution: buildAttribution(
        window.location.href,
        document.referrer,
        keys.visitorKey,
        keys.sessionKey,
        { includeClickIds: analyticsAllowed }
      )
    };
  }

  function scheduleCheckoutRecoveryCapture(formElement) {
    if (!catalogSelection || !formElement) return;
    const form = new FormData(formElement);
    if (form.get('privacyAcknowledged') !== 'on') return;

    const phone = String(form.get('phone') || '').trim();
    const email = String(form.get('email') || '').trim();
    const emailMarketingAllowed = form.get('emailMarketingConsent') === 'on';
    const smsMarketingAllowed = form.get('smsMarketingConsent') === 'on';
    const whatsappMarketingAllowed = form.get('whatsappMarketingConsent') === 'on';
    const hasConsentedEmail = emailMarketingAllowed && email.includes('@');
    const hasConsentedPhone = (smsMarketingAllowed || whatsappMarketingAllowed) && phone.length >= 7;
    if (!hasConsentedEmail && !hasConsentedPhone) return;

    if (checkoutIntentTimerRef.current) window.clearTimeout(checkoutIntentTimerRef.current);
    checkoutIntentTimerRef.current = window.setTimeout(() => {
      const { attribution } = getCheckoutTrackingContext();
      checkoutIntentKeyRef.current ??= `intent_${window.crypto.randomUUID()}`;
      void fetch('/api/v1/checkout-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          intentKey: checkoutIntentKeyRef.current,
          productId: catalogSelection.product.id,
          variantId: catalogSelection.variant.id,
          quantity,
          contact: {
            phone: phone || undefined,
            email: email || undefined
          },
          attribution,
          consent: {
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
            privacyAcknowledged: true,
            emailMarketingAllowed,
            smsMarketingAllowed,
            whatsappMarketingAllowed
          }
        })
      }).catch(() => undefined);
    }, 650);
  }


  useEffect(() => () => {
    if (checkoutIntentTimerRef.current) window.clearTimeout(checkoutIntentTimerRef.current);
  }, []);

  useEffect(() => {
    setAnalyticsConsent(readAnalyticsConsent(window.localStorage));
    setConsentReady(true);
  }, []);

  useEffect(() => {
    if (analyticsConsent !== 'accepted') {
      revokeMetaPixelConsent();
      revokeGoogleConsent();
      revokeClarityConsent();
    }
  }, [analyticsConsent]);

  useEffect(() => {
    if (analyticsConsent !== 'accepted' || !clarityProjectId) return;
    const keys = getBrowserTrackingKeys(window.localStorage, window.sessionStorage, () => window.crypto.randomUUID());
    loadClarity({
      projectId: clarityProjectId,
      consent: analyticsConsent,
      visitorKey: keys.visitorKey,
      sessionKey: keys.sessionKey,
      pageId: `${window.location.pathname}${window.location.hash || ''}`
    });
  }, [analyticsConsent, clarityProjectId, consentReady]);

  useEffect(() => {
    if (!consentReady) return;
    trackInteraction('SESSION_START', {}, 'session-start');

    const sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target;
        const sectionKey = element.id || element.getAttribute('data-track-section') || 'hero';
        trackInteraction('SECTION_VIEW', { sectionKey }, `section-view:${sectionKey}`);
      }
    }, { threshold: 0.35 });

    const sections = [...document.querySelectorAll('section[id]')];
    const hero = document.querySelector('.hero');
    if (hero) sections.unshift(hero);
    sections.forEach((element) => sectionObserver.observe(element));

    const ctaObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target;
        const elementKey = element.getAttribute('data-track-cta');
        if (!elementKey) continue;
        const elementLabel = element.getAttribute('data-track-label') || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 255) || elementKey;
        const sectionKey = element.closest('section')?.id || (element.closest('.hero') ? 'hero' : undefined);
        const targetUrl = element.getAttribute('href') || undefined;
        trackInteraction('CTA_VIEW', { elementKey, elementLabel, sectionKey, targetUrl }, `cta-view:${elementKey}`);
      }
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-track-cta]').forEach((element) => ctaObserver.observe(element));

    const clickHandler = (event) => {
      const element = event.target?.closest?.('[data-track-cta]');
      if (!element) return;
      const elementKey = element.getAttribute('data-track-cta');
      if (!elementKey) return;
      const elementLabel = element.getAttribute('data-track-label') || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 255) || elementKey;
      const sectionKey = element.closest('section')?.id || (element.closest('.hero') ? 'hero' : undefined);
      const targetUrl = element.getAttribute('href') || undefined;
      // A clicked CTA was necessarily visible to the user. Record the view first
      // if IntersectionObserver did not get a chance to do so (fast clicks, sticky CTA, etc.).
      trackInteraction('CTA_VIEW', { elementKey, elementLabel, sectionKey, targetUrl }, `cta-view:${elementKey}`);
      const normalizedTarget = String(targetUrl || '').toLowerCase();
      const eventName = normalizedTarget.includes('wa.me') || normalizedTarget.includes('whatsapp')
        ? 'WHATSAPP_CLICK'
        : normalizedTarget.includes('m.me') || normalizedTarget.includes('messenger')
          ? 'MESSENGER_CLICK'
          : 'CTA_CLICK';
      trackInteraction(eventName, { elementKey, elementLabel, sectionKey, targetUrl });
    };
    document.addEventListener('click', clickHandler, true);

    const milestones = [25, 50, 75, 90, 100];
    let frame = 0;
    const scrollHandler = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
        for (const milestone of milestones) {
          if (depth >= milestone) {
            trackInteraction('SCROLL_DEPTH', { scrollDepth: milestone }, `scroll:${milestone}`);
          }
        }
      });
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    scrollHandler();

    return () => {
      sectionObserver.disconnect();
      ctaObserver.disconnect();
      document.removeEventListener('click', clickHandler, true);
      window.removeEventListener('scroll', scrollHandler);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [analyticsConsent, clarityProjectId]);

  useEffect(() => {
    trackEventOnce('page-view', 'PAGE_VIEW');
  }, [analyticsConsent, consentReady, pixelId, ga4MeasurementId, gtmContainerId]);

  useEffect(() => {
    if (catalogSelection) {
      trackEventOnce('view-content', 'VIEW_CONTENT', catalogSelection);
    }
  }, [analyticsConsent, consentReady, catalogSelection, pixelId, ga4MeasurementId, gtmContainerId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const response = await fetch(`/api/v1/stores/${storeSlug}/catalog`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message || 'Catalog unavailable');

        const selection = selectDefaultVariant(payload.data);
        if (!selection) throw new Error('No active product variant');
        setPixelId(payload.data.store.metaPixelId || '');
        setGa4MeasurementId(payload.data.store.ga4MeasurementId || '');
        setGtmContainerId(payload.data.store.gtmContainerId || '');
        setClarityProjectId(payload.data.store.clarityProjectId || '');
        setStoreCurrency(payload.data.store.currency || 'BDT');
        setCatalogSelection(selection);
        setCatalogError('');
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setCatalogError('পণ্যের তথ্য লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      }
    }

    loadCatalog();
    return () => controller.abort();
  }, []);



  async function startPhoneOtp(phone) {
    setOtpState((current) => ({ ...current, status: 'sending', phone, token: '', message: 'OTP পাঠানো হচ্ছে…', devCode: '' }));
    const response = await fetch('/api/v1/phone-verifications/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeSlug, phone })
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.code === 'RESEND_COOLDOWN'
        ? 'নতুন OTP পাঠানোর আগে কিছুক্ষণ অপেক্ষা করুন।'
        : payload?.error?.code === 'RATE_LIMITED'
          ? 'অনেকবার OTP চাওয়া হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : payload?.error?.code === 'OTP_DELIVERY_UNAVAILABLE'
            ? 'OTP পাঠানো যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'মোবাইল নম্বরটি যাচাই করা যায়নি। সঠিক বাংলাদেশি নম্বর দিন।';
      setOtpState((current) => ({ ...current, status: 'error', message }));
      return false;
    }
    setOtpState({
      status: 'awaiting',
      challengeId: payload.data.challengeId,
      phone: payload.data.phone,
      code: '',
      token: '',
      message: `${payload.data.maskedPhone} নম্বরে ৬ সংখ্যার OTP পাঠানো হয়েছে।`,
      devCode: payload.data.devCode || ''
    });
    return true;
  }

  async function verifyPhoneOtp() {
    if (!otpState.challengeId || !otpState.phone || otpState.code.length !== 6) {
      setOtpState((current) => ({ ...current, status: 'error', message: '৬ সংখ্যার OTP লিখুন।' }));
      return;
    }
    setOtpState((current) => ({ ...current, status: 'verifying', message: 'OTP যাচাই হচ্ছে…' }));
    const response = await fetch('/api/v1/phone-verifications/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeSlug,
        phone: otpState.phone,
        challengeId: otpState.challengeId,
        code: otpState.code
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.code === 'INVALID_OTP'
        ? `OTP সঠিক নয়।${typeof payload?.error?.attemptsRemaining === 'number' ? ` বাকি চেষ্টা: ${payload.error.attemptsRemaining}` : ''}`
        : payload?.error?.code === 'OTP_EXPIRED'
          ? 'OTP-এর সময় শেষ হয়েছে। নতুন OTP নিন।'
          : payload?.error?.code === 'OTP_LOCKED'
            ? 'এই OTP আর ব্যবহার করা যাবে না। নতুন OTP নিন।'
            : 'OTP যাচাই করা যায়নি। আবার চেষ্টা করুন।';
      setOtpState((current) => ({ ...current, status: 'error', token: '', message }));
      return;
    }
    setOtpState((current) => ({
      ...current,
      status: 'verified',
      token: payload.data.verificationToken,
      phone: payload.data.phone,
      message: '✓ মোবাইল নম্বর যাচাই হয়েছে। এখন অর্ডার নিশ্চিত করুন।',
      devCode: ''
    }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!catalogSelection || !catalogSelection.variant.inStock || orderState.status === 'loading' || orderState.status === 'success') return;

    const form = new FormData(event.currentTarget);
    const rawPhone = String(form.get('phone') || '').trim();
    if (!otpState.token) {
      try {
        await startPhoneOtp(rawPhone);
        setOrderState({ status: 'idle', message: '', publicId: '', preferencesUrl: '' });
      } catch {
        setOtpState((current) => ({ ...current, status: 'error', message: 'OTP পাঠানো যায়নি। আবার চেষ্টা করুন।' }));
      }
      return;
    }
    const { attribution } = getCheckoutTrackingContext();
    const emailMarketingAllowed = form.get('emailMarketingConsent') === 'on';
    const smsMarketingAllowed = form.get('smsMarketingConsent') === 'on';
    const whatsappMarketingAllowed = form.get('whatsappMarketingConsent') === 'on';
    trackEventOnce('begin-checkout', 'BEGIN_CHECKOUT', catalogSelection, quantity);
    idempotencyKeyRef.current ??= `checkout_${window.crypto.randomUUID()}`;
    setOrderState({ status: 'loading', message: 'আপনার অর্ডারটি নিরাপদভাবে সংরক্ষণ করা হচ্ছে…', publicId: '', preferencesUrl: '' });

    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current
        },
        body: JSON.stringify({
          storeSlug,
          variantId: catalogSelection.variant.id,
          quantity,
          customer: {
            name: String(form.get('name') || ''),
            phone: String(form.get('phone') || ''),
            email: String(form.get('email') || '').trim() || undefined
          },
          shippingAddress: {
            addressLine1: String(form.get('address') || ''),
            district: String(form.get('district') || '')
          },
          phoneVerificationToken: otpState.token,
          consent: {
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
            analyticsAllowed: analyticsConsent === 'accepted',
            emailMarketingAllowed,
            smsMarketingAllowed,
            whatsappMarketingAllowed
          },
          attribution
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload?.error?.code;
        const message = code === 'RATE_LIMITED'
          ? 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : code === 'OUT_OF_STOCK' || code === 'VARIANT_NOT_AVAILABLE'
            ? 'পণ্যটি বর্তমানে অর্ডারের জন্য পাওয়া যাচ্ছে না।'
            : code === 'PHONE_VERIFICATION_REQUIRED'
              ? 'মোবাইল OTP verification-এর সময় শেষ হয়েছে। আবার OTP নিয়ে চেষ্টা করুন।'
              : code === 'RECENT_DUPLICATE_ORDER'
                ? 'একই নম্বর ও ঠিকানায় সাম্প্রতিক একটি অর্ডার ইতোমধ্যে আছে।'
                : 'অর্ডারটি সম্পন্ন করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।';
        throw new Error(message);
      }

      trackMetaPixelEvent({
        pixelId,
        consent: analyticsConsent,
        eventName: 'PURCHASE',
        eventId: payload.data.publicId,
        dedupeKey: `purchase:${payload.data.publicId}`,
        data: {
          content_ids: [catalogSelection.variant.sku],
          content_type: 'product',
          value: payload.data.totalMinor / 100,
          currency: storeCurrency,
          num_items: quantity
        }
      });
      trackGoogleCommerceEvent({
        measurementId: ga4MeasurementId,
        containerId: gtmContainerId,
        consent: analyticsConsent,
        eventName: 'PURCHASE',
        eventId: payload.data.publicId,
        dedupeKey: `purchase:${payload.data.publicId}`,
        pageUrl: window.location.href,
        referrer: document.referrer,
        transactionId: payload.data.publicId,
        value: payload.data.totalMinor / 100,
        currency: storeCurrency,
        item: {
          id: catalogSelection.variant.sku,
          name: catalogSelection.product.name,
          price: catalogSelection.variant.priceMinor / 100,
          quantity
        }
      });
      idempotencyKeyRef.current = null;
      setOtpState({ status: 'idle', challengeId: '', phone: '', code: '', token: '', message: '', devCode: '' });
      setOrderState({
        status: 'success',
        message: 'আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।',
        publicId: payload.data.publicId,
        preferencesUrl: payload.data.preferencesUrl || ''
      });
    } catch (error) {
      setOrderState({
        status: 'error',
        message: error instanceof Error ? error.message : 'অর্ডারটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
        publicId: '',
        preferencesUrl: ''
      });
    }
  }

  function chooseAnalyticsConsent(preference) {
    writeAnalyticsConsent(window.localStorage, preference);

    if (preference === 'declined') {
      revokeMetaPixelConsent();
      revokeGoogleConsent();
      revokeClarityConsent();
      clearBrowserTrackingKeys(window.localStorage, window.sessionStorage);
      checkoutIntentKeyRef.current = null;
    }

    setAnalyticsConsent(preference);
  }

  return (
    <main id="top" className="niyamah-copy w-full min-h-screen bg-[#08110c] text-[#f8f1e3] pt-20">
      <ScrollProgress />

      <LuxuryHeader />

      <NiyamahSections />

      <LuxuryOrderSection
        catalogSelection={catalogSelection}
        catalogError={catalogError}
        quantity={quantity}
        setQuantity={setQuantity}
        regularUnitPrice={regularUnitPrice}
        unitPrice={unitPrice}
        regularTotal={regularTotal}
        total={total}
        savings={savings}
        banglaPackLabels={banglaPackLabels}
        orderState={orderState}
        setOrderState={setOrderState}
        otpState={otpState}
        setOtpState={setOtpState}
        startPhoneOtp={startPhoneOtp}
        verifyPhoneOtp={verifyPhoneOtp}
        submitOrder={submitOrder}
        scheduleCheckoutRecoveryCapture={scheduleCheckoutRecoveryCapture}
        idempotencyKeyRef={idempotencyKeyRef}
        trackEventOnce={trackEventOnce}
      />

      <FaqSection />

      <LuxuryFooter onManageTracking={() => chooseAnalyticsConsent('unknown')} />


      {consentReady && analyticsConsent === 'unknown' && (
        <aside className="consent-banner" role="dialog" aria-modal="false" aria-labelledby="consent-title">
          <div>
            <span>আপনার গোপনীয়তা</span>
            <h2 id="consent-title">Optional analytics চালু করবেন?</h2>
            <p>Page/CTA/section/scroll-এর privacy-reduced First-party measurement সবসময় চালু থাকে, তবে এতে form value বা customer PII analytics-এ পাঠানো হয় না। অনুমতি দিলে Meta, Google ও Clarity-এর configured optional analytics/advertising tools চালু হতে পারে। অর্ডার দিতে এই অনুমতি বাধ্যতামূলক নয়। <a href="/privacy">বিস্তারিত পড়ুন</a></p>
          </div>
          <div className="consent-actions">
            <button type="button" className="consent-essential" onClick={() => chooseAnalyticsConsent('declined')}>শুধু First-party</button>
            <button type="button" className="consent-accept" onClick={() => chooseAnalyticsConsent('accepted')}>Meta / Google / Clarity অনুমতি দিন</button>
          </div>
        </aside>
      )}
    </main>
  );
}
