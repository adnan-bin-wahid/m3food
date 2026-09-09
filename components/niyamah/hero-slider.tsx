"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "./reference-link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { cn } from "./utils";
import {
  HERO_THEME_PRESETS,
  HOMEPAGE_DEFAULTS,
  type HeroSlideData,
  type HeroThemeName,
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
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  bigWord1: string;
  bigWord2: string;
  shortName: string;
  metadataLine: string;
  productImage: string;
  theme: HeroThemeName;
  infoItems: { label: string; value: string }[];
};

const PLACEHOLDER_TEXT = new Set(
  [
    "new product feature",
    "product",
    "featured product",
    "short product promise",
    "write a short customer-friendly message for this slide.",
  ].map((value) => value.toLowerCase()),
);

function isPlaceholder(value?: string | null) {
  if (!value) return false;
  const clean = value.trim().toLowerCase();
  return PLACEHOLDER_TEXT.has(clean) || clean.includes("write a short");
}

function limitText(value: string | undefined, fallback: string, max: number) {
  const clean = value?.trim();
  const safe = clean && !isPlaceholder(clean) ? clean : fallback;
  return safe.length > max ? `${safe.slice(0, Math.max(0, max - 1)).trim()}...` : safe;
}

function nonDraftSlide(slide: HeroSlideData) {
  return slide.status !== "draft";
}

function firstUsable(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim() && !isPlaceholder(value))?.trim();
}

function imageForSlide(slide: HeroSlideData, fallback: HeroSlideData) {
  const image = slide.productImage?.trim();
  if (image) return image;

  const key = `${slide.id} ${slide.productName ?? ""} ${slide.cardName ?? ""} ${slide.title ?? ""}`.toLowerCase();
  if (key.includes("hijab") || key.includes("silk")) return "/niyamah/editorial/hijab-drape.jpg";
  if (key.includes("attar") || key.includes("perfume") || key.includes("oud")) return "/niyamah/editorial/perfume-flacon.jpg";
  if (key.includes("gift")) return "/niyamah/hero/hero-gift-box.png";
  if (key.includes("prayer") || key.includes("tasbih")) return "/niyamah/hero/hero-prayer-mat.png";
  if (key.includes("quran") || key.includes("barakah")) return "/niyamah/hero/hero-quran.png";

  return fallback.productImage || "/logo.png";
}

function legacyFallbackText(value: string | undefined, fallback: string) {
  const clean = value?.trim();
  return clean && !isPlaceholder(clean) ? clean : fallback;
}

