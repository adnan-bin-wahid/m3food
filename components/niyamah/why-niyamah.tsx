"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Gem, Heart, Flower, Flower2, Gift, ArrowUpRight, Feather, Sparkles, Leaf, Shield } from "lucide-react";
import "./why-niyamah.css";

const CARDS_DATA = [
  {
    number: "01",
    label: "COMFORT IN EVERY PRAYER",
    enTitle: "Thoughtfully Designed\nHijab",
    bnSubtitle: "আরাম, কভারেজ এবং সৌন্দর্যের পারফেক্ট সমন্বয়",
    shortTitle: "সালাত হিজাব",
    image: "/niyamah/slider/slider-2-f.png",
    accent: "#e5c875",
    icon: Feather,
    features: [
      {
        icon: Feather,
        title: "১০০% অরিজিনাল বেক্সি ভয়েল কটন",
        desc: "কোমল, আরামদায়ক ও ব্রিদেবল প্রিমিয়াম ফেব্রিক",
      },
      {
        icon: Shield,
        title: "থুতনী ও কপালের জন্য বিশেষ কাটিং",
        desc: "দুই সাইড থেকে কানের চুল বের হবে না",
      },
      {
        icon: Sparkles,
        title: "নিচে নিখুঁত ফ্রিল করা কুচি ডিজাইন",
        desc: "মার্জিত ও আকর্ষণীয় রাজকীয় ফিনিশিং",
      },
      {
        icon: Heart,
        title: "ইবাদতের জন্য পারফেক্ট ফুল কভারেজ",
        desc: "৪৩″ ও ৫২″ সাইজের সম্পূর্ণ নিশ্চয়তা",
      },
    ],
    tag: "Original Bexi Cotton",
  },
  {
    number: "02",
    label: "A QUIET EXPRESSION OF YOU",
    enTitle: "Elegant Non\u2011Alcoholic\nPerfume",
    bnSubtitle: "সুবাসে থাকুক পবিত্রতা ও ব্যক্তিত্বের ছোঁয়া",
    shortTitle: "অর্কিড আতর",
    image: "/niyamah/slider/slider-1-f.png",
    accent: "#d97d95",
    icon: Sparkles,
    features: [
      {
        icon: Leaf,
        title: "100% অ্যালকোহল মুক্ত হালাল ফর্মুলা",
        desc: "নিরাপদ ও বিশ্বাসযোগ্য",
      },
      {
        icon: Flower,
        title: "মিষ্টিতাপূর্ণ ও মনোমুগ্ধকর অর্কিড সুবাস",
        desc: "দীর্ঘস্থায়ী ফ্রেশ ফিল",
      },
      {
        icon: Sparkles,
        title: "দৈনন্দিন ব্যবহার ও বিশেষ মুহূর্তের জন্য",
        desc: "সব সময় আপনার সাথে",
      },
      {
        icon: Heart,
        title: "নরম, মিষ্টি ও মার্জিত রাজকীয় ঘ্রাণ",
        desc: "আপনার ব্যক্তিত্বকে করে তোলে আরও অনন্য",
      },
    ],
    tag: "100% Halal Orchid Extrait",
  },
  {
    number: "03",
    label: "GIVEN WITH PURE LOVE",
    enTitle: "Meaningful Gift\nPackage",
    bnSubtitle: "প্রিয়জনের জন্য একটি বিশেষ হাদিয়া",
    shortTitle: "গিফট প্যাকেজ",
    image: "/niyamah/slider/slider-3-f.png",
    accent: "#e5c875",
    icon: Gift,
    features: [
      {
        icon: Feather,
        title: "১টি প্রিমিয়াম সালাত হিজাব (Pure Bexi)",
        desc: "দৈনন্দিন ইবাদতের পরম প্রশান্তি ও তৃপ্তি",
      },
      {
        icon: Sparkles,
        title: "১টি নন-অ্যালকোহলিক সুবাসিত পারফিউম",
        desc: "১৬+ ঘণ্টা স্থায়ী মুগ্ধকর অর্কিড সুবাস",
      },
      {
        icon: Gift,
        title: "১টি সুপার কিউট টিউলিপ লাক্সারি ব্যাগ",
        desc: "প্রিয়জনের জন্য নিখুঁত ও নান্দনিক প্রেজেন্টেশন",
      },
      {
        icon: Heart,
        title: "ভালোবাসা ও শ্রদ্ধার পরিপূর্ণ উপহার",
        desc: "মা, বোন বা স্ত্রীর জন্য শ্রেষ্ঠ আন্তরিক হাদিয়া",
      },
    ],
    tag: "Ready-to-Gift Package",
  },
];

