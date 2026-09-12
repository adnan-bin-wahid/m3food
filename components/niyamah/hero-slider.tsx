"use client";

import { useEffect, useRef } from "react";
import { Flower2, Gift, Leaf, ShoppingBag, Sparkles, Tag, Truck, CheckCircle2, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import type { HeroSlideData } from "./homepage-defaults";

const TULIP_HERO = {
  id: "tulip-package-gift-set",
  sku: "NYM-TLP-001",
  name: "টিউলিপ গিফট প্যাকেজ",
  category: "ব্লসম গিফট কালেকশন • LIMITED DROP",
  title: "সৌন্দর্য থাকুক",
  highlight: "আপনার সঙ্গেই",
  subtitle: "টিউলিপ গিফট প্যাকেজ",
  tagline: "ভালোবাসা ও কৃতজ্ঞতার চিরন্তন উপহার",
  image: "slider-3-f.png",
  box: "218 0 692 1148",
  size: [1080, 1360],
  script: ["Carry Good Things", "Beautifully ♡"],
  card: "টিউলিপ লাক্সারি কম্বো",
  note: "প্রিয়জনের জন্য স্নিগ্ধ ও মার্জিত উপহার",
  regularPrice: "১৩৫০/-",
  discountPrice: "১২২৫/-",
  specs: [
    ["সালাত হিজাব", "প্রিমিয়াম Bexi কটন"],
    ["পারফিউম", "নন-আলকোহলিক অর্কিড"],
    ["গিফট ব্যাগ", "সিগনেচার টিউলিপ ব্যাগ"],
  ],
  features: ["৩টি প্রিমিয়াম উপহার", "১০০% বেক্সি কটন", "গিফটের জন্য পারফেক্ট"],
};

const icons = [Flower2, Leaf, Gift];
const specIcons = [Leaf, Flower2, Sparkles];

export function HeroSlider({ className = "" }: { slides?: HeroSlideData[]; autoPlayMs?: number; className?: string }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const item = TULIP_HERO;
  const href = "#order-section";

  // GSAP Cinematic Entrance & Floating
  useEffect(() => {
    if (reduced || !heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Background soft opacity fade
      tl.fromTo(
        ".nh-scene",
        { opacity: 0.85 },
        { opacity: 1, duration: 1.8, ease: "power2.out" },
        0
      );

      // Product rises smoothly
      tl.fromTo(
        ".nh-product",
        { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95, ease: "power3.out" },
        0.5
      );

      // Heading reveals
      tl.fromTo(
        ".nh-copy h1, .nh-eyebrow, .nh-subtitle",
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.09 },
        1.0
      );

      // Offer & CTA reveal
      tl.fromTo(
        ".nh-order, .nh-offer",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.1 },
        1.3
      );

      // Infinite subtle floating motion
      tl.to(
        ".nh-product",
        {
          y: -7,
          duration: 4.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        },
        2.0
      );
    }, heroRef);

    return () => ctx.revert();
  }, [reduced]);

  // Mouse Parallax on Desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced || !heroRef.current || window.innerWidth < 768) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(".nh-product", { x: x * 14, y: y * 8, duration: 0.8, ease: "power1.out", overwrite: "auto" });
  };

  const handleMouseLeave = () => {
    if (!reduced && window.innerWidth >= 768) {
      gsap.to(".nh-product", { x: 0, y: 0, duration: 1, ease: "power2.out", overwrite: "auto" });
    }
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("niyamah:select-product", {
          detail: {
            productSlug: item.id,
            sku: item.sku,
          },
        })
      );
    }
    const target = document.querySelector("#order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "#order-section";
    }
  };

  return (
    <>
      <section
        ref={heroRef}
        className={`nh-hero ${className}`}
        aria-label="টিউলিপ গিফট প্যাকেজ"
        lang="bn"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Neoclassical Arch & Marble Scene */}
        <div className="nh-scene" aria-hidden="true" />

        {/* Floating Flower Petals */}
        <div className="nh-petals-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="nh-petal nh-petal-blur" style={{ top: "14%", left: "12%", width: "16px", height: "16px", animationDelay: "0s" }}>
            <svg viewBox="0 0 24 24" fill="#d97d95" opacity="0.6"><path d="M12 2C9 7 4 9 2 12c2 3 7 5 10 10 3-5 8-7 10-10-2-3-7-5-10-10z" /></svg>
          </div>
          <div className="nh-petal" style={{ top: "28%", left: "34%", width: "20px", height: "20px", animationDelay: "3s" }}>
            <svg viewBox="0 0 24 24" fill="#e898ae" opacity="0.75"><path d="M12 2C8 6 3 8 2 12c3 4 8 6 10 10 4-4 9-6 10-10-1-4-6-6-10-10z" /></svg>
          </div>
          <div className="nh-petal" style={{ top: "65%", left: "22%", width: "24px", height: "24px", animationDelay: "6s" }}>
            <svg viewBox="0 0 24 24" fill="#c44d71" opacity="0.65"><path d="M12 3C9 7 5 9 3 12c2 3 6 5 9 9 3-4 7-6 9-9-2-3-6-5-9-9z" /></svg>
          </div>
          <div className="nh-petal nh-petal-blur" style={{ top: "42%", right: "18%", width: "28px", height: "28px", animationDelay: "1.5s" }}>
            <svg viewBox="0 0 24 24" fill="#d97d95" opacity="0.5"><path d="M12 2C7 6 3 9 2 12c3 3 7 6 10 10 3-4 7-7 10-10-1-3-5-6-10-10z" /></svg>
          </div>
        </div>

        {/* Single Dedicated Package Hero Slide */}
        <div className="nh-slide nh-slide-static">
          <div className="nh-script" aria-hidden="true">
            <span>{item.script[0]}</span>
            <span>{item.script[1]}</span>
          </div>

          <motion.div
            className="nh-product"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.85 }}
          >
            <svg
              className="nh-product-image"
              viewBox={item.box}
              preserveAspectRatio="xMidYMax meet"
              role="img"
              aria-label={item.name}
            >
              <image href={`/niyamah/slider/${item.image}`} width={item.size[0]} height={item.size[1]} />
            </svg>
          </motion.div>

          <div className="nh-copy">
            <div className="nh-eyebrow">
              <span className="nh-flourish" aria-hidden="true">❧</span>
              <span>{item.category}</span>
            </div>
            <h1>
              <span>{item.title}</span>
              <em>{item.highlight}</em>
            </h1>
            <p className="nh-subtitle">
              <span aria-hidden="true">༺</span>
              {item.subtitle}
              <span aria-hidden="true">༻</span>
            </p>

            <div className="nh-offer">
              <div className="nh-regular">
                রেগুলার : <s>{item.regularPrice}</s>
              </div>
              <div className="nh-price">
                <span aria-hidden="true" className="nh-price-star">✥</span>
                <div>
                  <span>আফটার ডিসকাউন্ট:</span>
                  <strong>{item.discountPrice}</strong>
                </div>
                <span aria-hidden="true" className="nh-price-star">✥</span>
              </div>
            </div>

            <div className="nh-features">
              {item.features.map((label, index) => {
                const Icon = icons[index];
                return (
                  <div key={label}>
                    <span><Icon strokeWidth={1.35} /></span>
                    <p>{label}</p>
                  </div>
                );
              })}
            </div>

            <a
              className="nh-order"
              href={href}
              onClick={handleOrderClick}
            >
              <ShoppingBag size={22} />
              <span>ক্যাশ অন ডেলিভারিতে অর্ডার করুন</span>
              <ArrowRight size={22} />
            </a>
            <p className="nh-trust">
              ✓ কোনো অগ্রিম পেমেন্ট নেই <b>•</b> পার্সেল চেক সুবিধা <b>•</b> সারা দেশে হোম ডেলিভারি
            </p>
          </div>

          {/* Desktop Luxury Specs Card */}
          <aside className="nh-card">
            <div className="nh-card-top">
              <span><strong>০১</strong> / ০১</span>
              <span>{item.card}</span>
            </div>
            <h2>{item.name}</h2>
            <p className="nh-card-note">{item.note}</p>
            <dl>
              {item.specs.map(([label, value], index) => {
                const Icon = specIcons[index];
                return (
                  <div key={label}>
                    <dt><Icon size={21} />{label}</dt>
                    <dd><span>–</span>{value}</dd>
                  </div>
                );
              })}
              <div className="nh-card-price">
                <dt><Tag size={21} />অফার মূল্য</dt>
                <dd><span>:</span><strong>{item.discountPrice}</strong></dd>
              </div>
            </dl>
            <p className="nh-card-script">
              Beauty in<br />
              <span>Every Moment ♡</span>
            </p>
          </aside>
        </div>
      </section>

      {/* Immediate Micro-Trust Strip */}
      <div className="nh-trust-strip" lang="bn">
        <div className="nh-trust-strip-container">
          <div className="nh-trust-item">
            <div className="nh-trust-icon"><Truck strokeWidth={1.8} size={20} /></div>
            <div className="nh-trust-text">
              <h4>ক্যাশ অন ডেলিভারি</h4>
              <p>পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন</p>
            </div>
          </div>
          <div className="nh-trust-item">
            <div className="nh-trust-icon"><CheckCircle2 strokeWidth={1.8} size={20} /></div>
            <div className="nh-trust-text">
              <h4>পার্সেল চেক সুবিধা</h4>
              <p>ডেলিভারিম্যানের সামনে দেখে নিন</p>
            </div>
          </div>
          <div className="nh-trust-item">
            <div className="nh-trust-icon"><RefreshCw strokeWidth={1.8} size={20} /></div>
            <div className="nh-trust-text">
              <h4>৭ দিনে সহজ এক্সচেঞ্জ</h4>
              <p>পছন্দ বা সাইজে সমস্যা হলে বদলযোগ্য</p>
            </div>
          </div>
          <div className="nh-trust-item">
            <div className="nh-trust-icon"><ShieldCheck strokeWidth={1.8} size={20} /></div>
            <div className="nh-trust-text">
              <h4>১০০% অরিজিনাল কোয়ালিটি</h4>
              <p>খাঁটি বেক্সি কটন ও হালাল পারফিউম</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
