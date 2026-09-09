"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "./reference-link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Flower2,
  Gem,
  Gift,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "./utils";
import {
  HERO_THEME_PRESETS,
  HOMEPAGE_DEFAULTS,
  type HeroFeatureBadge,
  type HeroSlideData,
  type HeroThemeName,
  type HeroVariantCard,
} from "./homepage-defaults";

interface HeroSliderProps {
  slides: HeroSlideData[];
  autoPlayMs?: number;
  className?: string;
}

type NormalizedHeroSlide = HeroSlideData & {
  eyebrow: string;
  productName: string;
  titleLine1: string;
  titleLine2: string;
  titleWord1: string;
  titleWord2: string;
  subtitleLine: string;
  eyebrowCategory: string;
  eyebrowTagline: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  bigWord1: string;
  bigWord2: string;
  shortName: string;
  metadataLine: string;
  productImage: string;
  sceneBgImage: string;
  scriptArchNote: string;
  scriptArchSub: string;
  scriptCardNote: string;
  scriptCardSub: string;
  featureBadges: HeroFeatureBadge[];
  cardCategory: string;
  cardSubtitle: string;
  cardSpecs: { label: string; value: string }[];
  variantsList: HeroVariantCard[];
  microTrust: string;
  theme: HeroThemeName;
  infoItems: { label: string; value: string }[];
};

function getBadgeIcon(iconName: string) {
  switch (iconName) {
    case "leaf":
      return Leaf;
    case "flower":
      return Flower2;
    case "gem":
      return Gem;
    case "gift":
      return Gift;
    case "sparkles":
      return Sparkles;
    case "shield":
      return ShieldCheck;
    default:
      return Sparkles;
  }
}

function nonDraftSlide(slide: HeroSlideData) {
  return slide.status !== "draft";
}

function normalizeSlide(slide: HeroSlideData, index: number): NormalizedHeroSlide {
  const fallback = (HOMEPAGE_DEFAULTS.hero[index % HOMEPAGE_DEFAULTS.hero.length] ||
    HOMEPAGE_DEFAULTS.hero[0]) as HeroSlideData;

  const titleWord1 = slide.titleWord1 || slide.titleLine1 || slide.title || fallback.titleWord1 || "Grace";
  const titleWord2 = slide.titleWord2 || slide.titleLine2 || slide.highlight || fallback.titleWord2 || "in Every Step";
  const eyebrowCategory = slide.eyebrowCategory || fallback.eyebrowCategory || "MODEST WEAR";
  const eyebrowTagline = slide.eyebrowTagline || fallback.eyebrowTagline || "FOR A MORE BEAUTIFUL YOU";
  const subtitleLine = slide.subtitleLine || slide.subtitle || fallback.subtitleLine || "TIMELESS MODESTY, BEAUTIFULLY YOURS";
  const productName = slide.productName || fallback.productName || "Floral Prayer Set";
  const cta = slide.ctaPrimary ?? fallback.ctaPrimary;

  const sceneBgImage =
    slide.sceneBgImage ||
    (index === 0
      ? "/niyamah/slider/slider-2-with-bg.png"
      : index === 1
        ? "/niyamah/slider/slider-1-with-bg.png"
        : "/niyamah/slider/slider-3-with-bg.png");

  const featureBadges: HeroFeatureBadge[] =
    slide.featureBadges && slide.featureBadges.length > 0
      ? slide.featureBadges
      : [
          { icon: "leaf", line1: "SOFT &", line2: "COMFORTABLE" },
          { icon: "flower", line1: "BEAUTIFUL", line2: "FLORAL PRINT" },
          { icon: "gem", line1: "ELEGANT", line2: "& MODEST" },
        ];

  const cardSpecs =
    slide.cardSpecs && slide.cardSpecs.length > 0
      ? slide.cardSpecs
      : [
          { label: "Material", value: "Premium Cotton" },
          { label: "Size", value: "All Sizes (Free Size)" },
          { label: "Color", value: "Pink Floral" },
          { label: "What's Included", value: "Telekung + Skirt + Bag" },
        ];

  const variantsList: HeroVariantCard[] =
    slide.variantsList && slide.variantsList.length > 0
      ? slide.variantsList
      : [
          { id: "v1", num: "01", name: "Floral Set", image: "/niyamah/slider/slider-2.png" },
          { id: "v2", num: "02", name: "Sage Green", image: "/niyamah/slider/slider-2.png" },
          { id: "v3", num: "03", name: "Cream Blush", image: "/niyamah/slider/slider-2.png" },
          { id: "v4", num: "04", name: "Classic Black", image: "/niyamah/slider/slider-2.png" },
          { id: "v5", num: "05", name: "Dusty Rose", image: "/niyamah/slider/slider-2.png" },
        ];

  return {
    ...slide,
    eyebrow: slide.eyebrow || `${eyebrowCategory} • ${eyebrowTagline}`,
    eyebrowCategory,
    eyebrowTagline,
    productName,
    titleWord1,
    titleWord2,
    titleLine1: titleWord1,
    titleLine2: titleWord2,
    title: titleWord1,
    highlight: titleWord2,
    subtitleLine,
    subtitle: subtitleLine,
    description: slide.description || fallback.description || "",
    primaryButtonText: slide.primaryButtonText || cta?.label || "SHOP NOW",
    primaryButtonLink: slide.primaryButtonLink || cta?.href || "#order-section",
    bigWord1: (slide.bigWord1 || fallback.bigWord1 || "MODESTY").toUpperCase(),
    bigWord2: (slide.bigWord2 || fallback.bigWord2 || "BEAUTY").toUpperCase(),
    shortName: slide.shortName || productName,
    metadataLine: slide.metadataLine || fallback.metadataLine || "MODEST WEAR",
    productImage: slide.productImage || fallback.productImage || "/niyamah/slider/slider-2.png",
    sceneBgImage,
    scriptArchNote: slide.scriptArchNote || fallback.scriptArchNote || "Modesty",
    scriptArchSub: slide.scriptArchSub || fallback.scriptArchSub || "Looks Beautiful ♡",
    scriptCardNote: slide.scriptCardNote || fallback.scriptCardNote || "Modesty",
    scriptCardSub: slide.scriptCardSub || fallback.scriptCardSub || "is a form of beauty ♡",
    featureBadges,
    cardCategory: slide.cardCategory || `0${index + 1} / 05`,
    cardSubtitle: slide.cardSubtitle || fallback.cardSubtitle || "SIGNATURE COLLECTION",
    cardSpecs,
    variantsList,
    microTrust: slide.microTrust || "WEAR GOODNESS  •  SPREAD BEAUTY  •  BE YOU",
    theme: slide.theme && slide.theme in HERO_THEME_PRESETS ? slide.theme : "blush",
    infoItems: slide.infoItems || fallback.infoItems || [],
  };
}