const PILLARS_DATA = [
  {
    icon: Gem,
    titleEn: "Premium Quality",
    titleBn: "খাঁটি ডিজাইন ও বিশ্বস্ততা",
    shortBn: "খাঁটি কোয়ালিটি",
  },
  {
    icon: Heart,
    titleEn: "Designed for Real Needs",
    titleBn: "আরাম প্রতিদিনের জন্য",
    shortBn: "দৈনন্দিন আরাম",
  },
  {
    icon: Flower2,
    titleEn: "Modesty with Elegance",
    titleBn: "শালীনতার রাজকীয় রূপ",
    shortBn: "মার্জিত শালীনতা",
  },
  {
    icon: Gift,
    titleEn: "A More Meaningful You",
    titleBn: "পরিপূর্ণতার ছোঁয়ায় উপহার",
    shortBn: "অর্থপূর্ণ উপহার",
  },
];

export function WhyNiyamahSection() {
  const root = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToCard = (index: number) => {
    setActive(index);
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll<HTMLElement>(".np-card-wrapper");
    const target = cards[index];
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    const el = e.currentTarget;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    if (width > 0) {
      const idx = Math.round(scrollLeft / width);
      if (idx >= 0 && idx < CARDS_DATA.length && idx !== active) {
        setActive(idx);
      }
    }
  };

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = root.current;
    if (!section) return;

    let disposed = false;
    const media = gsap.matchMedia();

    media.add(
      "(min-width: 1024px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
      () => {
        const manifesto = manifestoRef.current;
        const track = trackRef.current;
        if (!manifesto || !track) return;

        const cardWrappers = gsap.utils.toArray<HTMLElement>(".np-card-wrapper", track);
        const cards = gsap.utils.toArray<HTMLElement>(".np-card", track);

        // 1. Pin the Left Manifesto throughout the entire section scroll
        ScrollTrigger.create({
          trigger: manifesto,
          start: "top 104px",
          endTrigger: track,
          end: () => `bottom ${104 + manifesto.offsetHeight}px`,
          pin: manifesto,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        // 2. Pin and Stack Each Right Card with staggered top offsets
        cardWrappers.forEach((wrapper, index) => {
          const card = cards[index];
          if (!card) return;

          const pinOffset = 104 + index * 24;

          ScrollTrigger.create({
            trigger: wrapper,
            start: `top ${pinOffset}px`,
            endTrigger: track,
            end: () => `bottom ${104 + (cards[cards.length - 1]?.offsetHeight || 540) + (cards.length - 1) * 24}px`,
            pin: card,
            pinSpacing: false,
            invalidateOnRefresh: true,
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
          });
        });
      }
    );

    media.add("(max-width: 1023px), (max-height: 649px)", () => {
      const cards = section.querySelectorAll<HTMLElement>(".np-card");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Number((entry.target as HTMLElement).dataset.index);
              if (!isNaN(idx)) setActive(idx);
            }
          });
        },
        { rootMargin: "-30% 0px -30% 0px", threshold: 0 }
      );

      cards.forEach((card) => observer.observe(card));
      return () => observer.disconnect();
    });

    document.fonts.ready.then(() => {
      if (!disposed) ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      media.revert();
    };
  }, []);

  return (
    <section ref={root} id="why-niyamah" className="np-promise" aria-labelledby="np-heading">
      {/* 1. Luminous Palace Background with Fixed Attachment */}
      <div className="np-palace-bg" aria-hidden="true" />
      {/* 2. Delicate Rose-Wine Luxury Scrim */}
      <div className="np-palace-overlay" aria-hidden="true" />

      <div className="np-layout">
        <div className="np-left">
          <div ref={manifestoRef} className="np-manifesto">
            <p className="np-eyebrow"><span />The Niyamah Promise</p>
            <p className="np-kicker">আত্মমর্যাদা ও প্রশান্তির অঙ্গীকার</p>
            <h2 id="np-heading">
              শালীনতা শুধু<br />
              একটি পোশাক নয়,<br />
              <em>এটি একটি<br className="np-wide-break" /> পরম অনুভূতি।</em>
            </h2>
            {/* Flourish Divider with Centered 4-Point Star */}
            <div className="np-pillars-divider" aria-hidden="true">
              <span className="np-div-line" />
              <svg className="np-div-star" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
              </svg>
              <span className="np-div-line" />
            </div>

            <div className="np-pillars">
              {PILLARS_DATA.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div className="np-pillar" key={pillar.titleEn}>
                    <div className="np-pillar-icon">
                      <Icon size={21} strokeWidth={1.35} aria-hidden="true" />
                    </div>
                    <div className="np-pillar-text">
                      <h3 className="np-pillar-en">{pillar.titleEn}</h3>
                      <p className="np-pillar-bn-full">{pillar.titleBn}</p>
                      <p className="np-pillar-bn-short">{pillar.shortBn}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="np-signature">
              <p>
                “Because every detail matters<br />
                to her sacred journey.”
              </p>
              <div className="np-tagline">
                <span>NIYAMAH ATTIRES</span>
                <i>•</i>
                <em>where modesty becomes elegance</em>
              </div>
            </div>

            <div className="np-progress" aria-hidden="true">
              <span>WHY NIYAMAH</span>
              <div className="np-progress-pills">
                {CARDS_DATA.map((card, i) => (
                  <i key={card.number} className={active === i ? "is-active" : ""} />
                ))}
              </div>
              <span className="np-progress-counter">0{active + 1} / 03</span>
            </div>
          </div>
        </div>

        {/* Mobile Product Navigation Tabs & Indicators */}
        <div className="np-mobile-nav" aria-label="পণ্য নির্বাচন করুন">
          <div className="np-mobile-tabs" role="tablist">
            {CARDS_DATA.map((card, idx) => (
              <button
                key={card.number}
                type="button"
                role="tab"
                aria-selected={active === idx}
                className={`np-mobile-tab-btn ${active === idx ? "is-active" : ""}`}
                onClick={() => scrollToCard(idx)}
              >
                <span className="np-mobile-tab-num">{card.number}</span>
                <span className="np-mobile-tab-label">{card.shortTitle}</span>
              </button>
            ))}
          </div>
          <div className="np-mobile-dots" aria-hidden="true">
            {CARDS_DATA.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`পণ্য ${idx + 1} এ যান`}
                className={`np-mobile-dot ${active === idx ? "is-active" : ""}`}
                onClick={() => scrollToCard(idx)}
              />
            ))}
          </div>
        </div>

        <div
          ref={trackRef}
          className="np-products"
          onScroll={handleMobileScroll}
          aria-label="নিয়ামাহ্‌র তিনটি সিগনেচার পণ্য"
        >
          {CARDS_DATA.map((card, index) => {
            const Icon = card.icon;
            return (
              <div className="np-card-wrapper" key={card.number}>
                <article
                  className={`np-card np-card-${index + 1}`}
                  data-index={index}
                  aria-labelledby={`np-product-${index}`}
                >
                  <div className="np-card-top">
                    <span className="np-number">
                      {card.number}<span> / THE COLLECTION</span>
                    </span>
                    <span className="np-tag-pill">{card.tag}</span>
                    <Icon size={22} strokeWidth={1.3} aria-hidden="true" />
                  </div>

                  <div className="np-card-body">
                    <div className="np-card-copy">
                      <p className="np-product-label">{card.label}</p>
                      <h3 id={`np-product-${index}`}>{card.enTitle}</h3>
                      <p className="np-subtitle">{card.bnSubtitle}</p>
                      <div className="np-card-features">
                        {card.features.map((feature, fIdx) => {
                          const FIcon = feature.icon;
                          return (
                            <div className="np-feature-row" key={fIdx}>
                              <div className="np-feature-badge" aria-hidden="true">
                                <FIcon size={18} strokeWidth={1.35} />
                              </div>
                              <div className="np-feature-content">
                                <span className="np-feature-title">{feature.title}</span>
                                <span className="np-feature-desc">{feature.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="np-art">
                      <div className="np-art-frame" />
                      <Image
                        className="np-product-image"
                        src={card.image}
                        alt={card.enTitle}
                        fill
                        sizes="(min-width: 1100px) 32vw, (min-width: 700px) 48vw, 90vw"
                      />
                    </div>
                  </div>

                  <div className="np-card-footer">
                    <span>আভিজাত্য ও আস্থার নিশ্চয়তা</span>
                    <a href="#order-section" className="np-order-btn">
                      অর্ডার করুন <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