function normalizeSlide(slide: HeroSlideData, index: number): NormalizedHeroSlide {
  const fallback = HOMEPAGE_DEFAULTS.hero[index % HOMEPAGE_DEFAULTS.hero.length] as HeroSlideData;
  const titleLine1 = limitText(
    firstUsable(slide.titleLine1, slide.title),
    fallback.titleLine1 || fallback.title,
    28,
  );
  const titleLine2 = limitText(
    firstUsable(slide.titleLine2, slide.highlight),
    fallback.titleLine2 || fallback.highlight || "With Meaning",
    28,
  );
  const description = limitText(
    firstUsable(slide.description, slide.subtitle),
    fallback.description || fallback.subtitle,
    160,
  );
  const productName = limitText(
    firstUsable(slide.productName, slide.subheading, slide.cardName),
    fallback.productName || "Islamic Essentials",
    36,
  );
  const cta = slide.ctaPrimary ?? fallback.ctaPrimary;

  return {
    ...slide,
    eyebrow: limitText(firstUsable(slide.eyebrow), fallback.eyebrow || "Niyamah Atelier", 32),
    productName,
    titleLine1,
    titleLine2,
    title: titleLine1,
    highlight: titleLine2,
    description,
    subtitle: description,
    primaryButtonText: limitText(firstUsable(slide.primaryButtonText, cta?.label), "Shop Now", 24),
    primaryButtonLink: slide.primaryButtonLink || cta?.href || "/products",
    bigWord1: limitText(firstUsable(slide.bigWord1, slide.decoration, productName), "NIYAMAH", 14).toUpperCase(),
    bigWord2: limitText(firstUsable(slide.bigWord2, slide.highlight), "ATELIER", 14).toUpperCase(),
    shortName: limitText(firstUsable(slide.shortName, slide.cardName, productName), productName, 20),
    metadataLine: limitText(firstUsable(slide.metadataLine, slide.badge), "Curated Monograph / 2026", 36),
    productImage: imageForSlide(slide, fallback),
    productImageAlt: slide.productImageAlt || productName,
    subheading: legacyFallbackText(slide.subheading, fallback.subheading || productName),
    theme: slide.theme && slide.theme in HERO_THEME_PRESETS ? slide.theme : fallback.theme || "cream",
    infoItems:
      slide.infoItems && slide.infoItems.length > 0
        ? slide.infoItems.slice(0, 3)
        : [
            { label: "Delivery", value: "1-3 Days" },
            { label: "Payment", value: "COD" },
            { label: "Guarantee", value: "7-Day Return" },
          ],
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

export function HeroSlider({ slides, autoPlayMs = 7200, className }: HeroSliderProps) {
  const safeSlides = useMemo(() => getVisibleSlides(slides), [slides]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const rootRef = useRef<HTMLElement | null>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileThumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const max = safeSlides.length;
  const safeCurrent = max > 0 ? current % max : 0;
  const active = safeSlides[safeCurrent];

  const scrollThumbnailRail = useCallback((button: HTMLButtonElement | null) => {
    if (!button) return;

    const rail = button.closest("[data-hero-thumbnail-rail]") as HTMLElement | null;
    if (!rail) return;

    const left = button.offsetLeft - (rail.clientWidth - button.clientWidth) / 2;
    rail.scrollTo({
      left: Math.max(0, left),
      behavior: "smooth",
    });
  }, []);

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

  // Keyboard navigation support (Left / Right arrow keys)
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

  useEffect(() => {
    scrollThumbnailRail(thumbnailRefs.current[safeCurrent] ?? null);
    scrollThumbnailRail(mobileThumbnailRefs.current[safeCurrent] ?? null);
  }, [safeCurrent, scrollThumbnailRail]);

  if (!active) return null;

  const theme = HERO_THEME_PRESETS[active.theme];
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

  const isEditorialPhoto = Boolean(
    active.productImage?.match(/\.(jpe?g|webp|avif)($|\?)/i),
  );

  return (
    <section
      id="hero"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Niyamah Featured Collections"
      className={cn(
        "allfather-product-slider relative isolate w-full overflow-hidden bg-[var(--hero-bg)] text-[var(--hero-text)] min-h-[620px] lg:h-[calc(100vh-5rem)] lg:min-h-[640px] lg:max-h-[940px] transition-colors duration-1000 ease-out",
        className,
      )}
      style={rootStyle}
    >
      {/* Background Sacred Geometric Lattice Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Subtle Architectural Arch Motif */}
      <div className="pointer-events-none absolute right-[8%] top-[8%] hidden h-[580px] w-[380px] rounded-t-[190px] border border-[var(--hero-accent)]/20 lg:block opacity-60" />

      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={active.id ?? safeCurrent}
          custom={direction}
          variants={{
            enter: (way: number) => ({ x: `${way * 100}vw`, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            leave: (way: number) => ({ x: `${way * -100}vw`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="leave"
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Atmospheric Watermark Ghost Typography */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end overflow-hidden pb-24 pt-72 select-none sm:pt-80 lg:justify-center lg:pb-24 lg:pt-16">
            {[active.bigWord1, active.bigWord2].map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ x: index % 2 === 0 ? -60 : 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.15, delay: 0.1 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "block whitespace-nowrap font-serif italic font-light uppercase leading-[0.85] tracking-tight text-[var(--hero-word)] opacity-50",
                  "text-[22vw] sm:text-[18vw] md:text-[14vw] lg:text-[12vw]",
                  index % 2 === 1 && "self-end",
                )}
              >
                {word}
              </motion.span>
            ))}
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1920px] grid-rows-[auto_auto_auto] gap-4 px-4 sm:px-6 md:px-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(300px,0.95fr)_minmax(420px,1.05fr)_minmax(240px,0.75fr)] lg:grid-rows-1 lg:gap-6 lg:gap-x-8 xl:gap-x-12 lg:px-10 xl:px-14 2xl:px-16 lg:items-center lg:pt-4 lg:pb-24">
            {/* RIGHT / ASIDE COLUMN (Desktop Metronome & Monograph Details) */}
            <motion.aside
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="row-start-1 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--hero-text)]/10 pb-4 lg:col-start-3 lg:row-start-1 lg:flex-col lg:justify-start lg:border-b-0 lg:pb-0 lg:pt-4 xl:pt-8"
            >
              {/* Metronome Counter */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl font-normal text-[var(--hero-accent)] lg:text-4xl">
                  {slideNumber(safeCurrent)}
                </span>
                <span className="text-[var(--hero-muted)]/40 font-light mx-1 text-lg">/</span>
                <span className="text-xs font-mono tracking-widest text-[var(--hero-muted)]">
                  {slideNumber(max - 1)}
                </span>
              </div>

              {/* Progress Timeline Bar for Desktop */}
              <div className="hidden lg:block w-full max-w-[140px] h-[2px] bg-[var(--hero-text)]/12 overflow-hidden relative rounded-full">
                <motion.div
                  key={`progress-${safeCurrent}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: autoPlayMs / 1000, ease: "linear" }}
                  className="h-full bg-[var(--hero-accent)] rounded-full"
                />
              </div>

              {/* Monograph Titles */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.24em] text-[var(--hero-muted)]">
                  {active.eyebrow}
                </p>
                <p className="font-serif text-lg font-medium leading-tight text-[var(--hero-text)] lg:text-xl">
                  {active.productName}
                </p>
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.18em] text-[var(--hero-accent)]">
                  {active.metadataLine}
                </p>
              </div>

              {/* Monograph Spec Ledger */}
              <div className="hidden lg:flex flex-col gap-3 w-full max-w-[210px] pt-5 border-t border-[var(--hero-text)]/12">
                {active.infoItems.slice(0, 3).map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex items-center justify-between text-xs pb-1 border-b border-[var(--hero-text)]/6">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--hero-muted)]">
                      {item.label}
                    </span>
                    <span className="font-semibold text-[var(--hero-text)]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.aside>

            {/* LEFT COLUMN (Product Visual Stage with Ambient Aura & Arched Frame) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative row-start-2 flex min-h-[260px] items-center justify-center sm:min-h-[340px] lg:col-start-1 lg:row-start-1 lg:min-h-[620px]"
            >
              {/* Radial Luminous Halo */}
              <div className="pointer-events-none absolute h-[260px] w-[260px] rounded-full bg-[var(--hero-accent)]/22 blur-[72px] sm:h-[340px] sm:w-[340px] lg:h-[420px] lg:w-[420px] lg:blur-[92px]" />

              {/* Ambient Contact Shadow */}
              <div className="pointer-events-none absolute inset-x-[16%] bottom-[8%] h-14 rounded-full bg-black/18 blur-2xl" />

              {isEditorialPhoto ? (
                /* Architectural Arched Portrait Window for Editorial Photography */
                <div className="relative aspect-[4/5] w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[min(380px,46vh)] overflow-hidden rounded-t-[140px] sm:rounded-t-[180px] rounded-b-2xl border border-[var(--hero-accent)]/30 shadow-[0_28px_65px_var(--hero-shadow)]">
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                    className="relative h-full w-full"
                  >
                    <ImageWithFallback
                      src={active.productImage}
                      alt={active.productImageAlt || active.productName}
                      fill
                      priority={safeCurrent === 0}
                      sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 520px"
                      className="object-cover"
                    />
                  </motion.div>
                  {/* Subtle Inner Hairline Bevel Rim */}
                  <div className="pointer-events-none absolute inset-2.5 rounded-t-[130px] sm:rounded-t-[170px] rounded-b-xl border border-white/25" />

                  {/* Floating Luxury Badge */}
                  {active.badge && (
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--hero-accent)]/40 bg-[var(--hero-bg)]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--hero-text)] shadow-md backdrop-blur-md">
                      <Sparkles className="h-3 w-3 text-[var(--hero-accent)]" />
                      <span>{active.badge}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Floating Organic Presentation with Breathing Motion for Cutout Products */
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative h-[220px] w-full max-w-[360px] sm:h-[300px] lg:h-[min(460px,50vh)] lg:max-w-[440px]"
                >
                  <ImageWithFallback
                    src={active.productImage}
                    alt={active.productImageAlt || active.productName}
                    fill
                    priority={safeCurrent === 0}
                    sizes="(max-width: 768px) 92vw, (max-width: 1200px) 48vw, 620px"
                    className="scale-[1.05] object-contain drop-shadow-[0_28px_50px_var(--hero-shadow)] sm:scale-[1.08] lg:scale-[1.05]"
                  />

                  {/* Floating Luxury Badge */}
                  {active.badge && (
                    <div className="absolute bottom-2 left-4 sm:bottom-3 sm:left-6 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--hero-accent)]/40 bg-[var(--hero-bg)]/90 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--hero-text)] shadow-lg backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--hero-accent)]" />
                      <span>{active.badge}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* CENTER COLUMN (Editorial Headline, Narrative, Luxury CTA & Micro-Trust Strip) */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="row-start-3 flex flex-col justify-center lg:col-start-2 lg:row-start-1 lg:pt-0"
            >
              <div className="max-w-xl lg:max-w-lg">
                {/* Eyebrow / Monograph Tag */}
                <div className="mb-2 flex items-center gap-2 lg:mb-2.5">
                  <span className="h-px w-5 bg-[var(--hero-accent)]" />
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--hero-accent)]">
                    {active.subheading || active.eyebrow}
                  </p>
                </div>

                {/* Editorial High-Fashion H1: Roman Serif + Italic Gold Serif */}
                <h1 className="font-serif leading-[1.05] tracking-[-0.02em] text-[clamp(2.1rem,6.2vw,3.6rem)] text-[var(--hero-text)] lg:text-[clamp(2.5rem,3.2vw,4rem)]">
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="block font-light"
                  >
                    {active.titleLine1}
                  </motion.span>
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="block font-normal italic text-[var(--hero-accent)] mt-1"
                  >
                    {active.titleLine2}
                  </motion.span>
                </h1>

                {/* Narrative Description */}
                <motion.p
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 line-clamp-3 max-w-md text-xs sm:text-sm font-normal leading-relaxed text-[var(--hero-muted)] sm:leading-6 lg:mt-3.5"
                >
                  {active.description}
                </motion.p>

                {/* Luxury Action Bar: Primary Tactile Button + Secondary Action */}
                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5 flex flex-wrap items-center gap-3.5 lg:mt-6"
                >
                  <Link
                    href={active.primaryButtonLink}
                    style={{
                      backgroundColor: "var(--hero-button-bg)",
                      color: "var(--hero-button-text)",
                    }}
                    className="group relative inline-flex h-11 sm:h-12 items-center justify-center gap-2.5 overflow-hidden rounded-[2px] border border-[var(--hero-accent)]/55 px-6 sm:px-7 text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_16px_36px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(0,0,0,0.18)]"
                  >
                    <span>{active.primaryButtonText}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>

                  {active.ctaSecondary?.href && (
                    <Link
                      href={active.ctaSecondary.href}
                      className="inline-flex h-11 sm:h-12 items-center justify-center px-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--hero-text)] opacity-75 underline-offset-8 transition-opacity hover:opacity-100 hover:underline"
                    >
                      {active.ctaSecondary.label}
                    </Link>
                  )}
                </motion.div>

                {/* 3 Luxury Micro-Trust Assurance Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.68 }}
                  className="mt-4 grid grid-cols-3 gap-2.5 border-t border-[var(--hero-text)]/12 pt-3 sm:gap-3 lg:mt-5 lg:pt-3.5"
                >
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 shrink-0 text-[var(--hero-accent)] mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--hero-text)]">
                        ১–৩ দিন • Express
                      </p>
                      <p className="truncate text-[10px] text-[var(--hero-muted)]">
                        সারা দেশে হোম ডেলিভারি
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--hero-accent)] mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--hero-text)]">
                        ক্যাশ অন ডেলিভারি
                      </p>
                      <p className="truncate text-[10px] text-[var(--hero-muted)]">
                        দেখে মূল্য পরিশোধ (COD)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <RotateCcw className="h-4 w-4 shrink-0 text-[var(--hero-accent)] mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--hero-text)]">
                        ৭ দিনের রিটার্ন
                      </p>
                      <p className="truncate text-[10px] text-[var(--hero-muted)]">
                        নিশ্চিন্ত এক্সচেঞ্জ সুবিধা
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* NAVIGATION CONTROLS & THUMBNAIL RAILS */}
      {max > 1 && (
        <>
          {/* Mobile Thumbnail Strip */}
          <div className="absolute inset-x-0 top-3 z-40 px-4 lg:hidden">
            <div
              data-hero-thumbnail-rail
              className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-2.5 pr-4">
                {safeSlides.map((slide, index) => {
                  const selected = index === safeCurrent;
                  return (
                    <button
                      key={slide.id ?? index}
                      ref={(node) => {
                        mobileThumbnailRefs.current[index] = node;
                      }}
                      type="button"
                      onClick={() => goToSlide(index)}
                      aria-pressed={selected}
                      className={cn(
                        "group relative flex h-16 min-w-[130px] items-center gap-2 overflow-hidden border p-2 text-left backdrop-blur transition-all duration-300 sm:h-20 sm:min-w-[160px]",
                        selected
                          ? "min-w-[155px] border-[var(--hero-accent)] bg-white/80 shadow-[0_12px_28px_rgba(0,0,0,0.12)] sm:min-w-[190px]"
                          : "border-[var(--hero-text)]/12 bg-white/30 opacity-65 hover:opacity-90",
                      )}
                      aria-label={`Show ${slide.shortName}`}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-[var(--hero-panel)]">
                        <ImageWithFallback
                          src={slide.productImage}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[var(--hero-text)]">
                          {slide.shortName}
                        </p>
                        <p className="mt-0.5 text-[10px] font-mono tracking-wider text-[var(--hero-muted)]">
                          {slideNumber(index)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Arrow Controls */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-6 top-1/2 z-40 hidden h-13 w-13 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hero-accent)]/45 bg-[var(--hero-bg)]/80 text-[var(--hero-text)] shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[var(--hero-accent)] hover:bg-[var(--hero-button-bg)] hover:text-[var(--hero-button-text)] hover:scale-105 lg:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-6 top-1/2 z-40 hidden h-13 w-13 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hero-accent)]/45 bg-[var(--hero-bg)]/80 text-[var(--hero-text)] shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[var(--hero-accent)] hover:bg-[var(--hero-button-bg)] hover:text-[var(--hero-button-text)] hover:scale-105 lg:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Mobile Arrow Buttons */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2.5 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hero-accent)]/45 bg-[var(--hero-bg)]/85 text-[var(--hero-accent)] shadow-md backdrop-blur-md lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2.5 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hero-accent)]/45 bg-[var(--hero-bg)]/85 text-[var(--hero-accent)] shadow-md backdrop-blur-md lg:hidden"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Desktop Floating Architectural Thumbnail Dock */}
          <div className="niyamah-hero-rail absolute bottom-3 right-4 sm:bottom-4 sm:right-6 lg:bottom-4 lg:right-10 xl:right-14 2xl:right-16 z-40 hidden w-[min(38rem,calc(100vw-3rem))] overflow-hidden lg:block">
            <div
              data-hero-thumbnail-rail
              className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-2.5 pr-2">
                {safeSlides.slice(0, 6).map((slide, index) => {
                  const selected = index === safeCurrent;
                  return (
                    <button
                      key={slide.id ?? index}
                      ref={(node) => {
                        thumbnailRefs.current[index] = node;
                      }}
                      type="button"
                      onClick={() => goToSlide(index)}
                      aria-pressed={selected}
                      className={cn(
                        "group relative flex min-w-[140px] items-center gap-2.5 overflow-hidden rounded-[2px] border p-2 text-left backdrop-blur-md transition-all duration-300",
                        selected
                          ? "min-w-[180px] border-[var(--hero-accent)] bg-white/85 shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
                          : "border-[var(--hero-text)]/12 bg-white/35 opacity-65 hover:opacity-100 hover:border-[var(--hero-text)]/25",
                      )}
                      aria-label={`Show ${slide.shortName}`}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[2px] bg-[var(--hero-panel)]">
                        <ImageWithFallback
                          src={slide.productImage}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[var(--hero-text)]">
                          {slide.shortName}
                        </p>
                        <p className="mt-0.5 text-[10px] font-mono font-medium tracking-wider text-[var(--hero-muted)]">
                          {slideNumber(index)}
                        </p>
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--hero-accent)] shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