function getVisibleSlides(slides: HeroSlideData[]) {
  const source = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const visible = source.filter(nonDraftSlide);
  const curatedFallback = (HOMEPAGE_DEFAULTS.hero as HeroSlideData[]).filter(nonDraftSlide);
  return (visible.length > 0 ? visible : curatedFallback).map(normalizeSlide);
}

function slideNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function HeroSlider({ slides, autoPlayMs = 7500, className }: HeroSliderProps) {
  const safeSlides = useMemo(() => getVisibleSlides(slides), [slides]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const rootRef = useRef<HTMLElement | null>(null);
  const max = safeSlides.length;
  const safeCurrent = max > 0 ? current % max : 0;
  const active = safeSlides[safeCurrent];

  const prev = useCallback(() => {
    if (max < 2) return;
    setDirection(-1);
    setCurrent((value) => (value - 1 + max) % max);
  }, [max]);

  const next = useCallback(() => {
    if (max < 2) return;
    setDirection(1);
    setCurrent((value) => (value + 1) % max);
  }, [max]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index >= safeCurrent ? 1 : -1);
    setCurrent(index);
  }, [safeCurrent]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHeroVisible) return;
      if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHeroVisible, next, prev]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (max < 2 || !isHeroVisible) return;
    const id = window.setInterval(next, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, isHeroVisible, max, next]);

  if (!active) return null;

  const theme = HERO_THEME_PRESETS[active.theme] || HERO_THEME_PRESETS.blush;
  const rootStyle = {
    "--hero-bg": theme.bg,
    "--hero-text": theme.text,
    "--hero-muted": theme.muted,
    "--hero-accent": theme.accent,
    "--hero-button-bg": theme.buttonBg,
    "--hero-button-text": theme.buttonText,
    "--hero-panel": theme.panel,
    "--hero-word": theme.word,
    "--hero-shadow": theme.shadow,
  } as CSSProperties;

  return (
    <section
      id="hero"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Niyamah Featured Collections"
      className={cn(
        "allfather-product-slider relative isolate w-full overflow-hidden text-[var(--hero-text)] h-[840px] lg:h-[920px] max-h-[960px] min-h-[740px] pt-20 transition-colors duration-1000 ease-out select-none",
        className,
      )}
      style={rootStyle}
    >
      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={active.id ?? safeCurrent}
          custom={direction}
          variants={{
            enter: (way: number) => ({ opacity: 0 }),
            center: { opacity: 1 },
            leave: (way: number) => ({ opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="leave"
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${active.sceneBgImage}')`,
          }}
        >
          {/* Subtle Ambient Sunlight Glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10" />

          {/* Master 3-Column Desktop Layout Matching Reference Image 3 */}
          <div className="relative z-10 mx-auto h-full w-full max-w-[1920px] px-6 sm:px-10 lg:px-14 xl:px-20 grid grid-cols-1 lg:grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.1fr)_minmax(300px,0.85fr)] items-center">
            {/* LEFT COLUMN: Arch Watermark & Product Stage */}
            <div className="relative h-full flex flex-col justify-between py-10 lg:py-16">
              {/* Top-Left Cursive Script Note over Arch */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="select-none pointer-events-none mt-2 lg:mt-6 pl-2"
              >
                <div
                  className="text-2xl sm:text-3xl xl:text-4xl text-[#8f4d60]/90 font-medium leading-[1.15] drop-shadow-sm -rotate-6"
                  style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }}
                >
                  <p>{active.scriptArchNote}</p>
                  <p className="mt-1 flex items-center gap-1.5">
                    <span>{active.scriptArchSub}</span>
                  </p>
                </div>
              </motion.div>

              {/* Pedestal Area Glow Indicator */}
              <div className="pointer-events-none absolute bottom-12 left-10 h-32 w-64 rounded-full bg-[#8f4d60]/5 blur-3xl" />
            </div>

            {/* CENTER COLUMN: Hero Headline, Badges, CTA, and Micro-Trust */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="flex flex-col items-center justify-center text-center px-2 sm:px-6 z-20"
            >
              {/* Eyebrow / Category Tag */}
              <div className="flex flex-col items-center mb-2.5 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-[#8f4d60] uppercase">
                  — {active.eyebrowCategory} —
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-[#6a3343] uppercase mt-1">
                  {active.eyebrowTagline}
                </span>
              </div>

              {/* Main Headline: Grace in Every Step */}
              <h1 className="leading-[1.03] tracking-tight my-1 text-center select-text">
                <span
                  className="block font-normal text-5xl sm:text-6xl xl:text-[76px] tracking-tight text-[#522230]"
                  style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                >
                  {active.titleWord1}
                </span>
                <span
                  className="block italic font-normal text-4xl sm:text-5xl xl:text-[62px] text-[#6a3343] mt-0.5"
                  style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                >
                  {active.titleWord2}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-3.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#7a4857]">
                {active.subtitleLine}
              </p>

              {/* 3 Circular Feature Badges */}
              <div className="mt-6 sm:mt-7 flex items-center justify-center gap-7 sm:gap-9 xl:gap-11">
                {active.featureBadges.map((badge, idx) => {
                  const Icon = getBadgeIcon(badge.icon);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center group cursor-default transition-transform duration-300 hover:scale-105"
                    >
                      <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border border-[#b88c98] bg-white/45 text-[#6a3343] shadow-[0_4px_14px_rgba(92,42,56,0.06)] backdrop-blur-sm transition-all duration-300 group-hover:bg-white/70 group-hover:border-[#8f4d60]">
                        <Icon className="h-5 w-5 stroke-[1.4]" />
                      </div>
                      <span className="mt-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#522230] leading-[1.25] block">
                        {badge.line1}
                        <br />
                        {badge.line2}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Primary Call to Action Button */}
              <div className="mt-7 sm:mt-8 flex flex-col items-center">
                <Link
                  href={active.primaryButtonLink}
                  className="group inline-flex h-11 sm:h-12 items-center justify-center gap-3 rounded-full bg-[#8f4d60] px-9 sm:px-11 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_25px_rgba(143,77,96,0.35)] transition-all duration-300 hover:bg-[#7a3e4f] hover:shadow-[0_12px_32px_rgba(143,77,96,0.45)] hover:scale-105 active:scale-95"
                >
                  <span>{active.primaryButtonText}</span>
                  <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>

                <p className="mt-4 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8a5a68]">
                  {active.microTrust}
                </p>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Arched Monograph Spec Card & Lower Handwriting Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="flex flex-col items-center lg:items-end justify-center z-20 py-6"
            >
              {/* Arched Translucent Specification Card */}
              <div className="w-[280px] sm:w-[310px] xl:w-[330px] rounded-t-[140px] sm:rounded-t-[165px] rounded-b-2xl border border-white/85 bg-white/70 backdrop-blur-md px-6 sm:px-7 pt-9 sm:pt-10 pb-6 shadow-[0_24px_55px_rgba(92,42,56,0.09)]">
                {/* 01 / 05 Counter */}
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-1 text-[#522230]">
                    <span
                      className="text-2xl sm:text-3xl font-normal tracking-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {slideNumber(safeCurrent)}
                    </span>
                    <span className="text-sm font-light text-[#8a5a68] mx-0.5">/</span>
                    <span className="text-xs font-mono tracking-widest text-[#8a5a68]">
                      {active.cardCategory ? active.cardCategory.split('/')[1]?.trim() : "05"}
                    </span>
                  </div>
                  <div className="w-8 h-px bg-[#8f4d60]/70 mt-1" />
                </div>

                {/* Subtitle & Title */}
                <div className="text-center mt-3 sm:mt-3.5">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a5a68] block">
                    {active.cardSubtitle}
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-medium text-[#4a1c2a] mt-1 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                  >
                    {active.productName}
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8f4d60] block mt-0.5">
                    {active.metadataLine}
                  </span>
                </div>

                {/* Divider Line */}
                <div className="my-3.5 sm:my-4 h-px w-full bg-[#dfc0c7]/80" />

                {/* Key-Value Specifications */}
                <div className="flex flex-col gap-2 sm:gap-2.5">
                  {active.cardSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-[#7a4857] font-medium tracking-wide">
                        {spec.label}
                      </span>
                      <span className="text-[#3b1723] font-semibold text-right">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cursive Handwriting Note Under Card */}
              <div className="mt-3 text-center w-[280px] sm:w-[310px] xl:w-[330px] select-none pointer-events-none">
                <div
                  className="text-xl sm:text-2xl text-[#8f4d60]/90 font-medium leading-[1.2] drop-shadow-sm"
                  style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }}
                >
                  <p>{active.scriptCardNote}</p>
                  <p className="mt-0.5">{active.scriptCardSub}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* NAVIGATION CONTROLS */}
      {/* Left Circular Arrow */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 sm:left-6 xl:left-8 top-1/2 z-40 flex h-11 w-11 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#ebd3d8] bg-white/80 text-[#6a3343] shadow-[0_6px_20px_rgba(92,42,56,0.1)] backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-[#8f4d60] hover:scale-105 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Right Circular Arrow */}
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 sm:right-6 xl:right-8 top-1/2 z-40 flex h-11 w-11 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#ebd3d8] bg-white/80 text-[#6a3343] shadow-[0_6px_20px_rgba(92,42,56,0.1)] backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-[#8f4d60] hover:scale-105 active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* FLOATING VARIANT DOCK AT BOTTOM RIGHT */}
      <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-8 xl:right-14 z-40 hidden sm:flex items-center gap-2 sm:gap-2.5">
        {active.variantsList.map((variant, idx) => {
          const isSelected = idx === safeCurrent;
          return (
            <button
              key={variant.id || idx}
              type="button"
              onClick={() => goToSlide(idx % max)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex items-center gap-2 sm:gap-2.5 rounded-lg border px-2 sm:px-2.5 py-1.5 transition-all duration-300 backdrop-blur-md text-left",
                isSelected
                  ? "border-[#8f4d60] bg-white/95 shadow-[0_8px_20px_rgba(143,77,96,0.18)] ring-1 ring-[#8f4d60]/40"
                  : "border-white/70 bg-white/65 hover:bg-white/85 opacity-80 hover:opacity-100",
              )}
            >
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded bg-white/80 p-0.5">
                <img
                  src={variant.image}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="pr-1">
                <span className="block text-[9px] font-mono font-bold text-[#8a5a68]">
                  {variant.num}
                </span>
                <span className="block text-[10px] font-bold text-[#4a1c2a] whitespace-nowrap">
                  {variant.name}
                </span>
              </div>
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#8f4d60]" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
