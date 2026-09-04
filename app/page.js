'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import AmbientCanvas from '../components/AmbientCanvas';
import HeroVisual from '../components/HeroVisual';
import Reveal from '../components/Reveal';
import ScrollProgress from '../components/ScrollProgress';
import ReviewMarquee from '../components/ReviewMarquee';
import { buildAttribution, getOrCreateTrackingKey, selectDefaultVariant } from '../src/lib/client/checkout';

const storeSlug = 'm3food';

const nav = [
  ['শুরু', '#top'],
  ['স্বাদের যাত্রা', '#experience'],
  ['স্বাদ চ্যালেঞ্জ', '#challenge'],
  ['কেন আলাদা', '#why'],
  ['গণমাধ্যমে', '#media'],
  ['গ্রাহকের মতামত', '#reviews'],
  ['অর্ডার', '#order'],
  ['যোগাযোগ', '#contact']
];

const customerVideos = [
  ['https://player.vimeo.com/video/1218848051', 'গ্রাহকের ভিডিও রিভিউ ১'],
  ['https://player.vimeo.com/video/1218856834', 'গ্রাহকের ভিডিও রিভিউ ২'],
  ['https://player.vimeo.com/video/1218858126', 'গ্রাহকের ভিডিও রিভিউ ৩'],
  ['https://player.vimeo.com/video/1218859136', 'গ্রাহকের ভিডিও রিভিউ ৪']
];

const banglaPackLabels = ['১ প্যাক', '২ প্যাক', '৩ প্যাক', '৪ প্যাক', '৫ প্যাক'];

