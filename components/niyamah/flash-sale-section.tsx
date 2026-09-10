"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { CountdownTimer } from "./countdown-timer";
import {
  ProductStoryCard,
  type ProductStoryCardData,
  type ProductStoryTone,
} from "./product-story-card";
import { cn } from "./utils";

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

// Deep, atmospheric luxury tones matching the brand DNA
const LUXURY_EDITORIAL_TONES: ProductStoryTone[] = [
  // 1. Orchid Perfume: Noir Rose Wine & Radiant Gold
  {
    bg: "#3a0e1c",
    panel: "rgba(68, 18, 36, 0.65)",
    text: "#ffffff",
    muted: "rgba(255, 235, 240, 0.72)",
    accent: "#ffeab0",
    badgeBg: "rgba(146, 18, 62, 0.85)",
    badgeText: "#ffffff",
  },
  // 2. Floral Prayer Set: Velvet Plum Burgundy & Soft Champagne
  {
    bg: "#2e0d19",
    panel: "rgba(55, 15, 32, 0.65)",
    text: "#ffffff",
    muted: "rgba(255, 235, 240, 0.72)",
    accent: "#e5b887",
    badgeBg: "rgba(143, 77, 96, 0.85)",
    badgeText: "#ffffff",
  },
  // 3. Tulip Gift Package: Warm Imperial Burgundy & Amber Rose
  {
    bg: "#351116",
    panel: "rgba(62, 20, 26, 0.65)",
    text: "#ffffff",
    muted: "rgba(255, 235, 240, 0.72)",
    accent: "#f4a261",
    badgeBg: "rgba(168, 50, 88, 0.85)",
    badgeText: "#ffffff",
  },
];

