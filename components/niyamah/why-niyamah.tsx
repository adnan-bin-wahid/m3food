"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Gem, Heart, Flower2, Gift, ArrowUpRight, Feather, Sparkles } from "lucide-react";
import "./why-niyamah.css";

const CARDS_DATA = [
  {
    number: "01",
    enTitle: "Thoughtfully Designed Hijab",
    bnSubtitle: "আরাম, কভারেজ এবং সৌন্দর্যের পারফেক্ট সমন্বয়",
    image: "/niyamah/slider/slider-2-f.png",
    accent: "#e5c875",
    icon: Feather,
    features: [
      "১০০% অরিজিনাল বেক্সি ভয়েল কটন",
      "থুতনী ও মাথার জন্য আলাদা কাপড়",
      "দুই সাইড থেকে কানের চুল বের হবে না",
      "নিচে নিখুঁত ফ্রিল করা কুচি ডিজাইন",
      "নামাজের জন্য পারফেক্ট কভারেজ (৪৩″ / ৫২″)",
    ],
    tag: "Original Bexi Cotton",
  },
  {
    number: "02",
    enTitle: "Elegant Non-Alcoholic Perfume",
    bnSubtitle: "সুবাসে থাকুক পবিত্রতা ও ব্যক্তিত্বের ছোঁয়া",
    image: "/niyamah/slider/slider-1-f.png",
    accent: "#d97d95",
    icon: Sparkles,
    features: [
      "১০০% অ্যালকোহল মুক্ত হালাল ফর্মুলা",
      "দীর্ঘস্থায়ী ও মনোমুগ্ধকর অর্কিড সুবাস",
      "দৈনন্দিন ইবাদত ও ব্যবহারের জন্য পারফেক্ট",
      "নরম, স্নিগ্ধ ও মার্জিত রাজকীয় ঘ্রাণ",
      "পোশাকে ১৬+ ঘণ্টারও বেশি সময় অক্ষুণ্ণ থাকে",
    ],
    tag: "100% Halal Orchid Extrait",
  },
  {
    number: "03",
    enTitle: "Meaningful Gift Package",
    bnSubtitle: "প্রিয়জনের জন্য একটি বিশেষ হাদিয়া",
    image: "/niyamah/slider/slider-3-f.png",
    accent: "#e5c875",
    icon: Gift,
    features: [
      "১টি প্রিমিয়াম সালাত হিজাব (Pure Bexi)",
      "১টি নন অ্যালকোহলিক সুবাসিত পারফিউম",
      "১টি সুপার কিউট টিউলিপ লাক্সারি ব্যাগ",
      "ভালোবাসা ও কৃতজ্ঞতার পরিপূর্ণ প্রকাশ",
      "মা, বোন বা স্ত্রীর জন্য শ্রেষ্ঠ উপহার",
    ],
    tag: "Ready-to-Gift Package",
  },
];

const PILLARS_DATA = [
  {
    icon: Gem,
    titleEn: "Premium Quality",
    titleBn: "খাঁটি ডিজাইন ও বিশ্বস্ততা",
  },
  {
    icon: Heart,
    titleEn: "Designed for Real Needs",
    titleBn: "আরাম প্রতিদিনের জন্য",
  },
  {
    icon: Flower2,
    titleEn: "Modesty with Elegance",
    titleBn: "শালীনতার রাজকীয় রূপ",
  },
  {
    icon: Gift,
    titleEn: "A More Meaningful You",
    titleBn: "পরিপূর্ণতার ছোঁয়ায় উপহার",
  },
];

export function WhyNiyamahSection() {
  const root = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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

          // As the next card scrolls up, smoothly scale and dim the current card underneath
          if (index < cardWrappers.length - 1) {
            const nextWrapper = cardWrappers[index + 1];
            gsap.to(card, {
              scale: 0.94,
              opacity: 0.55,
              filter: "brightness(0.72)",
              ease: "none",
              scrollTrigger: {
                trigger: nextWrapper,
                start: "top bottom",
                end: `top ${104 + (index + 1) * 24}px`,
                scrub: true,
              },
            });
          }
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
                      <h3>{pillar.titleEn}</h3>
                      <p>{pillar.titleBn}</p>
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

        <div ref={trackRef} className="np-products" aria-label="নিয়ামাহ্‌র তিনটি সিগনেচার পণ্য">
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
                      <p className="np-product-label">
                        {['COMFORT IN EVERY PRAYER', 'A QUIET EXPRESSION OF YOU', 'GIVEN WITH LOVE'][index]}
                      </p>
                      <h3 id={`np-product-${index}`}>{card.enTitle}</h3>
                      <p className="np-subtitle">{card.bnSubtitle}</p>
                      <ul>
                        {card.features.map((feature) => (
                          <li key={feature}>
                            <span className="np-check-icon">
                              <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
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