const faqs = [
  ['চুইঝাল মিষ্টি মসলা কী?', 'খুলনার পরিচিত চুইঝাল, মিছরি ও নির্বাচিত মসলার স্বাদকে একসঙ্গে এনে তৈরি M3Food চুইঝাল মিষ্টি মসলা। এর সবচেয়ে আলাদা দিক হলো—একই কামড়ে মিষ্টি, চুইঝালের ঝাঁঝ এবং শেষে সতেজ অনুভূতির তিন ধাপের স্বাদ।'],
  ['অফার মূল্য কত?', 'নিয়মিত মূল্যের পাশে লাল কাটা পুরোনো মূল্য এবং বর্তমান বিশেষ অফার মূল্য পুরো পেজজুড়ে দেখানো আছে। প্রতি প্যাকে সরাসরি সাশ্রয় ৬৪০ টাকা।'],
  ['সারা বাংলাদেশে ডেলিভারি আছে?', 'হ্যাঁ, বাংলাদেশজুড়ে ফ্রি হোম ডেলিভারির সুবিধা আছে। অর্ডার নিশ্চিত করার সময় ঠিকানা ও ডেলিভারি তথ্য যাচাই করে নিন।'],
  ['কীভাবে অর্ডার করব?', 'এই পেজের অর্ডার অংশে আপনার নাম, মোবাইল নম্বর, ঠিকানা ও পরিমাণ নির্বাচন করুন। এরপর “অর্ডার সম্পন্ন করুন” বোতাম থেকে অর্ডার নিশ্চিত করার ধাপে যেতে পারবেন।'],
  ['কীভাবে খেতে হবে?', 'অল্প পরিমাণ দিয়ে শুরু করুন, ধীরে ধীরে ভালোভাবে চিবিয়ে স্বাদ নিন এবং নিজের ঝাল সহ্যক্ষমতা বিবেচনা করুন। প্যাকেটের ব্যবহারবিধি ও উপাদান তালিকাকে অগ্রাধিকার দিন।'],
  ['কীভাবে সংরক্ষণ করব?', 'প্যাকেট ভালোভাবে বন্ধ রাখুন এবং সরাসরি রোদ, আর্দ্রতা ও অতিরিক্ত তাপ থেকে দূরে রাখুন। দীর্ঘ সময় সতেজ রাখতে প্যাকেটের সংরক্ষণ নির্দেশনা অনুসরণ করুন।']
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafMark() {
  return (
    <span className="leaf-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <path d="M39.7 7.8C27.3 8 16.2 12.7 12.4 24.3c-2.3 7.1.8 13.4.8 13.4 1.7-8.2 7.3-14.6 16.7-19.1-8.2 5.9-12.6 12.2-13.7 19.2 7.7-1.1 13.6-4.4 17.7-9.7 5-6.5 5.8-14.6 5.8-20.3Z" fill="currentColor" />
      </svg>
    </span>
  );
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="M3Food হোম">
      <span className="brand-m">M3</span><span className="brand-food">Food</span><LeafMark />
    </a>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function TasteStep({ number, title, time, copy, type, icon }) {
  return (
    <article className={`taste-card taste-${type}`}>
      <div className="taste-card-top">
        <span>{number}</span>
        <i>{time}</i>
      </div>
      <div className="taste-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function BenefitIcon({ children }) {
  return <div className="benefit-icon">{children}</div>;
}

function VideoEmbed({ src, title, label, featured = false }) {
  return (
    <article className={`video-frame-card ${featured ? 'is-featured' : ''}`}>
      <div className="video-frame-top">
        <span><i />{label}</span>
        <b>ভিডিও</b>
      </div>
      <div className="video-frame">
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </article>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeVideo, setActiveVideo] = useState(0);
  const [catalogSelection, setCatalogSelection] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [orderState, setOrderState] = useState({ status: 'idle', message: '', publicId: '' });
  const idempotencyKeyRef = useRef(null);

  const unitPrice = (catalogSelection?.variant.priceMinor ?? 125000) / 100;
  const regularUnitPrice = (catalogSelection?.variant.compareAtPriceMinor ?? 189000) / 100;
  const total = useMemo(() => unitPrice * quantity, [quantity, unitPrice]);
  const regularTotal = useMemo(() => regularUnitPrice * quantity, [quantity, regularUnitPrice]);
  const savings = Math.max(0, regularTotal - total);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

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


  async function submitOrder(event) {
    event.preventDefault();
    if (!catalogSelection || !catalogSelection.variant.inStock || orderState.status === 'loading' || orderState.status === 'success') return;

    const form = new FormData(event.currentTarget);
    const visitorKey = getOrCreateTrackingKey(
      window.localStorage,
      'm3food_visitor_key',
      'visitor',
      () => window.crypto.randomUUID()
    );
    const sessionKey = getOrCreateTrackingKey(
      window.sessionStorage,
      'm3food_session_key',
      'session',
      () => window.crypto.randomUUID()
    );
    idempotencyKeyRef.current ??= `checkout_${window.crypto.randomUUID()}`;
    setOrderState({ status: 'loading', message: 'আপনার অর্ডারটি নিরাপদভাবে সংরক্ষণ করা হচ্ছে…', publicId: '' });

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
            phone: String(form.get('phone') || '')
          },
          shippingAddress: {
            addressLine1: String(form.get('address') || ''),
            district: String(form.get('district') || '')
          },
          attribution: buildAttribution(
            window.location.href,
            document.referrer,
            visitorKey,
            sessionKey
          )
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload?.error?.code;
        const message = code === 'RATE_LIMITED'
          ? 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : code === 'OUT_OF_STOCK' || code === 'VARIANT_NOT_AVAILABLE'
            ? 'পণ্যটি বর্তমানে অর্ডারের জন্য পাওয়া যাচ্ছে না।'
            : 'অর্ডারটি সম্পন্ন করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।';
        throw new Error(message);
      }

      idempotencyKeyRef.current = null;
      setOrderState({
        status: 'success',
        message: 'আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।',
        publicId: payload.data.publicId
      });
    } catch (error) {
      setOrderState({
        status: 'error',
        message: error instanceof Error ? error.message : 'অর্ডারটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
        publicId: ''
      });
    }
  }

  return (
    <main id="top">
      <ScrollProgress />

      <header className="site-header">
        <div className="header-inner page-shell">
          <Brand />
          <nav className="desktop-nav" aria-label="প্রধান নেভিগেশন">
            {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <a className="nav-order order-pulse" href="#order">
            <span className="nav-order-price"><del>৳১,৮৯০</del><strong>৳১,২৫০</strong></span>
            <b>অর্ডার করুন</b><span className="cta-arrow"><ArrowIcon /></span>
          </a>
          <button className={`menu-toggle ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="মেনু খুলুন" aria-expanded={menuOpen}>
            <span /><span />
          </button>
          <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
            {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          </div>
        </div>
      </header>

      <section className="hero section-dark">
        <AmbientCanvas />
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-grid page-shell">
          <div className="hero-copy">
            <Reveal>
              <div className="eyebrow"><span className="eyebrow-dot" /> খুলনার চুইঝাল • মিষ্টি, ঝাল ও সতেজতার অভিনব স্বাদ</div>
            </Reveal>
            <Reveal delay={70}>
              <h1>চুইঝালের ঝাঁঝ,<br /><em>মসলার সুবাস</em><br />আর মিষ্টির স্বাদ।</h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="hero-lede">খুলনার চুইঝালের স্বকীয় ঝাঁঝ, মিছরির মিষ্টতা আর নির্বাচিত মসলার সুবাস—সব মিলিয়ে এক প্যাকেই তিন ধাপের ব্যতিক্রমী স্বাদ। ঘরে, ভ্রমণে বা প্রিয়জনকে উপহার দিতে—সহজেই উপভোগ করুন।</p>
            </Reveal>
            <Reveal delay={210}>
              <div className="hero-offer-flash"><span>বিশেষ অফার</span><del>৳১,৮৯০</del><strong>৳১,২৫০</strong><b>সাশ্রয় ৳৬৪০</b></div>
              <div className="hero-actions hero-actions-simple">
                <a className="button button-ghost hero-discover-button" href="#experience">স্বাদের যাত্রা দেখুন <ArrowIcon /></a>
              </div>
            </Reveal>
            <Reveal delay={280}>
              <div className="hero-stats">
                <Stat value="৪.৯" label="গ্রাহক মূল্যায়ন" />
                <Stat value="১.৬০ লক্ষ+" label="সন্তুষ্ট গ্রাহক" />
                <div className="stat stat-offer"><span className="stat-price-pair"><del>৳১,৮৯০</del><strong>৳১,২৫০</strong></span><span>বিশেষ অফার</span></div>
              </div>
            </Reveal>
          </div>
          <Reveal className="hero-visual-wrap" delay={100}>
            <HeroVisual />
          </Reveal>
        </div>
        <div className="hero-bottom-line page-shell">
          <span>নিচে দেখুন</span><i /><span>চুইঝাল • মিষ্টি • ঝাল • সতেজ অনুভূতি</span>
        </div>
      </section>

      <section className="trust-strip" aria-label="বিশ্বাসের তথ্য">
        <div className="page-shell trust-strip-grid">
          <div><b>✓</b><span>সারা বাংলাদেশে ফ্রি হোম ডেলিভারি</span></div>
          <div><b>✦</b><span>খুলনার ঐতিহ্যবাহী চুইঝাল</span></div>
          <div><b>☎</b><span>হটলাইন: ০৯৬১৩-২৪০২৪০</span></div>
          <div><b>★</b><span>৪.৯ গ্রাহক মূল্যায়ন</span></div>
        </div>
      </section>

      <section className="experience section-cream" id="experience">
        <div className="page-shell section-heading split-heading">
          <Reveal>
            <div className="section-tag"><span>০১</span> স্বাদের অভিজ্ঞতা</div>
            <h2>একই পণ্যে<br /><em>তিন ধাপের অনুভূতি</em></h2>
          </Reveal>
          <Reveal delay={90} className="section-heading-copy">
            <p>এক কামড়ে স্বাদ বদলায় ধাপে ধাপে—প্রথমে মিছরির নরম মিষ্টতা, এরপর চুইঝালের স্বকীয় ঝাঁঝ, আর শেষে আসে হালকা সতেজ অনুভূতি। এটাই M3Food-এর সবচেয়ে মনে থাকার মতো স্বাদ-অভিজ্ঞতা।</p>
          </Reveal>
        </div>

        <div className="page-shell taste-grid">
          <Reveal><TasteStep number="০১" time="শুরু" title="মিষ্টির ছোঁয়া" copy="প্রথমে আসে নরম মিষ্টি স্বাদের অনুভূতি।" type="sweet" icon="✦" /></Reveal>
          <Reveal delay={70}><TasteStep number="০২" time="পরের ধাপ" title="চুইঝালের ঝাল" copy="এরপর পরিচিত চুইঝালের ঝাঁঝ ও উষ্ণতা।" type="heat" icon="⌁" /></Reveal>
          <Reveal delay={140}><TasteStep number="০৩" time="শেষ ধাপ" title="ঠান্ডা অনুভূতি" copy="শেষে আসে হালকা সতেজ ও ঠান্ডা অনুভূতি।" type="cool" icon="❄" /></Reveal>
        </div>
      </section>

      <section className="challenge section-dark" id="challenge">
        <div className="page-shell challenge-grid">
          <Reveal className="challenge-visual">
            <div className="challenge-card">
              <Image src="/media/challenge-infographic.webp" alt="M3Food পাঁচ মিনিটের স্বাদ-চ্যালেঞ্জ" fill sizes="(max-width: 900px) 92vw, 46vw" className="cover-image" />
              <div className="challenge-card-shade" />
              <span className="challenge-badge">M3Food স্বাদ-চ্যালেঞ্জ</span>
            </div>
          </Reveal>

          <div className="challenge-copy">
            <Reveal><div className="section-tag light"><span>০২</span> পাঁচ মিনিটের স্বাদ-চ্যালেঞ্জ</div></Reveal>
            <Reveal delay={60}><h2>৩০ সেকেন্ডে তিন স্বাদ।<br /><em>তারপর ৫ মিনিটের চ্যালেঞ্জ।</em></h2></Reveal>
            <Reveal delay={120}><p>চোখ বন্ধ করে একটি ছোট টুকরা ধীরে ধীরে চিবিয়ে দেখুন—কত দ্রুত মিষ্টি থেকে ঝাল, আর ঝাল থেকে সতেজ অনুভূতিতে স্বাদ বদলে যায়। কয়েক মিনিট সময় নিয়ে তিন ধাপের এই স্বাদ-যাত্রাটাই উপভোগ করুন।</p></Reveal>
            <Reveal delay={180}>
              <div className="challenge-steps">
                <div><b>০–১০</b><span><strong>মিষ্টি শুরু</strong><small>প্রথম ধাপের স্বাদ</small></span></div>
                <div><b>১০–২৫</b><span><strong>ঝাল প্রকাশ</strong><small>চুইঝালের ঝাঁঝ</small></span></div>
                <div><b>২৫–৩০</b><span><strong>ঠান্ডা অনুভূতি</strong><small>শেষ ধাপের অভিজ্ঞতা</small></span></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="heritage section-forest" id="why">
        <div className="page-shell heritage-grid">
          <Reveal className="heritage-visual">
            <div className="heritage-image-card">
              <Image src="/media/ingredients-studio.webp" alt="খাঁটি চুইঝাল, গোল মরিচ ও মিছরির সঙ্গে M3Food চুইঝাল মিষ্টি মসলা" fill sizes="(max-width: 900px) 92vw, 46vw" className="cover-image" />
              <div className="heritage-overlay" />
              <div className="heritage-stamp"><span>খুলনা</span><b>ঐতিহ্যের স্বাদ</b></div>
            </div>
          </Reveal>

          <div className="heritage-copy">
            <Reveal><div className="section-tag light"><span>০৩</span> কেন M3Food আলাদা</div></Reveal>
            <Reveal delay={70}><h2>পরিচিত চুইঝালকে<br /><em>নতুন এক রূপে</em> উপস্থাপন।</h2></Reveal>
            <Reveal delay={130}><p>চুইঝাল খুলনা অঞ্চলের বহুল পরিচিত একটি মসলা। M3Food সেই স্থানীয় স্বাদকে মিষ্টি মসলার একটি আলাদা পণ্য-অভিজ্ঞতায় এনেছে—যেখানে স্বাদ, সুবাস, ব্যবহারযোগ্যতা এবং আধুনিক প্যাকেজিং—সবকিছু একসঙ্গে একটি সম্পূর্ণ অভিজ্ঞতা তৈরি করে।</p></Reveal>
            <Reveal delay={190}>
              <div className="reason-list">
                <div><b>০১</b><span><strong>খুলনার স্বাদের পরিচয়</strong><small>ঐতিহ্যবাহী চুইঝালকে কেন্দ্র করে পণ্যটি তৈরি।</small></span></div>
                <div><b>০২</b><span><strong>তিন ধাপের স্বাদ-ধারণা</strong><small>মিষ্টি, ঝাল ও শেষে ঠান্ডা অনুভূতির ব্র্যান্ড অভিজ্ঞতা।</small></span></div>
                <div><b>০৩</b><span><strong>আধুনিক প্যাকেজিং</strong><small>সহজে বহন, সংরক্ষণ এবং উপহার দেওয়ার মতো প্রেজেন্টেশন।</small></span></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="benefits section-cream" id="features">
        <div className="benefit-orb benefit-orb-a" />
        <div className="benefit-orb benefit-orb-b" />
        <div className="page-shell section-heading centered-heading benefits-heading">
          <Reveal>
            <div className="section-tag"><span>০৪</span> কেন পছন্দ করবেন</div>
            <h2>M3Food চুইঝাল মিষ্টি মসলা<br /><em>কেন এতটা আলাদা?</em></h2>
            <p>খুলনার চুইঝালের স্বকীয় ঝাঁঝ, মিছরির মিষ্টতা, নির্বাচিত মসলার সুবাস এবং ব্যবহারবান্ধব টিউব প্যাক—সবকিছু মিলিয়ে এটি শুধু একটি মসলা নয়, বরং ধাপে ধাপে বদলে যাওয়া একটি পূর্ণ স্বাদ-অভিজ্ঞতা।</p>
          </Reveal>
        </div>

        <div className="page-shell feature-showcase-grid">
          <Reveal className="feature-card feature-card-large feature-card-green">
            <div className="feature-symbol">🌿</div>
            <span className="feature-kicker">খুলনার স্বাদ-ঐতিহ্য</span>
            <h3>চুইঝালের<br />স্বকীয় ঝাঁঝ ও সুবাস</h3>
            <p>খুলনার পরিচিত চুইঝালের ঝাঁঝ ও সুবাসই এই পণ্যের মূল চরিত্র—যা প্রতিটি কামড়ে আলাদা একটি স্বাদ-পরিচয় তৈরি করে।</p>
            <div className="feature-highlight-badges">
              <span>✦ খুলনার খাঁটি চুইঝাল</span>
              <span>🌿 ১০০% প্রাকৃতিক স্বাদ</span>
            </div>
            <i className="feature-line" />
            <div className="feature-card-product" aria-hidden="true"><Image src="/media/hero-premium-transparent.png" alt="" fill sizes="230px" /></div>
          </Reveal>

          <Reveal delay={55} className="feature-card feature-card-taste feature-card-taste-premium">
            <div className="taste-premium-head">
              <div className="feature-symbol">✦</div>
              <div>
                <span className="feature-kicker">এক কামড়ে তিন ধাপ</span>
                <h3>মিষ্টি থেকে ঝাল,
                  <br />শেষে সতেজতার ছোঁয়া</h3>
              </div>
            </div>
            <p className="taste-premium-copy">একই কামড়ে স্বাদ ধীরে ধীরে বদলায়—শুরুতে মিছরির নরম মিষ্টতা, তারপর চুইঝালের স্বকীয় ঝাঁঝ, আর শেষে হালকা সতেজ অনুভূতি। এই তিন স্তরের পরিবর্তনই M3Food-এর স্বাদকে মনে রাখার মতো করে তোলে।</p>
            <div className="taste-journey" aria-label="তিন ধাপের স্বাদ-যাত্রা">
              <div className="taste-journey-line" aria-hidden="true" />
              <div className="taste-journey-step taste-journey-sweet">
                <span className="taste-step-index">০১</span>
                <i>✦</i>
                <b>মিষ্টি</b>
                <small>নরম শুরু</small>
              </div>
              <div className="taste-journey-step taste-journey-hot">
                <span className="taste-step-index">০২</span>
                <i>⌁</i>
                <b>ঝাল</b>
                <small>চুইঝালের ঝাঁঝ</small>
              </div>
              <div className="taste-journey-step taste-journey-fresh">
                <span className="taste-step-index">০৩</span>
                <i>❄</i>
                <b>সতেজ</b>
                <small>হালকা ঠান্ডা অনুভূতি</small>
              </div>
            </div>
          </Reveal>

          <Reveal delay={95} className="feature-card feature-card-ingredients">
            <div className="feature-symbol">◌</div>
            <span className="feature-kicker">স্বাদের ভারসাম্য</span>
            <h3>চুইঝাল, মিছরি<br />ও নির্বাচিত মসলা</h3>
            <p>চুইঝালের তীব্রতাকে মিছরির মিষ্টতা ও নির্বাচিত মসলার সুবাসের সঙ্গে মিলিয়ে স্বাদটিকে করা হয়েছে স্তরযুক্ত ও উপভোগ্য।</p>
            <div className="ingredient-chips"><span>চুইঝাল</span><span>মিছরি</span><span>নির্বাচিত মসলা</span></div>
          </Reveal>

          <Reveal delay={135} className="feature-card feature-card-packaging">
            <div className="feature-symbol">⌁</div>
            <span className="feature-kicker">ব্যবহারবান্ধব প্যাক</span>
            <h3>খুলুন, নিন,<br />আবার বন্ধ রাখুন</h3>
            <p>টিউব প্যাকটি বহন ও সংরক্ষণে সুবিধাজনক—ঘরে, অফিসে বা ভ্রমণে প্রয়োজনমতো নিয়ে আবার সহজেই বন্ধ করে রাখা যায়।</p>
          </Reveal>

          <Reveal delay={175} className="feature-card feature-card-serve">
            <div className="feature-symbol">✣</div>
            <span className="feature-kicker">মুহূর্তকে করুন আলাদা</span>
            <h3>আড্ডা, ভ্রমণ<br />বা উপহারে মানানসই</h3>
            <p>বন্ধুদের আড্ডা, ভ্রমণের বিরতি, অতিথি আপ্যায়ন কিংবা ভিন্নধর্মী উপহার—বিভিন্ন মুহূর্তে সহজে মানিয়ে যায়।</p>
          </Reveal>

          <Reveal delay={215} className="feature-card feature-card-fresh">
            <div className="feature-symbol">❋</div>
            <span className="feature-kicker">পরিপাটি ব্যবহার</span>
            <h3>সহজ সংরক্ষণ,<br />গুছানো পরিবেশন</h3>
            <p>প্রয়োজনমতো পরিমাণ নেওয়া যায় এবং ব্যবহার শেষে টিউব বন্ধ করে রাখা যায়—তাই পরিবেশন ও সংরক্ষণ দুটোই থাকে পরিপাটি।</p>
          </Reveal>
        </div>

      </section>

      <section className="ritual section-sand">
        <div className="page-shell ritual-grid">
          <div className="ritual-copy">
            <Reveal><div className="section-tag"><span>০৫</span> ব্যবহার ও সংরক্ষণ</div></Reveal>
            <Reveal delay={60}><h2>পণ্যটি উপভোগ করুন<br /><em>নিজের স্বাচ্ছন্দ্যে</em></h2></Reveal>
            <Reveal delay={120}><p>টিউব খুলে অল্প পরিমাণ নিন, ধীরে ধীরে চিবিয়ে তিন ধাপের স্বাদ অনুভব করুন। নিজের ঝাল সহ্যক্ষমতা বিবেচনা করুন এবং পরিমাণ ও সংরক্ষণের ক্ষেত্রে প্যাকেটের নির্দেশনা অনুসরণ করুন।</p></Reveal>
            <Reveal delay={170}>
              <div className="ritual-points">
                <div><b>১</b><span><strong>ভালোভাবে চিবিয়ে স্বাদ নিন</strong><small>অল্প পরিমাণ নিয়ে ধীরে ধীরে ভালোভাবে চিবিয়ে স্বাদ নিন।</small></span></div>
                <div><b>২</b><span><strong>ঝাল সহ্যক্ষমতা বিবেচনা করুন</strong><small>চুইঝালের ঝাঁঝ ব্যক্তিভেদে ভিন্ন লাগতে পারে।</small></span></div>
                <div><b>৩</b><span><strong>সঠিকভাবে সংরক্ষণ করুন</strong><small>টিউব ভালোভাবে বন্ধ রাখুন এবং প্যাকেটের সংরক্ষণ নির্দেশনা অনুসরণ করুন।</small></span></div>
              </div>
            </Reveal>
          </div>
          <Reveal className="ritual-visual" delay={80}>
            <div className="ritual-photo large"><Image src="/media/product-table.webp" alt="টেবিলে M3Food চুইঝাল মিষ্টি মসলা" fill sizes="(max-width: 900px) 92vw, 42vw" className="cover-image" /></div>
            <div className="ritual-photo small"><Image src="/media/fridge-storage.webp" alt="ফ্রিজে সংরক্ষিত M3Food পণ্য" fill sizes="240px" className="cover-image" /></div>
            <div className="ritual-label"><b>মিষ্টি</b><i>→</i><b>ঝাল</b><i>→</i><b>ঠান্ডা</b></div>
          </Reveal>
        </div>
      </section>

      <section className="media-report section-media" id="media">
        <div className="media-orb media-orb-one" />
        <div className="media-orb media-orb-two" />
        <div className="page-shell media-report-grid">
          <div className="media-report-copy">
            <Reveal><div className="section-tag"><span>০৬</span> গণমাধ্যমে M3Food</div></Reveal>
            <Reveal delay={55}><h2>গণমাধ্যমে আমাদের নিয়ে<br /><em>বিশেষ প্রতিবেদন</em></h2></Reveal>
            <Reveal delay={105}><p>চুইঝালের স্বতন্ত্র স্বাদকে নতুনভাবে মানুষের কাছে পৌঁছে দেওয়ার M3Food-এর যাত্রা নিয়ে গণমাধ্যমে প্রকাশিত ভিডিও প্রতিবেদনটি দেখুন।</p></Reveal>
            <Reveal delay={150}>
              <div className="media-report-points">
                <span><b>✦</b> ব্র্যান্ডের গল্প</span>
                <span><b>◌</b> পণ্যের পরিচিতি</span>
                <span><b>↗</b> গণমাধ্যমের প্রতিবেদন</span>
              </div>
            </Reveal>
          </div>
          <Reveal className="media-report-video" delay={85}>
            <VideoEmbed
              src="https://www.youtube.com/embed/IbachkfutRw?rel=0"
              title="গণমাধ্যমে M3Food নিয়ে প্রতিবেদন"
              label="গণমাধ্যমে M3Food"
              featured
            />
          </Reveal>
        </div>
      </section>

      <section className="reviews section-cream" id="reviews">
        <div className="review-glow review-glow-a" />
        <div className="review-glow review-glow-b" />
        <div className="page-shell reviews-head">
          <Reveal>
            <div className="section-tag"><span>০৭</span> গ্রাহকের অভিজ্ঞতা</div>
            <h2>গ্রাহকরা কী বলছেন?</h2>
            <p className="reviews-subtitle">সত্যিকারের রিভিউ, সত্যিকারের ফলাফল</p>
            <p>M3Food চুইঝাল মিষ্টি মসলা নিয়ে গ্রাহকদের শেয়ার করা ভিডিও ও ছবিভিত্তিক বাস্তব অভিজ্ঞতা—এক জায়গায় দেখে নিন।</p>
          </Reveal>
          <Reveal className="reviews-score" delay={80}>
            <div className="reviews-score-stars">★★★★★</div>
            <strong>৪.৯<span>/৫</span></strong>
            <p>(২,৭৪৫ রিভিউ)</p>
          </Reveal>
        </div>

        <div className="page-shell customer-video-block">
          <Reveal className="customer-video-heading">
            <span>ভিডিওতে বাস্তব অভিজ্ঞতা</span>
            <h3>গ্রাহকদের মুখে M3Food</h3>
            <p>পণ্যটি ব্যবহার করে গ্রাহকেরা কী বলছেন—চারটি ভিডিও রিভিউ থেকে সরাসরি শুনে নিন।</p>
          </Reveal>
          <Reveal delay={45} className="customer-video-showcase">
            <div className="customer-video-stage" key={activeVideo}>
              <VideoEmbed
                src={customerVideos[activeVideo][0]}
                title={customerVideos[activeVideo][1]}
                label={`গ্রাহকের ভিডিও রিভিউ • ০${activeVideo + 1}`}
              />
            </div>
            <div className="customer-video-controls" aria-label="গ্রাহকের ভিডিও রিভিউ নির্বাচন">
              <button type="button" className="video-nav-arrow" onClick={() => setActiveVideo((activeVideo + customerVideos.length - 1) % customerVideos.length)} aria-label="আগের ভিডিও"><span>←</span></button>
              <div className="video-review-tabs">
                {customerVideos.map((video, index) => (
                  <button key={video[0]} type="button" className={activeVideo === index ? 'is-active' : ''} onClick={() => setActiveVideo(index)}>
                    <span>০{index + 1}</span><b>{activeVideo === index ? 'এখন দেখছেন' : 'রিভিউ'}</b>
                  </button>
                ))}
              </div>
              <button type="button" className="video-nav-arrow" onClick={() => setActiveVideo((activeVideo + 1) % customerVideos.length)} aria-label="পরের ভিডিও"><span>→</span></button>
            </div>
          </Reveal>
        </div>

        <div className="page-shell review-gallery-label">
          <span>আরও গ্রাহকের মতামত</span>
          <b>ছবিতে শেয়ার করা বাস্তব রিভিউ</b>
        </div>

        <Reveal className="reviews-motion-wrap" delay={120}>
          <ReviewMarquee />
        </Reveal>

        <div className="page-shell reviews-bottom reviews-bottom-simple">
          <div><strong>১.৬০ লক্ষ+</strong><span>সন্তুষ্ট গ্রাহকের ভালোবাসা</span></div>
          <div className="reviews-proof-note"><span>★★★★★</span><b>বাস্তব অভিজ্ঞতা • বাস্তব মতামত</b></div>
        </div>
      </section>

      <section className="order-section section-lime" id="order">
        <div className="order-orb order-orb-one" />
        <div className="order-orb order-orb-two" />
        <div className="order-leaf order-leaf-a">✦</div>
        <div className="order-leaf order-leaf-b">●</div>
        <div className="page-shell order-grid order-grid-premium">
          <div className="order-copy">
            <Reveal><div className="section-tag dark"><span>০৮</span> বিশেষ অফারে অর্ডার করুন</div></Reveal>
            <Reveal delay={55}><h2>বিশেষ অফারেই আজ<br /><em>ঘরে আনুন M3Food</em></h2></Reveal>
            <Reveal delay={105}><p>মিষ্টি, চুইঝালের ঝাঁঝ আর সতেজ অনুভূতির তিন ধাপ—সব এক টিউবে। বিশেষ অফারে প্রতি প্যাকে সরাসরি ৬৪০ টাকা সাশ্রয় করুন, সঙ্গে থাকছে বাংলাদেশজুড়ে ফ্রি হোম ডেলিভারির সুবিধা।</p></Reveal>

            <Reveal delay={145}>
              <div className="offer-hero-card">
                <div className="offer-save-seal"><small>সাশ্রয়</small><strong>৳৬৪০</strong></div>
                <div className="offer-hero-copy">
                  <span className="offer-chip">আজকের বিশেষ মূল্য</span>
                  <div className="offer-price-line"><del>৳১,৮৯০</del><strong>৳১,২৫০</strong></div>
                  <b className="offer-save">প্রতি প্যাকে সাশ্রয় ৳৬৪০</b>
                  <div className="offer-perks">
                    <span>✓ বাংলাদেশজুড়ে ফ্রি হোম ডেলিভারি</span>
                    <span>✓ পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা</span>
                    <span>✓ হটলাইন সহায়তা</span>
                  </div>
                </div>
                <div className="offer-product-art">
                  <Image src="/media/hero-premium-transparent.png" alt="M3Food চুইঝাল মিষ্টি মসলা" fill sizes="(max-width: 900px) 46vw, 260px" />
                </div>
              </div>
            </Reveal>

            <Reveal delay={195}>
              <div className="order-trust order-trust-premium">
                <div><b>☎</b><span><small>অর্ডার সহায়তা</small>০৯৬১৩-২৪০২৪০</span></div>
                <div><b>✦</b><span><small>অফিস</small>শিববাড়ি মোড়, খুলনা</span></div>
              </div>
            </Reveal>
          </div>

          <Reveal id="order-form" className="order-panel order-panel-premium" delay={85}>
            <div className="order-panel-top">
              <span>আপনার অর্ডার</span>
              <b>অর্ডারের তথ্য পূরণ করুন</b>
            </div>
            <div className="order-product-mini">
              <div className="order-product-image"><Image src="/media/forest-challenge.webp" alt="M3Food চুইঝাল মিষ্টি মসলা" fill sizes="120px" className="cover-image" /></div>
              <div><span>{catalogSelection?.product.name || 'চুইঝাল মিষ্টি মসলা'}</span><div className="mini-price-pair"><del>৳{regularUnitPrice.toLocaleString('bn-BD')}</del><strong>৳{unitPrice.toLocaleString('bn-BD')}</strong></div><p>প্রতি প্যাক • বিশেষ অফার মূল্য</p></div>
            </div>

            <form
              onSubmit={submitOrder}
              onChange={() => {
                if (orderState.status === 'error') {
                  idempotencyKeyRef.current = null;
                  setOrderState({ status: 'idle', message: '', publicId: '' });
                }
              }}
              className="order-form"
            >
              <label>আপনার নাম<input name="name" type="text" autoComplete="name" minLength="2" maxLength="255" placeholder="আপনার পূর্ণ নাম" required /></label>
              <label>মোবাইল নম্বর<input name="phone" type="tel" inputMode="tel" autoComplete="tel" minLength="7" maxLength="32" placeholder="০১XXXXXXXXX" required /></label>
              <label>সম্পূর্ণ ঠিকানা<textarea name="address" autoComplete="street-address" minLength="3" maxLength="1000" placeholder="বাসা/রোড, গ্রাম/এলাকা, থানা" rows="3" required /></label>
              <label>জেলা<input name="district" type="text" autoComplete="address-level1" minLength="2" maxLength="160" placeholder="যেমন: খুলনা" required /></label>
              <div className="form-row form-row-smart">
                <label className="quantity-field">
                  <span className="field-label">পরিমাণ</span>
                  <span className="quantity-select-wrap">
                    <span className="quantity-icon">▦</span>
                    <select value={quantity} onChange={e => setQuantity(Number(e.target.value))}>
                      {[1,2,3,4,5].map((value, index) => <option value={value} key={value}>{banglaPackLabels[index]}</option>)}
                    </select>
                    <span className="quantity-arrow">⌄</span>
                  </span>
                  <small className="quantity-helper">প্যাক সংখ্যা বেছে নিন</small>
                </label>
                <div className="form-total form-total-smart"><span>মোট মূল্য</span><div className="form-price-pair"><del>৳{regularTotal.toLocaleString('bn-BD')}</del><strong>৳{total.toLocaleString('bn-BD')}</strong></div><small>{banglaPackLabels[quantity - 1]} • সাশ্রয় ৳{savings.toLocaleString('bn-BD')}</small></div>
              </div>
              {(catalogError || orderState.message) && (
                <div className={`order-form-status ${orderState.status === 'success' ? 'is-success' : orderState.status === 'loading' ? 'is-loading' : 'is-error'}`} role="status" aria-live="polite">
                  <b>{orderState.status === 'success' ? '✓' : orderState.status === 'loading' ? '…' : '!'}</b>
                  <span>{catalogError || orderState.message}{orderState.publicId ? <small>অর্ডার নম্বর: {orderState.publicId}</small> : null}</span>
                </div>
              )}
              <button
                className="order-confirm-button"
                type="submit"
                disabled={!catalogSelection || !catalogSelection.variant.inStock || Boolean(catalogError) || orderState.status === 'loading' || orderState.status === 'success'}
              >
                <span>
                  <small>{catalogSelection ? (catalogSelection.variant.inStock ? 'সব তথ্য ঠিক আছে?' : 'বর্তমানে স্টক নেই') : 'পণ্যের তথ্য লোড হচ্ছে'}</small>
                  <strong>{orderState.status === 'loading' ? 'অর্ডার সংরক্ষণ হচ্ছে…' : orderState.status === 'success' ? 'অর্ডার নিশ্চিত হয়েছে' : 'অর্ডার নিশ্চিত করুন'}</strong>
                </span>
                <ArrowIcon />
              </button>
              <div className="order-security-note"><b>✓</b><span>“অর্ডার নিশ্চিত করুন” চাপলে আপনার অর্ডার সরাসরি আমাদের সিস্টেমে নিরাপদভাবে সংরক্ষিত হবে।</span></div>
            </form>
          </Reveal>
        </div>
      </section>

      <section className="faq section-cream">
        <div className="page-shell faq-grid">
          <Reveal className="faq-title">
            <div className="section-tag"><span>০৯</span> সাধারণ প্রশ্ন</div>
            <h2>অর্ডারের আগে<br /><em>যা জানতে চান</em></h2>
            <p>পণ্য, স্বাদ, ব্যবহার, মূল্য, ডেলিভারি ও অর্ডার নিয়ে সবচেয়ে প্রয়োজনীয় উত্তরগুলো এক জায়গায়।</p>
          </Reveal>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <Reveal key={question} delay={index * 45}>
                <button className={`faq-item ${activeFaq === index ? 'is-active' : ''}`} onClick={() => setActiveFaq(activeFaq === index ? -1 : index)} aria-expanded={activeFaq === index}>
                  <span className="faq-question"><b>০{index + 1}</b>{question}</span>
                  <span className="faq-plus">{activeFaq === index ? '−' : '+'}</span>
                  <span className="faq-answer">{answer}</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section section-forest" id="contact">
        <div className="page-shell contact-grid">
          <Reveal>
            <div className="section-tag light"><span>১০</span> যোগাযোগ</div>
            <h2>প্রয়োজনে সরাসরি<br /><em>আমাদের সঙ্গে কথা বলুন</em></h2>
          </Reveal>
          <Reveal className="contact-cards" delay={80}>
            <a href="tel:09613240240"><span>হটলাইন</span><strong>০৯৬১৩-২৪০২৪০</strong></a>
            <a href="tel:+8801520101590"><span>মোবাইল</span><strong>+৮৮ ০১৫২০ ১০১৫৯০</strong></a>
            <a href="tel:+8801571777771"><span>বিকল্প নম্বর</span><strong>+৮৮ ০১৫৭১ ৭৭৭৭৭১</strong></a>
            <a href="mailto:m3foodchuijhal@gmail.com"><span>ইমেইল</span><strong>m3foodchuijhal@gmail.com</strong></a>
          </Reveal>
        </div>
      </section>

      <footer className="footer section-dark">
        <div className="page-shell footer-main">
          <div className="footer-brand"><Brand /><p>খুলনার চুইঝালের স্বকীয় স্বাদ—মিষ্টি, ঝাল ও সতেজতার নতুন অভিজ্ঞতায়, এখন বাংলাদেশজুড়ে।</p></div>
          <div className="footer-col"><span>দ্রুত লিংক</span><a href="#experience">স্বাদের অভিজ্ঞতা</a><a href="#media">গণমাধ্যমে M3Food</a><a href="#reviews">গ্রাহকের মতামত</a><a href="#order">অর্ডার</a></div>
          <div className="footer-col"><span>আমাদের অফিস</span><p>শিববাড়ি মোড়, খুলনা সদর,<br />খুলনা, বাংলাদেশ</p></div>
          <div className="footer-col"><span>নীতিমালা ও সামাজিক মাধ্যম</span><a href="https://m3food.com/terms-and-conditions" target="_blank" rel="noreferrer">শর্তাবলি</a><a href="https://m3food.com/refund-return-policy" target="_blank" rel="noreferrer">রিটার্ন/পরিবর্তন নীতি</a><a href="https://www.facebook.com/chuijhalm3food/" target="_blank" rel="noreferrer">ফেসবুক</a><a href="https://m3food.com/contact/" target="_blank" rel="noreferrer">যোগাযোগ পেজ</a></div>
        </div>
        <div className="page-shell footer-bottom">
          <span>“ আপনাদের বিশ্বাস আমাদের অর্জন ”</span>
          <span>© {new Date().getFullYear()} M3Food. সর্বস্বত্ব সংরক্ষিত।</span>
        </div>
      </footer>

      <div className="mobile-cta">
        <a href="#order-form" className="mobile-price-block"><span>বিশেষ অফার</span><span className="mobile-price-pair"><del>৳১,৮৯০</del><b>৳১,২৫০</b></span></a>
        <a className="order-pulse mobile-order-action" href="#order-form"><span><small>অর্ডার করতে</small><b>এখনই অর্ডার করুন</b></span><span className="cta-arrow"><ArrowIcon /></span></a>
      </div>
    </main>
  );
}