// The 3 core products with exact prices & discounts
const FLASH_PRODUCTS: ProductStoryCardData[] = [
  {
    id: "fs-1",
    slug: "orchid-perfume",
    name: "অর্কিড পারফিউম",
    nameEn: "Orchid Perfume",
    image: "/niyamah/slider/slider-1-f.png",
    price: 850,
    originalPrice: 1050,
    categoryName: "প্রিমিয়াম আতর কালেকশন",
    badge: "২০০/- ছাড়",
    storyLabel: "আভিজাত্যের সুবাস • Artisanal Perfume",
    inStock: true,
    tone: LUXURY_EDITORIAL_TONES[0]!,
  },
  {
    id: "fs-2",
    slug: "floral-prayer-set",
    name: "ফ্লোরাল প্রেয়ার সেট",
    nameEn: "Floral Prayer Set",
    image: "/niyamah/slider/slider-2-f.png",
    price: 800,
    originalPrice: 850,
    categoryName: "প্রিমিয়াম প্রেয়ার কালেকশন",
    badge: "৫০/- ছাড়",
    storyLabel: "ইবাদতে প্রশান্তি • Cotton Telekung",
    inStock: true,
    tone: LUXURY_EDITORIAL_TONES[1]!,
  },
  {
    id: "fs-3",
    slug: "blossom-tote",
    name: "টিউলিপ গিফট প্যাকেজ",
    nameEn: "Tulip Gift Package",
    image: "/niyamah/slider/slider-3-f.png",
    price: 1225,
    originalPrice: 1350,
    categoryName: "ব্লসম গিফট কালেকশন",
    badge: "১২৫/- ছাড়",
    storyLabel: "রেডি-টু-গিফট • Blossom Tote Set",
    inStock: true,
    tone: LUXURY_EDITORIAL_TONES[2]!,
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
    const gap = w >= 640 ? 24 : 16;
    const padding = w >= 1024 ? 40 : w >= 640 ? 28 : 16;
    const openWidth = Math.min(w * 0.84, 560);
    const closedWidth = Math.min(w * 0.24, 160);
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

  // Measured, luxurious auto-play interval (5.5s)
  useEffect(() => {
    if (total < 2) return;
    const id = window.setInterval(() => {
      if (!hovered.current && isVisible.current) next();
    }, 5500);
    return () => window.clearInterval(id);
  }, [total, next]);

  const sectionStyle = {
    "--story-bg": active.tone?.bg ?? "#3a0e1c",
    "--story-text": active.tone?.text ?? "#ffffff",
    "--story-muted": active.tone?.muted ?? "rgba(255,235,240,0.72)",
    "--story-accent": active.tone?.accent ?? "#ffeab0",
  } as CSSProperties;

  const toBn = (n: number) =>
    String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

  return (
    <section
      id="flash-sale"
      ref={sectionRef}
      style={sectionStyle}
      className="relative isolate overflow-hidden bg-[var(--story-bg)] py-16 text-[var(--story-text)] transition-colors duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] [contain:paint] [overflow-anchor:none] sm:py-20 lg:py-24"
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
    >
      {/* Cinematic Lighting & Atmospheric Radial Vignettes — NO GRID */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(255,235,242,0.14)_0%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,240,245,0.08)_0%,transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45"
      />

      {/* Header — Dior / Chanel Magazine Style */}
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {/* Small Refined Eyebrow */}
            <p className="mb-3.5 flex items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-[0.24em] text-[#ffeab0]/90">
              <Flame className="h-3.5 w-3.5 text-[#ffeab0]" />
              <span>লিমিটেড ফ্ল্যাশ ডিল • আজকের বিশেষ আয়োজন</span>
            </p>

            {/* Editorial Heading */}
            <h2 className="font-serif text-3xl font-normal leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              সেরা অফার,{" "}
              <span className="italic font-light text-[#fbcfe8]">
                যা দ্রুত শেষ হয়ে যাচ্ছে
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-4 max-w-xl text-sm sm:text-base font-light leading-relaxed text-white/75">
              নিয়ামাহ্-র সিগনেচার কালেকশনের সেরা ৩টি পণ্য — আকর্ষণীয় ডিসকাউন্টে সংগ্রহ করুন কেবল আজকের জন্য।
            </p>
          </div>

          {/* Minimal Editorial Countdown */}
          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
            <p className="mb-2 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#ffeab0]/90">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffeab0] animate-pulse" />
              <span>অফার শেষ হতে বাকি</span>
            </p>
            <CountdownTimer
              durationHours={24}
              lang="bn"
              className="[&_.rounded-md]:!bg-black/35 [&_.rounded-md]:!border [&_.rounded-md]:!border-white/15 [&_.rounded-md]:!text-[#ffeab0] [&_.text-xs]:!text-white/60"
            />
          </div>
        </div>
      </div>

      {/* Slider Viewport — Showroom Display */}
      <div
        ref={viewportRef}
        className="relative z-10 h-[440px] overflow-hidden [overflow-anchor:none] sm:h-[510px]"
      >
        <motion.div
          className="flex h-full w-max items-center gap-4 px-4 [overflow-anchor:none] [perspective:1200px] sm:gap-6 sm:px-6 lg:px-8"
          animate={{ x: trackX }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
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

      {/* Editorial Bottom Navigation & Storytelling */}
      <div className="relative z-10 mx-auto mt-10 max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* 01 ───────── 02 ───────── 03 Minimal Fashion Catalogue Navigation */}
        <div className="grid grid-cols-3 gap-3 sm:gap-8 items-start border-t border-white/15 pt-6">
          {items.map((prod, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => goTo(idx)}
                className="group flex flex-col text-left transition-all duration-500 focus:outline-none"
              >
                {/* Number & Connecting Line */}
                <div className="flex items-center gap-2 sm:gap-4 mb-2">
                  <span
                    className={cn(
                      "font-mono text-xs sm:text-sm font-semibold transition-colors duration-500",
                      isActive
                        ? "text-[#ffeab0]"
                        : "text-white/40 group-hover:text-white/70",
                    )}
                  >
                    {toBn(idx + 1)}
                  </span>
                  <div className="relative flex-1 h-[1.5px] bg-white/15 overflow-hidden rounded-full">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffeab0] to-[#f4a261]"
                      initial={false}
                      animate={{ width: isActive ? "100%" : "0%" }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                {/* Name & Bengali Price */}
                <span
                  className={cn(
                    "font-serif text-xs sm:text-base leading-tight transition-colors duration-500 truncate",
                    isActive
                      ? "font-semibold text-white"
                      : "text-white/50 group-hover:text-white/80 font-normal",
                  )}
                >
                  {prod.name}
                </span>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-mono transition-colors duration-500 mt-0.5",
                    isActive ? "text-[#ffeab0]" : "text-white/35",
                  )}
                >
                  ৳{prod.price.toLocaleString("bn-BD")}/-
                </span>
              </button>
            );
          })}
        </div>

        {/* Minimal Urgency Indicator & Directional Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {(() => {
            const claimed = CLAIMED[activeIndex] ?? 84;
            const left = 100 - claimed;
            return (
              <div className="flex items-center gap-3 sm:gap-4 text-xs font-light text-white/75">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffeab0] animate-ping" />
                  স্টক বুকিং:{" "}
                  <strong className="font-semibold text-white">
                    {toBn(claimed)}%
                  </strong>
                </span>
                <span className="text-white/30">•</span>
                <span>
                  অবশিষ্ট:{" "}
                  <strong className="font-semibold text-[#ffeab0]">
                    {toBn(left)} টি
                  </strong>
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="hidden sm:inline text-white/60">
                  প্রতি ২৪ ঘণ্টায় অফার নবায়ন
                </span>
              </div>
            );
          })()}

          {/* Minimal Editorial Arrows */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              aria-label="আগের অফার"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                preserveScroll(() =>
                  setActiveIndex((c) => (c - 1 + total) % total),
                )
              }
              className="h-10 w-10 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 backdrop-blur transition-all duration-300 hover:border-[#ffeab0] hover:text-[#ffeab0] hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="পরের অফার"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                preserveScroll(() => setActiveIndex((c) => (c + 1) % total))
              }
              className="h-10 w-10 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 backdrop-blur transition-all duration-300 hover:border-[#ffeab0] hover:text-[#ffeab0] hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
