"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { CountdownTimer } from "./countdown-timer";
import {
  ProductStoryCard,
  type ProductStoryCardData,
  type ProductStoryTone,
} from "./product-story-card";

function preserveScroll(callback: () => void) {
  if (typeof window === "undefined") {
    callback();
    return;
  }
  const x = window.scrollX;
  const y = window.scrollY;
  callback();
  requestAnimationFrame(() => {
    if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
  });
}

// Harmonious luxury berry/wine tones matching the brand palette
const LUXURY_FLASH_TONES: ProductStoryTone[] = [
  // 1. Orchid Perfume: Rich Royal Orchid Wine & Rose Gold
  {
    bg: "#431224",
    panel: "#320b1a",
    text: "#ffffff",
    muted: "rgba(255, 235, 240, 0.78)",
    accent: "#f4a261",
    badgeBg: "#92123e",
    badgeText: "#ffffff",
  },
  // 2. Floral Prayer Set: Velvet Plum Berry & Warm Champagne
  {
    bg: "#3a1322",
    panel: "#2a0c18",
    text: "#ffffff",
    muted: "rgba(255, 235, 240, 0.78)",
    accent: "#e09f67",
    badgeBg: "#8f4d60",
    badgeText: "#ffffff",
  },
  // 3. Tulip Gift Package: Warm Royal Burgundy & Amber Rose
  {
    bg: "#42161d",
    panel: "#2f0e13",
    text: "#ffffff",
    muted: "rgba(255, 235, 240, 0.78)",
    accent: "#d4a373",
    badgeBg: "#a83258",
    badgeText: "#ffffff",
  },
];

// The 3 main core products with exact prices & discounts
const FLASH_PRODUCTS: ProductStoryCardData[] = [
  {
    id: "fs-1",
    slug: "orchid-perfume",
    name: "অর্কিড পারফিউম",
    image: "/niyamah/slider/slider-1-f.png",
    price: 850,
    originalPrice: 1050,
    categoryName: "প্রিমিয়াম আতর কালেকশন",
    badge: "২০০/- ছাড়",
    storyLabel: "হট ডিল • ফ্ল্যাশ অফার",
    inStock: true,
    tone: LUXURY_FLASH_TONES[0]!,
  },
  {
    id: "fs-2",
    slug: "floral-prayer-set",
    name: "ফ্লোরাল প্রেয়ার সেট",
    image: "/niyamah/slider/slider-2-f.png",
    price: 800,
    originalPrice: 850,
    categoryName: "প্রিমিয়াম প্রেয়ার কালেকশন",
    badge: "৫০/- ছাড়",
    storyLabel: "সীমিত স্টক • সিগনেচার",
    inStock: true,
    tone: LUXURY_FLASH_TONES[1]!,
  },
  {
    id: "fs-3",
    slug: "blossom-tote",
    name: "টিউলিপ গিফট প্যাকেজ",
    image: "/niyamah/slider/slider-3-f.png",
    price: 1225,
    originalPrice: 1350,
    categoryName: "ব্লসম গিফট কালেকশন",
    badge: "১২৫/- ছাড়",
    storyLabel: "বেস্ট সেলার • রেডি গিফট",
    inStock: true,
    tone: LUXURY_FLASH_TONES[2]!,
  },
];

const CLAIMED = [84, 91, 76];

export function FlashSaleSection() {
  const items = FLASH_PRODUCTS;
  const total = items.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [trackX, setTrackX] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const hovered = useRef(false);
  const isVisible = useRef(false);

  const active = (items[activeIndex] ?? items[0]) as ProductStoryCardData;

  const goTo = useCallback(
    (index: number) => {
      const safe = ((index % total) + total) % total;
      preserveScroll(() => setActiveIndex(safe));
    },
    [total],
  );

  const next = useCallback(() => {
    preserveScroll(() => setActiveIndex((c) => (c + 1) % total));
  }, [total]);

  const calculateTrackX = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const w = window.innerWidth;
    const gap = w >= 640 ? 16 : 12;
    const padding = w >= 1024 ? 32 : w >= 640 ? 24 : 16;
    const openWidth = Math.min(w * 0.78, 520);
    const closedWidth = Math.min(w * 0.28, 160);
    const viewportCenter = viewport.clientWidth / 2;
    const activeCenter = padding + activeIndex * (closedWidth + gap) + openWidth / 2;
    setTrackX(viewportCenter - activeCenter);
  }, [activeIndex]);

  useLayoutEffect(() => {
    calculateTrackX();
  }, [calculateTrackX, total]);

  useEffect(() => {
    window.addEventListener("resize", calculateTrackX);
    return () => window.removeEventListener("resize", calculateTrackX);
  }, [calculateTrackX]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Smooth auto-slide every 4.5 seconds
  useEffect(() => {
    if (total < 2) return;
    const id = window.setInterval(() => {
      if (!hovered.current && isVisible.current) next();
    }, 4500);
    return () => window.clearInterval(id);
  }, [total, next]);

  const sectionStyle = {
    "--story-bg": active.tone?.bg ?? "#431224",
    "--story-text": active.tone?.text ?? "#ffffff",
    "--story-muted": active.tone?.muted ?? "rgba(255,235,240,0.78)",
    "--story-accent": active.tone?.accent ?? "#f4a261",
  } as CSSProperties;

  const toBn = (n: number) =>
    String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

  return (
    <section
      id="flash-sale"
      ref={sectionRef}
      style={sectionStyle}
      className="relative isolate overflow-hidden bg-[var(--story-bg)] py-14 text-[var(--story-text)] transition-colors duration-700 [contain:paint] [overflow-anchor:none] sm:py-18 lg:py-20"
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
    >
      {/* Subtle luxury grid texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(0deg,currentColor_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-[#92123e] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(146,18,62,0.5)]">
              <Flame className="h-4 w-4 text-[#ffeab0] animate-pulse" />
              <span>লিমিটেড ফ্ল্যাশ ডিল — আজকের বিশেষ অফার</span>
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
              সেরা অফার,{" "}
              <em className="not-italic text-[#fbcfe8]">যা দ্রুত শেষ হয়ে যাচ্ছে!</em>
            </h2>
            <p className="mt-3.5 max-w-xl text-sm font-medium leading-relaxed text-white/80 sm:text-base">
              নিয়ামাহ্-র সিগনেচার কালেকশনের সেরা ৩টি পণ্য — আকর্ষণীয় ডিসকাউন্টে সংগ্রহ করুন কেবল আজকের জন্য।
            </p>
          </div>

          {/* Countdown */}
          <div className="shrink-0 rounded-2xl border border-white/20 bg-black/35 p-4 sm:p-5 backdrop-blur-md shadow-2xl">
            <p className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fbcfe8]">
              <Flame className="h-3.5 w-3.5 text-[#ffeab0]" />
              <span>অফার শেষ হতে বাকি</span>
            </p>
            <CountdownTimer
              durationHours={24}
              lang="bn"
              className="[&_.rounded-md]:!bg-white/10 [&_.rounded-md]:!border [&_.rounded-md]:!border-white/20 [&_.rounded-md]:!text-[#ffeab0] [&_.text-xs]:!text-white/70"
            />
          </div>
        </div>
      </div>

      {/* Slider Viewport */}
      <div
        ref={viewportRef}
        className="relative z-10 h-[400px] overflow-hidden [overflow-anchor:none] sm:h-[460px]"
      >
        <motion.div
          className="flex h-full w-max items-center gap-3 px-4 [overflow-anchor:none] [perspective:1200px] sm:gap-4 sm:px-6 lg:px-8"
          animate={{ x: trackX }}
          transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
        >
          {items.map((product, index) => (
            <div key={product.id}>
              <ProductStoryCard
                product={product}
                index={index}
                active={index === activeIndex}
                onSelect={() => goTo(index)}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Active product urgency bar */}
      <div className="relative z-10 mx-auto mt-6 max-w-[1500px] px-4 sm:px-6 lg:px-8">
        {(() => {
          const claimed = CLAIMED[activeIndex] ?? 84;
          const left = 100 - claimed;
          return (
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4 sm:p-5 backdrop-blur-sm max-w-xl">
              <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-[#fbcfe8] flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#f4a261] animate-ping" />
                  {toBn(claimed)}% স্টক বুকিং সম্পন্ন
                </span>
                <span className="text-white/80 font-medium">
                  মাত্র <b className="text-[#ffeab0] font-bold">{toBn(left)} টি</b> অবশিষ্ট আছে
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e09f67] via-[#f4a261] to-[#ea580c] transition-all duration-700 shadow-[0_0_12px_rgba(244,162,97,0.6)]"
                  style={{ width: `${claimed}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom row: CTA + Navigation Arrows */}
      <div className="relative z-10 mx-auto mt-8 max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-white/15">
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-[#ffeab0]">✦</span>
              <span>ফ্ল্যাশ ডিল প্রতি ২৪ ঘণ্টায় নবায়ন হয়</span>
            </p>
            <p className="text-xs text-white/70 mt-1">
              স্টক অত্যন্ত সীমিত — অফার শেষ হওয়ার আগেই আপনার পছন্দের পণ্যটি নিশ্চিত করুন।
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <a
              href="#order-section"
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector("#order-section");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  window.location.hash = "#order-section";
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#ffe7a4]/50 bg-gradient-to-r from-[#bf2b61] to-[#8e1b42] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(142,27,66,0.4)] backdrop-blur transition-all duration-300 hover:brightness-110 hover:scale-105 active:scale-95"
            >
              <span>এখনই অর্ডার করুন</span>
              <ArrowRight className="h-4 w-4 text-[#ffeab0]" />
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="আগের অফার"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => preserveScroll(() => setActiveIndex((c) => (c - 1 + total) % total))}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/30 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="পরের অফার"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => preserveScroll(() => setActiveIndex((c) => (c + 1) % total))}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/30 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
